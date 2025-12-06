/**
 * Njeyali Travel - API Integration Layer
 * Connects frontend forms to backend API
 * Handles: Visa Checker, Service Requests, Passport OCR
 */

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Change to your production URL when deploying

// Utility Functions
const showLoader = () => {
    const loader = document.getElementById('overlayer');
    if (loader) loader.style.display = 'block';
};

const hideLoader = () => {
    const loader = document.getElementById('overlayer');
    if (loader) loader.style.display = 'none';
};

const showNotification = (message, type = 'success') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification-toast`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        animation: slideInRight 0.5s ease;
    `;
    notification.innerHTML = `
        <button type="button" class="close" style="position: absolute; top: 10px; right: 10px;">&times;</button>
        <div>${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
    
    // Close button
    notification.querySelector('.close').addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    });
};

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==========================================
// VISA CHECKER FUNCTIONALITY
// ==========================================

let countriesCache = [];

// Load countries on page load
const loadCountries = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/visa/countries`);
        const data = await response.json();
        
        if (data.success) {
            countriesCache = data.countries;
            populateCountryDropdowns();
        }
    } catch (error) {
        console.error('Error loading countries:', error);
        showNotification('Error loading countries. Please refresh the page.', 'danger');
    }
};

// Populate all country dropdowns
const populateCountryDropdowns = () => {
    const dropdowns = ['nationality', 'residency', 'destination', 'visaDestination'];
    
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            // Clear existing options except first
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add countries
            countriesCache.forEach(country => {
                const option = document.createElement('option');
                option.value = country.code;
                option.textContent = country.name;
                select.appendChild(option);
            });
        }
    });
};

// Handle Visa Checker Form Submission
const initVisaChecker = () => {
    const form = document.getElementById('visaCheckerForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nationality = document.getElementById('nationality').value;
        const residency = document.getElementById('residency').value;
        const destination = document.getElementById('destination').value;
        
        if (!nationality || !residency || !destination) {
            showNotification('Please fill in all fields', 'warning');
            return;
        }
        
        showLoader();
        
        try {
            const response = await fetch(`${API_BASE_URL}/visa/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nationality,
                    residency,
                    destination
                })
            });
            
            const data = await response.json();
            hideLoader();
            
            if (data.success) {
                displayVisaResult(data.result);
            } else {
                showNotification(data.message || 'Error checking visa requirements', 'danger');
            }
        } catch (error) {
            hideLoader();
            console.error('Error checking visa:', error);
            showNotification('Error connecting to server. Please try again.', 'danger');
        }
    });
};

// Display Visa Result
const displayVisaResult = (result) => {
    const resultDiv = document.getElementById('visaResult');
    const titleEl = document.getElementById('resultTitle');
    const messageEl = document.getElementById('resultMessage');
    const actionsEl = document.getElementById('resultActions');
    
    if (!resultDiv) return;
    
    // Determine alert type
    let alertClass = 'alert-info';
    if (result.visaRequired === 'no') alertClass = 'alert-success';
    if (result.visaRequired === 'yes') alertClass = 'alert-warning';
    
    // Update content
    resultDiv.querySelector('.alert').className = `alert ${alertClass}`;
    titleEl.textContent = result.title || 'Visa Information';
    
    let message = `<p><strong>${result.message}</strong></p>`;
    
    if (result.visaType) {
        message += `<p><strong>Visa Type:</strong> ${result.visaType}</p>`;
    }
    
    if (result.processingTime) {
        message += `<p><strong>Processing Time:</strong> ${result.processingTime}</p>`;
    }
    
    if (result.fees) {
        message += `<p><strong>Fees:</strong></p><ul>`;
        if (result.fees.consular) message += `<li>Consular Fee: $${result.fees.consular}</li>`;
        if (result.fees.service) message += `<li>Service Fee: $${result.fees.service}</li>`;
        if (result.fees.total) message += `<li><strong>Total: $${result.fees.total}</strong></li>`;
        message += `</ul>`;
    }
    
    if (result.documents && result.documents.length > 0) {
        message += `<p><strong>Required Documents:</strong></p><ul>`;
        result.documents.forEach(doc => {
            message += `<li>${doc}</li>`;
        });
        message += `</ul>`;
    }
    
    if (result.notes) {
        message += `<p class="mt-3"><em>${result.notes}</em></p>`;
    }
    
    messageEl.innerHTML = message;
    
    // Actions
    actionsEl.innerHTML = `
        <a href="services.html?service=visa" class="btn btn-primary">Apply for Visa</a>
        <button type="button" class="btn btn-outline-secondary" onclick="document.getElementById('visaResult').style.display='none'">Close</button>
    `;
    
    // Show result
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// ==========================================
// SERVICE REQUEST FORM FUNCTIONALITY
// ==========================================

// Handle Service Type Change
const initServiceForm = () => {
    const form = document.getElementById('serviceRequestForm');
    if (!form) return;
    
    const serviceTypeSelect = document.getElementById('serviceType');
    const serviceFields = document.querySelectorAll('.service-fields');
    
    // Hide all service fields initially
    serviceFields.forEach(field => field.style.display = 'none');
    
    // Show relevant fields when service type changes
    serviceTypeSelect.addEventListener('change', (e) => {
        serviceFields.forEach(field => field.style.display = 'none');
        
        const selectedService = e.target.value;
        
        if (selectedService === 'visa') {
            document.getElementById('visaFields').style.display = 'block';
        } else if (selectedService === 'flight') {
            document.getElementById('flightFields').style.display = 'block';
        } else if (selectedService === 'hotel') {
            document.getElementById('hotelFields').style.display = 'block';
        } else if (selectedService === 'concierge') {
            document.getElementById('conciergeFields').style.display = 'block';
        } else if (selectedService === 'corporate') {
            document.getElementById('corporateFields').style.display = 'block';
        } else if (selectedService === 'consultation') {
            document.getElementById('consultationFields').style.display = 'block';
        } else if (selectedService === 'package') {
            document.getElementById('packageFields').style.display = 'block';
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const serviceType = document.getElementById('serviceType').value;
        
        if (!serviceType) {
            showNotification('Please select a service type', 'warning');
            return;
        }
        
        showLoader();
        
        try {
            // Prepare form data
            const formData = new FormData(form);
            
            // Handle travel types (checkboxes)
            const travelTypes = [];
            document.querySelectorAll('input[name="travelTypes[]"]:checked').forEach(checkbox => {
                travelTypes.push(checkbox.value);
            });
            if (travelTypes.length > 0) {
                formData.delete('travelTypes[]');
                formData.append('travelTypes', JSON.stringify(travelTypes));
            }
            
            // Submit to API
            const response = await fetch(`${API_BASE_URL}/services/request`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            hideLoader();
            
            if (data.success) {
                showNotification(
                    `Request submitted successfully!<br>
                    <strong>Reference Number: ${data.referenceNumber}</strong><br>
                    Check your email for confirmation.`,
                    'success'
                );
                
                // Reset form
                form.reset();
                document.querySelectorAll('.service-fields').forEach(field => field.style.display = 'none');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                showNotification(data.message || 'Error submitting request', 'danger');
            }
        } catch (error) {
            hideLoader();
            console.error('Error submitting service request:', error);
            showNotification('Error connecting to server. Please try again.', 'danger');
        }
    });
    
    // Initialize passport OCR
    initPassportOCR();
};

// ==========================================
// PASSPORT OCR FUNCTIONALITY
// ==========================================

const initPassportOCR = () => {
    const passportUpload = document.getElementById('passportUpload');
    if (!passportUpload) return;
    
    passportUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please upload an image file', 'warning');
            return;
        }
        
        showLoader();
        
        try {
            const formData = new FormData();
            formData.append('passport', file);
            
            const response = await fetch(`${API_BASE_URL}/services/ocr`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            hideLoader();
            
            if (data.success && data.extracted) {
                const extracted = data.extracted;
                
                // Auto-fill form fields
                if (extracted.fullName) {
                    const nameField = document.getElementById('fullName');
                    if (nameField && !nameField.value) {
                        nameField.value = extracted.fullName;
                    }
                }
                
                if (extracted.nationality) {
                    const nationalityField = document.getElementById('nationality');
                    if (nationalityField && !nationalityField.value) {
                        // Try to match country name to code
                        const countryMatch = countriesCache.find(c => 
                            c.name.toLowerCase() === extracted.nationality.toLowerCase()
                        );
                        if (countryMatch) {
                            nationalityField.value = countryMatch.code;
                        }
                    }
                }
                
                if (extracted.passportNumber) {
                    // Store passport number (you might want to add a hidden field for this)
                    console.log('Passport Number:', extracted.passportNumber);
                }
                
                showNotification('Passport information extracted successfully!', 'success');
            } else {
                showNotification('Could not extract passport information. Please fill manually.', 'warning');
            }
        } catch (error) {
            hideLoader();
            console.error('Error processing passport:', error);
            showNotification('Error processing passport image', 'danger');
        }
    });
};

// ==========================================
// URL PARAMETERS HANDLING
// ==========================================

const handleURLParameters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    
    if (service) {
        const serviceTypeSelect = document.getElementById('serviceType');
        if (serviceTypeSelect) {
            serviceTypeSelect.value = service;
            serviceTypeSelect.dispatchEvent(new Event('change'));
            
            // Scroll to form
            setTimeout(() => {
                serviceTypeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Load countries for dropdowns
    loadCountries();
    
    // Initialize visa checker
    initVisaChecker();
    
    // Initialize service form
    initServiceForm();
    
    // Handle URL parameters
    handleURLParameters();
});

// ==========================================
// EXPORT FOR EXTERNAL USE
// ==========================================

// Make functions available globally if needed
window.NjeyaliAPI = {
    showNotification,
    loadCountries,
    API_BASE_URL
};