/**
 * Njeyali Travel API Handler
 * Complete API integration for all frontend functionality
 * Version: 1.0.0
 */

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Show toast notification to user
 */
function showToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToast = document.querySelector('.njeyali-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `njeyali-toast njeyali-toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Show loading spinner
 */
function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'njeyali-spinner';
    spinner.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    element.appendChild(spinner);
    return spinner;
}

/**
 * Remove loading spinner
 */
function hideLoading(spinner) {
    if (spinner && spinner.parentNode) {
        spinner.remove();
    }
}

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Upload file with progress tracking
 */
async function uploadFile(endpoint, formData, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress(percentComplete);
                }
            });
        }

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    reject(new Error('Invalid server response'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.message || 'Upload failed'));
                } catch (e) {
                    reject(new Error('Upload failed'));
                }
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error occurred'));
        });

        xhr.open('POST', `${API_BASE_URL}${endpoint}`);
        xhr.send(formData);
    });
}

// ============================================================================
// VISA CHECKER API
// ============================================================================

const VisaCheckerAPI = {
    /**
     * Get all countries for dropdowns
     */
    async getCountries() {
        try {
            const data = await apiRequest('/visa/countries');
            return data.countries || [];
        } catch (error) {
            showToast('Failed to load countries. Please refresh the page.', 'error');
            return [];
        }
    },

    /**
     * Check visa requirements
     */
    async checkVisa(nationality, residency, destination) {
        try {
            const data = await apiRequest('/visa/check', {
                method: 'POST',
                body: JSON.stringify({ nationality, residency, destination })
            });

            return {
                success: true,
                visaRequired: data.visaRequired,
                message: data.message,
                details: data.details,
                processingTime: data.processingTime,
                validityPeriod: data.validityPeriod,
                requirements: data.requirements
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Get visa requirements for a specific country pair
     */
    async getVisaRequirements(fromCountry, toCountry) {
        try {
            const data = await apiRequest(`/visa/requirements?from=${fromCountry}&to=${toCountry}`);
            return data;
        } catch (error) {
            console.error('Failed to get visa requirements:', error);
            return null;
        }
    }
};

// ============================================================================
// SERVICES API
// ============================================================================

const ServicesAPI = {
    /**
     * Submit visa application
     */
    async submitVisaApplication(formData) {
        try {
            const data = await uploadFile('/services/visa-application', formData, (progress) => {
                console.log(`Upload progress: ${progress.toFixed(2)}%`);
            });

            showToast('Visa application submitted successfully! We will contact you shortly.', 'success');
            return { success: true, data };
        } catch (error) {
            showToast(error.message || 'Failed to submit visa application', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Submit flight booking request
     */
    async submitFlightBooking(formData) {
        try {
            const data = await apiRequest('/services/flight-booking', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showToast('Flight booking request submitted! We will send you options soon.', 'success');
            return { success: true, data };
        } catch (error) {
            showToast(error.message || 'Failed to submit flight booking request', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Submit hotel booking request
     */
    async submitHotelBooking(formData) {
        try {
            const data = await apiRequest('/services/hotel-booking', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showToast('Hotel booking request submitted! We will send you options soon.', 'success');
            return { success: true, data };
        } catch (error) {
            showToast(error.message || 'Failed to submit hotel booking request', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Submit travel concierge request
     */
    async submitConciergeRequest(formData) {
        try {
            const data = await apiRequest('/services/concierge', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showToast('Concierge request submitted! Our travel experts will create your perfect itinerary.', 'success');
            return { success: true, data };
        } catch (error) {
            showToast(error.message || 'Failed to submit concierge request', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Submit corporate/group travel request
     */
    async submitCorporateTravel(formData) {
        try {
            const data = await apiRequest('/services/corporate-travel', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showToast('Corporate travel request submitted! We will prepare a custom proposal.', 'success');
            return { success: true, data };
        } catch (error) {
            showToast(error.message || 'Failed to submit corporate travel request', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Submit consultation booking
     */
    async submitConsultation(formData) {
        try {
            const data = await apiRequest('/services/consultation', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showToast('Consultation booked! You will receive a confirmation email shortly.', 'success');
            return { success: true, data };
        } catch (error) {
            showToast(error.message || 'Failed to book consultation', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Submit package request
     */
    async submitPackageRequest(formData) {
        try {
            const data = await apiRequest('/services/package-request', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showToast('Package request submitted! We will send you the details soon.', 'success');
            return { success: true, data };
        } catch (error) {
            showToast(error.message || 'Failed to submit package request', 'error');
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// PACKAGES API
// ============================================================================

const PackagesAPI = {
    /**
     * Get all packages
     */
    async getAllPackages() {
        try {
            const data = await apiRequest('/packages');
            return data.packages || [];
        } catch (error) {
            showToast('Failed to load packages', 'error');
            return [];
        }
    },

    /**
     * Get featured packages for homepage
     */
    async getFeaturedPackages(limit = 6) {
        try {
            const data = await apiRequest(`/packages/featured?limit=${limit}`);
            return data.packages || [];
        } catch (error) {
            console.error('Failed to load featured packages:', error);
            return [];
        }
    },

    /**
     * Get package by ID
     */
    async getPackageById(id) {
        try {
            const data = await apiRequest(`/packages/${id}`);
            return data.package || null;
        } catch (error) {
            showToast('Failed to load package details', 'error');
            return null;
        }
    },

    /**
     * Search packages
     */
    async searchPackages(query) {
        try {
            const data = await apiRequest(`/packages/search?q=${encodeURIComponent(query)}`);
            return data.packages || [];
        } catch (error) {
            showToast('Search failed', 'error');
            return [];
        }
    }
};

// ============================================================================
// CONTACT API
// ============================================================================

const ContactAPI = {
    /**
     * Submit contact form
     */
    async submitContactForm(formData) {
        try {
            const data = await apiRequest('/contact', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showToast('Message sent successfully! We will get back to you soon.', 'success');
            return { success: true, data };
        } catch (error) {
            showToast(error.message || 'Failed to send message', 'error');
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// OCR API (Passport Scanning)
// ============================================================================

const OCRAPI = {
    /**
     * Extract data from passport image
     */
    async extractPassportData(file, onProgress) {
        try {
            const formData = new FormData();
            formData.append('passport', file);

            const data = await uploadFile('/ocr/passport', formData, onProgress);

            if (data.success) {
                showToast('Passport data extracted successfully!', 'success');
                return {
                    success: true,
                    data: data.extractedData
                };
            } else {
                throw new Error(data.message || 'OCR extraction failed');
            }
        } catch (error) {
            showToast('Failed to extract passport data. Please enter details manually.', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Extract data from passport using client-side Tesseract
     * (Fallback if server OCR is not available)
     */
    async extractPassportDataClient(file) {
        // Check if Tesseract is loaded
        if (typeof Tesseract === 'undefined') {
            showToast('OCR library not loaded', 'error');
            return { success: false, error: 'OCR not available' };
        }

        try {
            showToast('Scanning passport... This may take a moment.', 'info');

            const { data: { text } } = await Tesseract.recognize(
                file,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`OCR Progress: ${(m.progress * 100).toFixed(2)}%`);
                        }
                    }
                }
            );

            // Parse MRZ (Machine Readable Zone)
            const extractedData = this.parseMRZ(text);

            if (extractedData) {
                showToast('Passport scanned successfully!', 'success');
                return { success: true, data: extractedData };
            } else {
                throw new Error('Could not extract passport data');
            }
        } catch (error) {
            showToast('Passport scanning failed. Please enter details manually.', 'error');
            return { success: false, error: error.message };
        }
    },

    /**
     * Parse MRZ data from OCR text
     */
    parseMRZ(text) {
        try {
            // MRZ format for passport (3 lines, 44 characters each)
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 30);
            
            if (lines.length < 2) {
                return null;
            }

            // Find MRZ lines (they typically start with P< for passport)
            const mrzLines = lines.filter(line => /^P</.test(line) || /^[A-Z0-9<]{44}$/.test(line));

            if (mrzLines.length < 2) {
                return null;
            }

            const line1 = mrzLines[0];
            const line2 = mrzLines[1];

            // Extract data from MRZ
            const documentType = line1.substring(0, 1); // P for passport
            const issuingCountry = line1.substring(2, 5).replace(/</g, '');
            const names = line1.substring(5).split('<<');
            const surname = names[0].replace(/</g, ' ').trim();
            const givenNames = names[1] ? names[1].replace(/</g, ' ').trim() : '';

            const passportNumber = line2.substring(0, 9).replace(/</g, '');
            const nationality = line2.substring(10, 13).replace(/</g, '');
            const dob = line2.substring(13, 19); // YYMMDD
            const gender = line2.substring(20, 21);
            const expiryDate = line2.substring(21, 27); // YYMMDD

            // Format dates
            const formatDate = (yymmdd) => {
                const yy = parseInt(yymmdd.substring(0, 2));
                const mm = yymmdd.substring(2, 4);
                const dd = yymmdd.substring(4, 6);
                const year = yy > 50 ? `19${yy}` : `20${yy}`;
                return `${year}-${mm}-${dd}`;
            };

            return {
                fullName: `${givenNames} ${surname}`.trim(),
                surname: surname,
                givenNames: givenNames,
                passportNumber: passportNumber,
                nationality: nationality,
                dateOfBirth: formatDate(dob),
                gender: gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : 'Other',
                expiryDate: formatDate(expiryDate),
                issuingCountry: issuingCountry,
                documentType: 'Passport',
                mrzLine1: line1,
                mrzLine2: line2
            };
        } catch (error) {
            console.error('MRZ parsing error:', error);
            return null;
        }
    }
};

// ============================================================================
// TESTIMONIALS API
// ============================================================================

const TestimonialsAPI = {
    /**
     * Get all testimonials
     */
    async getTestimonials() {
        try {
            const data = await apiRequest('/testimonials');
            return data.testimonials || [];
        } catch (error) {
            console.error('Failed to load testimonials:', error);
            return [];
        }
    },

    /**
     * Submit new testimonial
     */
    async submitTestimonial(formData) {
        try {
            const data = await apiRequest('/testimonials', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            showToast('Thank you for your feedback!', 'success');
            return { success: true, data };
        } catch (error) {
            showToast('Failed to submit testimonial', 'error');
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// NEWSLETTER API
// ============================================================================

const NewsletterAPI = {
    /**
     * Subscribe to newsletter
     */
    async subscribe(email) {
        try {
            const data = await apiRequest('/newsletter/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            showToast('Successfully subscribed to our newsletter!', 'success');
            return { success: true, data };
        } catch (error) {
            showToast(error.message || 'Subscription failed', 'error');
            return { success: false, error: error.message };
        }
    }
};

// ============================================================================
// FORM VALIDATION UTILITIES
// ============================================================================

const FormValidation = {
    /**
     * Validate email
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate phone number
     */
    isValidPhone(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        // Check if it's between 10-15 digits
        return cleaned.length >= 10 && cleaned.length <= 15;
    },

    /**
     * Validate passport number
     */
    isValidPassport(passport) {
        // Most passports are 6-9 alphanumeric characters
        const re = /^[A-Z0-9]{6,9}$/i;
        return re.test(passport);
    },

    /**
     * Validate date is in the future
     */
    isFutureDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return date >= now;
    },

    /**
     * Validate file type
     */
    isValidFileType(file, allowedTypes) {
        return allowedTypes.includes(file.type);
    },

    /**
     * Validate file size (in MB)
     */
    isValidFileSize(file, maxSizeMB) {
        return file.size <= maxSizeMB * 1024 * 1024;
    },

    /**
     * Show field error
     */
    showFieldError(fieldElement, message) {
        // Remove existing error
        this.clearFieldError(fieldElement);

        // Add error class
        fieldElement.classList.add('is-invalid');

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        fieldElement.parentNode.appendChild(errorDiv);
    },

    /**
     * Clear field error
     */
    clearFieldError(fieldElement) {
        fieldElement.classList.remove('is-invalid');
        const errorDiv = fieldElement.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    /**
     * Validate entire form
     */
    validateForm(formElement) {
        let isValid = true;
        const requiredFields = formElement.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);

                // Type-specific validation
                if (field.type === 'email' && !this.isValidEmail(field.value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                    isValid = false;
                }

                if (field.type === 'tel' && !this.isValidPhone(field.value)) {
                    this.showFieldError(field, 'Please enter a valid phone number');
                    isValid = false;
                }

                if (field.type === 'date' && field.dataset.futureOnly && !this.isFutureDate(field.value)) {
                    this.showFieldError(field, 'Please select a future date');
                    isValid = false;
                }
            }
        });

        return isValid;
    }
};

// ============================================================================
// EXPORT API OBJECT
// ============================================================================

const NjeyaliAPI = {
    visa: VisaCheckerAPI,
    services: ServicesAPI,
    packages: PackagesAPI,
    contact: ContactAPI,
    ocr: OCRAPI,
    testimonials: TestimonialsAPI,
    newsletter: NewsletterAPI,
    validation: FormValidation,
    utils: {
        showToast,
        showLoading,
        hideLoading,
        apiRequest,
        uploadFile
    }
};

// Make it globally available
window.NjeyaliAPI = NjeyaliAPI;

console.log('✅ Njeyali Travel API initialized successfully');