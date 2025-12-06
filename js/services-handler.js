/**
 * Services Page Handler
 * Manages all service forms, file uploads, and submissions
 */

// Global state
let currentService = 'visa';
let uploadedFiles = {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeServiceTabs();
    initializeAllForms();
    loadCountriesForVisaForm();
    checkURLParameters();
    checkStoredData();
});

/**
 * Initialize service tabs
 */
function initializeServiceTabs() {
    const tabs = document.querySelectorAll('.service-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const service = this.getAttribute('data-service');
            switchService(service);
        });
    });
    
    // Activate first tab by default
    switchService('visa');
}

/**
 * Switch between services
 */
function switchService(service) {
    currentService = service;
    
    // Update tabs
    document.querySelectorAll('.service-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.service-tab[data-service="${service}"]`).classList.add('active');
    
    // Update forms
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${service}Form`).classList.add('active');
    
    // Scroll to form
    document.querySelector('.service-form-section').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

/**
 * Check URL parameters for pre-selected service
 */
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    
    if (service) {
        switchService(service);
    }
}

/**
 * Check for stored data from other pages
 */
function checkStoredData() {
    // Check for visa check data
    const visaCheckData = sessionStorage.getItem('visaCheckData');
    if (visaCheckData) {
        try {
            const data = JSON.parse(visaCheckData);
            if (data.serviceType === 'visa') {
                switchService('visa');
                prefillVisaForm(data);
                sessionStorage.removeItem('visaCheckData');
            }
        } catch (error) {
            console.error('Error parsing visa check data:', error);
        }
    }
    
    // Check for package request data
    const packageRequest = sessionStorage.getItem('packageRequest');
    if (packageRequest) {
        try {
            const data = JSON.parse(packageRequest);
            switchService('package');
            prefillPackageForm(data);
            // Keep data for now, remove after submission
        } catch (error) {
            console.error('Error parsing package request:', error);
        }
    }
}

/**
 * Prefill visa form with data from visa checker
 */
function prefillVisaForm(data) {
    const form = document.getElementById('visaApplicationForm');
    
    if (data.nationality) {
        form.querySelector('[name="nationality"]').value = data.nationality;
    }
    if (data.destination) {
        form.querySelector('[name="destinationCountry"]').value = data.destination;
    }
    
    NjeyaliAPI.utils.showToast('Form pre-filled with your visa check data', 'success');
}

/**
 * Prefill package form with data from package detail page
 */
function prefillPackageForm(data) {
    const form = document.getElementById('packageRequestForm');
    const packageInfo = document.getElementById('packageInfo');
    const packageInfoName = document.getElementById('packageInfoName');
    const packageInfoPrice = document.getElementById('packageInfoPrice');
    const packageNameInput = document.getElementById('packageNameInput');
    
    if (data.packageName) {
        packageNameInput.value = data.packageName;
        packageInfoName.textContent = data.packageName;
        
        const price = data.currency === 'USD' 
            ? `$${data.price.toLocaleString()}` 
            : `${data.price.toLocaleString()} ${data.currency}`;
        packageInfoPrice.textContent = price;
        
        packageInfo.style.display = 'block';
        
        NjeyaliAPI.utils.showToast('Package information loaded', 'success');
    }
}

/**
 * Load countries for visa form
 */
async function loadCountriesForVisaForm() {
    try {
        const countries = await NjeyaliAPI.visa.getCountries();
        
        const nationalitySelect = document.getElementById('visaNationality');
        const destinationSelect = document.getElementById('visaDestination');
        
        if (countries && countries.length > 0) {
            countries.forEach(country => {
                const option1 = document.createElement('option');
                option1.value = country.code;
                option1.textContent = country.name;
                nationalitySelect.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = country.code;
                option2.textContent = country.name;
                destinationSelect.appendChild(option2);
            });
            
            console.log(`✅ Loaded ${countries.length} countries for visa form`);
        }
    } catch (error) {
        console.error('Error loading countries:', error);
    }
}

/**
 * Initialize all forms
 */
function initializeAllForms() {
    // File upload areas
    initializeFileUploads();
    
    // Form submissions
    document.getElementById('visaApplicationForm').addEventListener('submit', handleVisaSubmission);
    document.getElementById('flightBookingForm').addEventListener('submit', handleFlightSubmission);
    document.getElementById('hotelBookingForm').addEventListener('submit', handleHotelSubmission);
    document.getElementById('conciergeServiceForm').addEventListener('submit', handleConciergeSubmission);
    document.getElementById('corporateTravelForm').addEventListener('submit', handleCorporateSubmission);
    document.getElementById('consultationBookingForm').addEventListener('submit', handleConsultationSubmission);
    document.getElementById('packageRequestForm').addEventListener('submit', handlePackageSubmission);
}

/**
 * Initialize file upload areas
 */
function initializeFileUploads() {
    const uploadAreas = document.querySelectorAll('.file-upload-area');
    
    uploadAreas.forEach(area => {
        const inputName = area.getAttribute('data-input');
        const fileInput = document.querySelector(`input[name="${inputName}"]`);
        const previewDiv = area.nextElementSibling.nextElementSibling;
        
        // Click to upload
        area.addEventListener('click', () => fileInput.click());
        
        // File selected
        fileInput.addEventListener('change', function() {
            handleFileSelection(this, previewDiv);
        });
        
        // Drag and drop
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });
        
        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });
        
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            fileInput.files = e.dataTransfer.files;
            handleFileSelection(fileInput, previewDiv);
        });
    });
}

/**
 * Handle file selection
 */
function handleFileSelection(input, previewDiv) {
    const files = Array.from(input.files);
    
    if (files.length === 0) return;
    
    // Validate files
    for (let file of files) {
        if (!validateFile(file)) {
            input.value = '';
            return;
        }
    }
    
    // Store files
    uploadedFiles[input.name] = files;
    
    // Show preview
    showFilePreview(files, previewDiv, input.name);
    
    NjeyaliAPI.utils.showToast(`${files.length} file(s) selected`, 'success');
}

/**
 * Validate file
 */
function validateFile(file) {
    // Check size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        NjeyaliAPI.utils.showToast(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
        return false;
    }
    
    // Check type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        NjeyaliAPI.utils.showToast(`File "${file.name}" has invalid type. Only JPEG, PNG, and PDF are allowed.`, 'error');
        return false;
    }
    
    return true;
}

/**
 * Show file preview
 */
function showFilePreview(files, previewDiv, inputName) {
    previewDiv.innerHTML = '';
    
    files.forEach((file, index) => {
        const preview = document.createElement('div');
        preview.className = 'alert alert-success d-flex justify-content-between align-items-center';
        preview.innerHTML = `
            <span><i class="fas fa-file"></i> ${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeFile('${inputName}', ${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        previewDiv.appendChild(preview);
    });
}

/**
 * Remove file from upload
 */
function removeFile(inputName, index) {
    if (uploadedFiles[inputName]) {
        uploadedFiles[inputName].splice(index, 1);
        
        // Update preview
        const fileInput = document.querySelector(`input[name="${inputName}"]`);
        const previewDiv = fileInput.parentElement.querySelector('.file-preview');
        
        if (uploadedFiles[inputName].length === 0) {
            delete uploadedFiles[inputName];
            fileInput.value = '';
            previewDiv.innerHTML = '';
        } else {
            showFilePreview(uploadedFiles[inputName], previewDiv, inputName);
        }
        
        NjeyaliAPI.utils.showToast('File removed', 'info');
    }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Handle visa application submission
 */
async function handleVisaSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const formData = new FormData(form);
        
        // Add files
        if (uploadedFiles.passportFile) {
            formData.set('passportFile', uploadedFiles.passportFile[0]);
        }
        if (uploadedFiles.photoFile) {
            formData.set('photoFile', uploadedFiles.photoFile[0]);
        }
        if (uploadedFiles.documentFiles) {
            uploadedFiles.documentFiles.forEach(file => {
                formData.append('documentFiles', file);
            });
        }
        
        const result = await NjeyaliAPI.services.submitVisaApplication(formData);
        
        if (result.success) {
            NjeyaliAPI.utils.showToast(
                `Visa application submitted successfully! Reference: ${result.referenceNumber}`,
                'success'
            );
            
            // Reset form and files
            form.reset();
            uploadedFiles = {};
            document.querySelectorAll('.file-preview').forEach(div => div.innerHTML = '');
            
            // Show success message with details
            setTimeout(() => {
                alert(`Thank you! Your visa application has been submitted.\n\nReference Number: ${result.referenceNumber}\n\nWe'll contact you shortly with next steps. You'll also receive a confirmation email.`);
            }, 1000);
        } else {
            NjeyaliAPI.utils.showToast(result.error || 'Failed to submit visa application', 'error');
        }
    } catch (error) {
        console.error('Visa submission error:', error);
        NjeyaliAPI.utils.showToast('An error occurred. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Visa Application';
    }
}

/**
 * Handle flight booking submission
 */
async function handleFlightSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const result = await NjeyaliAPI.services.submitFlightBooking(data);
        
        if (result.success) {
            NjeyaliAPI.utils.showToast(
                `Flight request submitted! Reference: ${result.referenceNumber}`,
                'success'
            );
            form.reset();
            
            setTimeout(() => {
                alert(`Thank you! Your flight booking request has been submitted.\n\nReference Number: ${result.referenceNumber}\n\nWe'll send you flight options shortly.`);
            }, 1000);
        } else {
            NjeyaliAPI.utils.showToast(result.error || 'Failed to submit flight request', 'error');
        }
    } catch (error) {
        console.error('Flight submission error:', error);
        NjeyaliAPI.utils.showToast('An error occurred. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Flight Request';
    }
}

/**
 * Handle hotel booking submission
 */
async function handleHotelSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const result = await NjeyaliAPI.services.submitHotelBooking(data);
        
        if (result.success) {
            NjeyaliAPI.utils.showToast(
                `Hotel request submitted! Reference: ${result.referenceNumber}`,
                'success'
            );
            form.reset();
            
            setTimeout(() => {
                alert(`Thank you! Your hotel booking request has been submitted.\n\nReference Number: ${result.referenceNumber}\n\nWe'll send you hotel options shortly.`);
            }, 1000);
        } else {
            NjeyaliAPI.utils.showToast(result.error || 'Failed to submit hotel request', 'error');
        }
    } catch (error) {
        console.error('Hotel submission error:', error);
        NjeyaliAPI.utils.showToast('An error occurred. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Hotel Request';
    }
}

/**
 * Handle concierge service submission
 */
async function handleConciergeSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const result = await NjeyaliAPI.services.submitConciergeRequest(data);
        
        if (result.success) {
            NjeyaliAPI.utils.showToast(
                `Concierge request submitted! Reference: ${result.referenceNumber}`,
                'success'
            );
            form.reset();
            
            setTimeout(() => {
                alert(`Thank you! Your concierge service request has been submitted.\n\nReference Number: ${result.referenceNumber}\n\nOur travel experts will create a personalized itinerary for you.`);
            }, 1000);
        } else {
            NjeyaliAPI.utils.showToast(result.error || 'Failed to submit concierge request', 'error');
        }
    } catch (error) {
        console.error('Concierge submission error:', error);
        NjeyaliAPI.utils.showToast('An error occurred. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Concierge Service';
    }
}

/**
 * Handle corporate travel submission
 */
async function handleCorporateSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const formData = new FormData(form);
        
        // Handle checkbox array for services
        const services = [];
        form.querySelectorAll('input[name="services[]"]:checked').forEach(checkbox => {
            services.push(checkbox.value);
        });
        
        const data = Object.fromEntries(formData.entries());
        data.services = services;
        
        const result = await NjeyaliAPI.services.submitCorporateTravel(data);
        
        if (result.success) {
            NjeyaliAPI.utils.showToast(
                `Corporate travel request submitted! Reference: ${result.referenceNumber}`,
                'success'
            );
            form.reset();
            
            setTimeout(() => {
                alert(`Thank you! Your corporate travel request has been submitted.\n\nReference Number: ${result.referenceNumber}\n\nOur corporate travel team will contact you with a tailored proposal.`);
            }, 1000);
        } else {
            NjeyaliAPI.utils.showToast(result.error || 'Failed to submit corporate request', 'error');
        }
    } catch (error) {
        console.error('Corporate submission error:', error);
        NjeyaliAPI.utils.showToast('An error occurred. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Corporate Request';
    }
}

/**
 * Handle consultation booking submission
 */
async function handleConsultationSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const result = await NjeyaliAPI.services.submitConsultation(data);
        
        if (result.success) {
            NjeyaliAPI.utils.showToast(
                `Consultation booked! Reference: ${result.referenceNumber}`,
                'success'
            );
            form.reset();
            
            setTimeout(() => {
                alert(`Thank you! Your consultation has been booked.\n\nReference Number: ${result.referenceNumber}\n\nWe'll confirm your appointment shortly via email.`);
            }, 1000);
        } else {
            NjeyaliAPI.utils.showToast(result.error || 'Failed to book consultation', 'error');
        }
    } catch (error) {
        console.error('Consultation submission error:', error);
        NjeyaliAPI.utils.showToast('An error occurred. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Book Consultation';
    }
}

/**
 * Handle package request submission
 */
async function handlePackageSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Add package ID if available
        const packageRequest = sessionStorage.getItem('packageRequest');
        if (packageRequest) {
            const packageData = JSON.parse(packageRequest);
            data.packageId = packageData.packageId;
        }
        
        const result = await NjeyaliAPI.services.submitPackageRequest(data);
        
        if (result.success) {
            NjeyaliAPI.utils.showToast(
                `Package request submitted! Reference: ${result.referenceNumber}`,
                'success'
            );
            form.reset();
            sessionStorage.removeItem('packageRequest');
            document.getElementById('packageInfo').style.display = 'none';
            
            setTimeout(() => {
                alert(`Thank you! Your package request has been submitted.\n\nReference Number: ${result.referenceNumber}\n\nWe'll send you detailed information and pricing shortly.`);
            }, 1000);
        } else {
            NjeyaliAPI.utils.showToast(result.error || 'Failed to submit package request', 'error');
        }
    } catch (error) {
        console.error('Package submission error:', error);
        NjeyaliAPI.utils.showToast('An error occurred. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Package Information';
    }
}

// Make removeFile function global
window.removeFile = removeFile;