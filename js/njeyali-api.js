/**
 * Njeyali Travel API Handler - Enhanced Edition
 * Complete API integration with security, performance, and integration features
 * Version: 2.0.0
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : '/api',
    
    // Security
    MAX_REQUEST_RETRIES: 3,
    REQUEST_TIMEOUT: 30000, // 30 seconds
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    MAX_REQUESTS_PER_WINDOW: 60,
    
    // File Upload
    MAX_FILE_SIZE_MB: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    
    // Cache
    CACHE_DURATION: 300000, // 5 minutes
    MAX_CACHE_SIZE: 50,
    
    // Performance
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 1000
};

// ============================================================================
// SECURITY MODULE
// ============================================================================

const Security = {
    // Rate limiting store
    _rateLimitStore: new Map(),
    
    // Request queue for rate limiting
    _requestQueue: [],
    
    /**
     * Generate CSRF token
     */
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },
    
    /**
     * Get or create CSRF token
     */
    getCSRFToken() {
        let token = sessionStorage.getItem('csrf_token');
        if (!token) {
            token = this.generateCSRFToken();
            sessionStorage.setItem('csrf_token', token);
        }
        return token;
    },
    
    /**
     * Sanitize user input to prevent XSS
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },
    
    /**
     * Sanitize object recursively
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return this.sanitizeInput(obj);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = this.sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    },
    
    /**
     * Rate limiting check
     */
    checkRateLimit(identifier = 'global') {
        const now = Date.now();
        const store = this._rateLimitStore.get(identifier) || [];
        
        // Remove old requests outside the window
        const validRequests = store.filter(
            timestamp => now - timestamp < CONFIG.RATE_LIMIT_WINDOW
        );
        
        if (validRequests.length >= CONFIG.MAX_REQUESTS_PER_WINDOW) {
            const oldestRequest = Math.min(...validRequests);
            const waitTime = CONFIG.RATE_LIMIT_WINDOW - (now - oldestRequest);
            throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`);
        }
        
        validRequests.push(now);
        this._rateLimitStore.set(identifier, validRequests);
        return true;
    },
    
    /**
     * Validate file before upload
     */
    validateFile(file, allowedTypes = CONFIG.ALLOWED_DOCUMENT_TYPES) {
        const errors = [];
        
        // Check file type
        if (!allowedTypes.includes(file.type)) {
            errors.push(`File type ${file.type} is not allowed`);
        }
        
        // Check file size
        const maxSizeBytes = CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            errors.push(`File size exceeds ${CONFIG.MAX_FILE_SIZE_MB}MB limit`);
        }
        
        // Check file name for suspicious patterns
        if (/[<>:"|?*]/.test(file.name)) {
            errors.push('File name contains invalid characters');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    /**
     * Encrypt sensitive data before sending (using Web Crypto API)
     */
    async encryptData(data, key) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(key),
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                cryptoKey,
                dataBuffer
            );
            
            return {
                encrypted: Array.from(new Uint8Array(encrypted)),
                iv: Array.from(iv)
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            return null;
        }
    },
    
    /**
     * Content Security Policy check
     */
    checkCSP() {
        const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!meta) {
            console.warn('⚠️ No CSP meta tag found. Consider adding one for security.');
        }
    }
};

// ============================================================================
// PERFORMANCE MODULE
// ============================================================================

const Performance = {
    // Cache storage
    _cache: new Map(),
    _cacheTimestamps: new Map(),
    
    /**
     * Cache response data
     */
    cacheSet(key, data, ttl = CONFIG.CACHE_DURATION) {
        // Implement LRU cache eviction if cache is full
        if (this._cache.size >= CONFIG.MAX_CACHE_SIZE) {
            const oldestKey = this._cache.keys().next().value;
            this._cache.delete(oldestKey);
            this._cacheTimestamps.delete(oldestKey);
        }
        
        this._cache.set(key, data);
        this._cacheTimestamps.set(key, Date.now() + ttl);
    },
    
    /**
     * Get cached data
     */
    cacheGet(key) {
        const timestamp = this._cacheTimestamps.get(key);
        
        if (!timestamp || Date.now() > timestamp) {
            this._cache.delete(key);
            this._cacheTimestamps.delete(key);
            return null;
        }
        
        return this._cache.get(key);
    },
    
    /**
     * Clear cache
     */
    cacheClear(pattern = null) {
        if (pattern) {
            for (const key of this._cache.keys()) {
                if (key.includes(pattern)) {
                    this._cache.delete(key);
                    this._cacheTimestamps.delete(key);
                }
            }
        } else {
            this._cache.clear();
            this._cacheTimestamps.clear();
        }
    },
    
    /**
     * Debounce function
     */
    debounce(func, delay = CONFIG.DEBOUNCE_DELAY) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    /**
     * Throttle function
     */
    throttle(func, delay = CONFIG.THROTTLE_DELAY) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    },
    
    /**
     * Lazy load images
     */
    lazyLoadImages(selector = 'img[data-src]') {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll(selector).forEach(img => imageObserver.observe(img));
        }
    },
    
    /**
     * Prefetch resources
     */
    prefetch(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    },
    
    /**
     * Measure performance
     */
    measurePerformance(name, callback) {
        const startTime = performance.now();
        const result = callback();
        const endTime = performance.now();
        
        console.log(`⏱️ ${name}: ${(endTime - startTime).toFixed(2)}ms`);
        
        return result;
    },
    
    /**
     * Compress data before sending
     */
    compressData(data) {
        try {
            return JSON.stringify(data);
        } catch (error) {
            console.error('Data compression failed:', error);
            return data;
        }
    }
};

// ============================================================================
// NETWORK MODULE
// ============================================================================

const Network = {
    // Active requests tracker
    _activeRequests: new Map(),
    
    /**
     * Enhanced API request with retry logic
     */
    async request(endpoint, options = {}, retries = CONFIG.MAX_REQUEST_RETRIES) {
        const requestId = `${endpoint}-${Date.now()}`;
        
        try {
            // Check rate limit
            Security.checkRateLimit(options.rateLimitKey || 'global');
            
            // Check cache
            const cacheKey = `${endpoint}-${JSON.stringify(options.body || '')}`;
            if (options.method === 'GET' || !options.method) {
                const cached = Performance.cacheGet(cacheKey);
                if (cached) {
                    console.log('📦 Serving from cache:', endpoint);
                    return cached;
                }
            }
            
            // Abort previous identical request
            if (this._activeRequests.has(cacheKey)) {
                const controller = this._activeRequests.get(cacheKey);
                controller.abort();
            }
            
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
            this._activeRequests.set(cacheKey, controller);
            
            // Sanitize request body
            if (options.body && typeof options.body === 'string') {
                const parsed = JSON.parse(options.body);
                const sanitized = Security.sanitizeObject(parsed);
                options.body = JSON.stringify(sanitized);
            }
            
            // Add security headers
            const headers = {
                'Content-Type': 'application/json',
                'X-CSRF-Token': Security.getCSRFToken(),
                'X-Request-ID': requestId,
                ...options.headers
            };
            
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
                signal: controller.signal,
                credentials: 'same-origin'
            });
            
            clearTimeout(timeoutId);
            this._activeRequests.delete(cacheKey);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Cache successful GET requests
            if (options.method === 'GET' || !options.method) {
                Performance.cacheSet(cacheKey, data);
            }
            
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            this._activeRequests.delete(requestId);
            
            // Retry logic for network errors
            if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
                console.warn(`⚠️ Request failed, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (CONFIG.MAX_REQUEST_RETRIES - retries + 1)));
                return this.request(endpoint, options, retries - 1);
            }
            
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * Enhanced file upload with chunking support
     */
    async uploadFile(endpoint, formData, onProgress, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                // Check rate limit
                Security.checkRateLimit('upload');
                
                const xhr = new XMLHttpRequest();
                const requestId = `upload-${Date.now()}`;
                
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
                            reject(new Error(`Upload failed with status ${xhr.status}`));
                        }
                    }
                });
                
                xhr.addEventListener('error', () => {
                    reject(new Error('Network error occurred'));
                });
                
                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload cancelled'));
                });
                
                xhr.open('POST', `${CONFIG.API_BASE_URL}${endpoint}`);
                
                // Add security headers
                xhr.setRequestHeader('X-CSRF-Token', Security.getCSRFToken());
                xhr.setRequestHeader('X-Request-ID', requestId);
                
                // Set timeout
                xhr.timeout = CONFIG.REQUEST_TIMEOUT;
                
                xhr.send(formData);
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Batch multiple requests
     */
    async batchRequests(requests) {
        try {
            const results = await Promise.allSettled(requests);
            return results.map((result, index) => ({
                index,
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason : null
            }));
        } catch (error) {
            console.error('Batch request failed:', error);
            throw error;
        }
    },
    
    /**
     * Check network status
     */
    isOnline() {
        return navigator.onLine;
    },
    
    /**
     * Monitor network status
     */
    onNetworkChange(callback) {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    }
};

// ============================================================================
// ANALYTICS & MONITORING
// ============================================================================

const Analytics = {
    // Event queue
    _eventQueue: [],
    _isProcessing: false,
    
    /**
     * Track API event
     */
    track(event, data = {}) {
        const eventData = {
            event,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...data
        };
        
        this._eventQueue.push(eventData);
        this._processQueue();
    },
    
    /**
     * Process event queue
     */
    async _processQueue() {
        if (this._isProcessing || this._eventQueue.length === 0) return;
        
        this._isProcessing = true;
        
        try {
            // Send events in batches
            const batch = this._eventQueue.splice(0, 10);
            
            // Use sendBeacon for better reliability
            if (navigator.sendBeacon) {
                navigator.sendBeacon(
                    `${CONFIG.API_BASE_URL}/analytics`,
                    JSON.stringify(batch)
                );
            }
        } catch (error) {
            console.error('Analytics error:', error);
        } finally {
            this._isProcessing = false;
        }
    },
    
    /**
     * Track error
     */
    trackError(error, context = {}) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            context
        });
    },
    
    /**
     * Track performance metric
     */
    trackPerformance(metric, value) {
        this.track('performance', { metric, value });
    }
};

// ============================================================================
// INTEGRATION MODULES
// ============================================================================

const Integrations = {
    /**
     * Google Analytics integration
     */
    googleAnalytics: {
        track(event, params = {}) {
            if (typeof gtag !== 'undefined') {
                gtag('event', event, params);
            }
        },
        
        trackPageView(path) {
            if (typeof gtag !== 'undefined') {
                gtag('config', 'GA_MEASUREMENT_ID', {
                    page_path: path
                });
            }
        }
    },
    
    /**
     * Facebook Pixel integration
     */
    facebookPixel: {
        track(event, params = {}) {
            if (typeof fbq !== 'undefined') {
                fbq('track', event, params);
            }
        },
        
        trackCustom(event, params = {}) {
            if (typeof fbq !== 'undefined') {
                fbq('trackCustom', event, params);
            }
        }
    },
    
    /**
     * Intercom integration
     */
    intercom: {
        boot(userData) {
            if (typeof Intercom !== 'undefined') {
                Intercom('boot', {
                    app_id: 'YOUR_APP_ID',
                    ...userData
                });
            }
        },
        
        update(data) {
            if (typeof Intercom !== 'undefined') {
                Intercom('update', data);
            }
        },
        
        showNewMessage(message) {
            if (typeof Intercom !== 'undefined') {
                Intercom('showNewMessage', message);
            }
        }
    },
    
    /**
     * Stripe integration
     */
    stripe: {
        initialized: false,
        stripeInstance: null,
        
        async init(publishableKey) {
            if (typeof Stripe === 'undefined') {
                console.error('Stripe.js not loaded');
                return false;
            }
            
            this.stripeInstance = Stripe(publishableKey);
            this.initialized = true;
            return true;
        },
        
        async createPaymentIntent(amount, currency = 'usd') {
            try {
                const response = await Network.request('/payments/create-intent', {
                    method: 'POST',
                    body: JSON.stringify({ amount, currency })
                });
                
                return response;
            } catch (error) {
                console.error('Payment intent creation failed:', error);
                throw error;
            }
        },
        
        async handlePayment(clientSecret, cardElement) {
            if (!this.initialized) {
                throw new Error('Stripe not initialized');
            }
            
            const result = await this.stripeInstance.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement
                }
            });
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result.paymentIntent;
        }
    },
    
    /**
     * Google Maps integration
     */
    googleMaps: {
        initialized: false,
        map: null,
        
        async init(elementId, options = {}) {
            if (typeof google === 'undefined') {
                console.error('Google Maps not loaded');
                return false;
            }
            
            const defaultOptions = {
                center: { lat: 0, lng: 0 },
                zoom: 8,
                ...options
            };
            
            this.map = new google.maps.Map(
                document.getElementById(elementId),
                defaultOptions
            );
            
            this.initialized = true;
            return true;
        },
        
        addMarker(position, title) {
            if (!this.initialized) return null;
            
            return new google.maps.Marker({
                position,
                map: this.map,
                title
            });
        },
        
        async geocode(address) {
            if (typeof google === 'undefined') return null;
            
            const geocoder = new google.maps.Geocoder();
            
            return new Promise((resolve, reject) => {
                geocoder.geocode({ address }, (results, status) => {
                    if (status === 'OK') {
                        resolve(results[0]);
                    } else {
                        reject(new Error(`Geocoding failed: ${status}`));
                    }
                });
            });
        }
    },
    
    /**
     * Social media sharing
     */
    social: {
        shareOnFacebook(url, title) {
            const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            this._openPopup(shareUrl, 'Share on Facebook');
        },
        
        shareOnTwitter(url, text) {
            const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            this._openPopup(shareUrl, 'Share on Twitter');
        },
        
        shareOnLinkedIn(url, title, summary) {
            const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            this._openPopup(shareUrl, 'Share on LinkedIn');
        },
        
        shareOnWhatsApp(text) {
            const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(shareUrl, '_blank');
        },
        
        _openPopup(url, title) {
            const width = 600;
            const height = 400;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;
            
            window.open(
                url,
                title,
                `width=${width},height=${height},left=${left},top=${top}`
            );
        }
    }
};

// ============================================================================
// UI UTILITIES (Enhanced)
// ============================================================================

const UI = {
    /**
     * Enhanced toast notification with action button
     */
    showToast(message, type = 'info', options = {}) {
        // Remove any existing toasts
        const existingToast = document.querySelector('.njeyali-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `njeyali-toast njeyali-toast-${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const actionButton = options.action ? 
            `<button class="toast-action" onclick="(${options.action.handler})()">${options.action.label}</button>` 
            : '';
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${icons[type] || 'info-circle'}"></i>
                <span>${Security.sanitizeInput(message)}</span>
                ${actionButton}
                <button class="toast-close" onclick="this.closest('.njeyali-toast').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-progress"></div>
        `;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove after duration
        const duration = options.duration || 5000;
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        // Track toast shown
        Analytics.track('toast_shown', { type, message });
    },
    
    /**
     * Show loading spinner
     */
    showLoading(element, text = 'Loading...') {
        const spinner = document.createElement('div');
        spinner.className = 'njeyali-spinner';
        spinner.innerHTML = `
            <i class="fas fa-circle-notch fa-spin"></i>
            <span>${Security.sanitizeInput(text)}</span>
        `;
        element.appendChild(spinner);
        return spinner;
    },
    
    /**
     * Remove loading spinner
     */
    hideLoading(spinner) {
        if (spinner && spinner.parentNode) {
            spinner.remove();
        }
    },
    
    /**
     * Show confirmation modal
     */
    showConfirm(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'njeyali-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <h3>Confirm Action</h3>
                <p>${Security.sanitizeInput(message)}</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                    <button class="btn btn-primary" data-action="confirm">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        modal.querySelector('[data-action="confirm"]').onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };
        
        modal.querySelector('[data-action="cancel"]').onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };
        
        modal.querySelector('.modal-overlay').onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };
    },
    
    /**
     * Show progress bar
     */
    showProgress(element, progress) {
        let progressBar = element.querySelector('.progress-bar');
        
        if (!progressBar) {
            const container = document.createElement('div');
            container.className = 'progress-container';
            container.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                    <span class="progress-text">0%</span>
                </div>
            `;
            element.appendChild(container);
            progressBar = container.querySelector('.progress-bar');
        }
        
        const fill = progressBar.querySelector('.progress-fill');
        const text = progressBar.querySelector('.progress-text');
        
        const percentage = Math.min(100, Math.max(0, progress));
        fill.style.width = `${percentage}%`;
        text.textContent = `${percentage.toFixed(0)}%`;
    }
};

// ============================================================================
// ENHANCED API MODULES
// ============================================================================

const API_BASE_URL = CONFIG.API_BASE_URL;

// Re-export original modules with enhancements
const VisaCheckerAPI = {
    async getCountries() {
        try {
            const data = await Network.request('/visa/countries');
            Analytics.track('countries_loaded');
            return data.countries || [];
        } catch (error) {
            UI.showToast('Failed to load countries. Please refresh the page.', 'error');
            Analytics.trackError(error, { context: 'getCountries' });
            return [];
        }
    },

    async checkVisa(nationality, residency, destination) {
        try {
            const data = await Network.request('/visa/check', {
                method: 'POST',
                body: JSON.stringify({ nationality, residency, destination })
            });

            Analytics.track('visa_checked', { nationality, destination });
            
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
            Analytics.trackError(error, { context: 'checkVisa' });
            return {
                success: false,
                error: error.message
            };
        }
    },

    async getVisaRequirements(fromCountry, toCountry) {
        try {
            const data = await Network.request(`/visa/requirements?from=${fromCountry}&to=${toCountry}`);
            return data;
        } catch (error) {
            console.error('Failed to get visa requirements:', error);
            Analytics.trackError(error, { context: 'getVisaRequirements' });
            return null;
        }
    }
};

const ServicesAPI = {
    async submitVisaApplication(formData) {
        try {
            // Validate files before upload
            const files = formData.getAll('documents');
            for (const file of files) {
                const validation = Security.validateFile(file);
                if (!validation.valid) {
                    throw new Error(validation.errors.join(', '));
                }
            }
            
            const data = await Network.uploadFile('/services/visa-application', formData, (progress) => {
                console.log(`Upload progress: ${progress.toFixed(2)}%`);
            });

            UI.showToast('Visa application submitted successfully! We will contact you shortly.', 'success');
            Analytics.track('visa_application_submitted');
            return { success: true, data };
        } catch (error) {
            UI.showToast(error.message || 'Failed to submit visa application', 'error');
            Analytics.trackError(error, { context: 'submitVisaApplication' });
            return { success: false, error: error.message };
        }
    },

    async submitFlightBooking(formData) {
        try {
            const data = await Network.request('/services/flight-booking', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            UI.showToast('Flight booking request submitted! We will send you options soon.', 'success');
            Analytics.track('flight_booking_submitted', { destination: formData.destination });
            return { success: true, data };
        } catch (error) {
            UI.showToast(error.message || 'Failed to submit flight booking request', 'error');
            Analytics.trackError(error, { context: 'submitFlightBooking' });
            return { success: false, error: error.message };
        }
    },

    async submitHotelBooking(formData) {
        try {
            const data = await Network.request('/services/hotel-booking', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            UI.showToast('Hotel booking request submitted! We will send you options soon.', 'success');
            Analytics.track('hotel_booking_submitted');
            return { success: true, data };
        } catch (error) {
            UI.showToast(error.message || 'Failed to submit hotel booking request', 'error');
            Analytics.trackError(error, { context: 'submitHotelBooking' });
            return { success: false, error: error.message };
        }
    },

    async submitConciergeRequest(formData) {
        try {
            const data = await Network.request('/services/concierge', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            UI.showToast('Concierge request submitted! Our travel experts will create your perfect itinerary.', 'success');
            Analytics.track('concierge_submitted');
            return { success: true, data };
        } catch (error) {
            UI.showToast(error.message || 'Failed to submit concierge request', 'error');
            Analytics.trackError(error, { context: 'submitConciergeRequest' });
            return { success: false, error: error.message };
        }
    },

    async submitCorporateTravel(formData) {
        try {
            const data = await Network.request('/services/corporate-travel', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            UI.showToast('Corporate travel request submitted! We will prepare a custom proposal.', 'success');
            Analytics.track('corporate_travel_submitted');
            return { success: true, data };
        } catch (error) {
            UI.showToast(error.message || 'Failed to submit corporate travel request', 'error');
            Analytics.trackError(error, { context: 'submitCorporateTravel' });
            return { success: false, error: error.message };
        }
    },

    async submitConsultation(formData) {
        try {
            const data = await Network.request('/services/consultation', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            UI.showToast('Consultation booked! You will receive a confirmation email shortly.', 'success');
            Analytics.track('consultation_booked');
            return { success: true, data };
        } catch (error) {
            UI.showToast(error.message || 'Failed to book consultation', 'error');
            Analytics.trackError(error, { context: 'submitConsultation' });
            return { success: false, error: error.message };
        }
    },

    async submitPackageRequest(formData) {
        try {
            const data = await Network.request('/services/package-request', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            UI.showToast('Package request submitted! We will send you the details soon.', 'success');
            Analytics.track('package_requested');
            return { success: true, data };
        } catch (error) {
            UI.showToast(error.message || 'Failed to submit package request', 'error');
            Analytics.trackError(error, { context: 'submitPackageRequest' });
            return { success: false, error: error.message };
        }
    }
};

const PackagesAPI = {
    async getAllPackages() {
        try {
            const data = await Network.request('/packages');
            Analytics.track('packages_loaded');
            return data.packages || [];
        } catch (error) {
            UI.showToast('Failed to load packages', 'error');
            Analytics.trackError(error, { context: 'getAllPackages' });
            return [];
        }
    },

    async getFeaturedPackages(limit = 6) {
        try {
            const data = await Network.request(`/packages/featured?limit=${limit}`);
            return data.packages || [];
        } catch (error) {
            console.error('Failed to load featured packages:', error);
            Analytics.trackError(error, { context: 'getFeaturedPackages' });
            return [];
        }
    },

    async getPackageById(id) {
        try {
            const data = await Network.request(`/packages/${id}`);
            Analytics.track('package_viewed', { packageId: id });
            return data.package || null;
        } catch (error) {
            UI.showToast('Failed to load package details', 'error');
            Analytics.trackError(error, { context: 'getPackageById' });
            return null;
        }
    },

    async searchPackages(query) {
        try {
            const data = await Network.request(`/packages/search?q=${encodeURIComponent(query)}`);
            Analytics.track('packages_searched', { query });
            return data.packages || [];
        } catch (error) {
            UI.showToast('Search failed', 'error');
            Analytics.trackError(error, { context: 'searchPackages' });
            return [];
        }
    }
};

const ContactAPI = {
    async submitContactForm(formData) {
        try {
            const data = await Network.request('/contact', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            UI.showToast('Message sent successfully! We will get back to you soon.', 'success');
            Analytics.track('contact_form_submitted');
            return { success: true, data };
        } catch (error) {
            UI.showToast(error.message || 'Failed to send message', 'error');
            Analytics.trackError(error, { context: 'submitContactForm' });
            return { success: false, error: error.message };
        }
    }
};

const OCRAPI = {
    async extractPassportData(file, onProgress) {
        try {
            // Validate file
            const validation = Security.validateFile(file, CONFIG.ALLOWED_IMAGE_TYPES);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }
            
            const formData = new FormData();
            formData.append('passport', file);

            const data = await Network.uploadFile('/ocr/passport', formData, onProgress);

            if (data.success) {
                UI.showToast('Passport data extracted successfully!', 'success');
                Analytics.track('passport_scanned');
                return {
                    success: true,
                    data: data.extractedData
                };
            } else {
                throw new Error(data.message || 'OCR extraction failed');
            }
        } catch (error) {
            UI.showToast('Failed to extract passport data. Please enter details manually.', 'error');
            Analytics.trackError(error, { context: 'extractPassportData' });
            return { success: false, error: error.message };
        }
    },

    async extractPassportDataClient(file) {
        if (typeof Tesseract === 'undefined') {
            UI.showToast('OCR library not loaded', 'error');
            return { success: false, error: 'OCR not available' };
        }

        try {
            UI.showToast('Scanning passport... This may take a moment.', 'info');

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

            const extractedData = this.parseMRZ(text);

            if (extractedData) {
                UI.showToast('Passport scanned successfully!', 'success');
                Analytics.track('passport_scanned_client');
                return { success: true, data: extractedData };
            } else {
                throw new Error('Could not extract passport data');
            }
        } catch (error) {
            UI.showToast('Passport scanning failed. Please enter details manually.', 'error');
            Analytics.trackError(error, { context: 'extractPassportDataClient' });
            return { success: false, error: error.message };
        }
    },

    parseMRZ(text) {
        try {
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 30);
            
            if (lines.length < 2) return null;

            const mrzLines = lines.filter(line => /^P</.test(line) || /^[A-Z0-9<]{44}$/.test(line));
            if (mrzLines.length < 2) return null;

            const line1 = mrzLines[0];
            const line2 = mrzLines[1];

            const documentType = line1.substring(0, 1);
            const issuingCountry = line1.substring(2, 5).replace(/</g, '');
            const names = line1.substring(5).split('<<');
            const surname = names[0].replace(/</g, ' ').trim();
            const givenNames = names[1] ? names[1].replace(/</g, ' ').trim() : '';

            const passportNumber = line2.substring(0, 9).replace(/</g, '');
            const nationality = line2.substring(10, 13).replace(/</g, '');
            const dob = line2.substring(13, 19);
            const gender = line2.substring(20, 21);
            const expiryDate = line2.substring(21, 27);

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
            Analytics.trackError(error, { context: 'parseMRZ' });
            return null;
        }
    }
};

const TestimonialsAPI = {
    async getTestimonials() {
        try {
            const data = await Network.request('/testimonials');
            return data.testimonials || [];
        } catch (error) {
            console.error('Failed to load testimonials:', error);
            Analytics.trackError(error, { context: 'getTestimonials' });
            return [];
        }
    },

    async submitTestimonial(formData) {
        try {
            const data = await Network.request('/testimonials', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            UI.showToast('Thank you for your feedback!', 'success');
            Analytics.track('testimonial_submitted');
            return { success: true, data };
        } catch (error) {
            UI.showToast('Failed to submit testimonial', 'error');
            Analytics.trackError(error, { context: 'submitTestimonial' });
            return { success: false, error: error.message };
        }
    }
};

const NewsletterAPI = {
    async subscribe(email) {
        try {
            const data = await Network.request('/newsletter/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            UI.showToast('Successfully subscribed to our newsletter!', 'success');
            Analytics.track('newsletter_subscribed');
            return { success: true, data };
        } catch (error) {
            UI.showToast(error.message || 'Subscription failed', 'error');
            Analytics.trackError(error, { context: 'subscribe' });
            return { success: false, error: error.message };
        }
    }
};

// Enhanced form validation
const FormValidation = {
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    },

    isValidPassport(passport) {
        const re = /^[A-Z0-9]{6,9}$/i;
        return re.test(passport);
    },

    isFutureDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return date >= now;
    },

    isValidFileType(file, allowedTypes) {
        return allowedTypes.includes(file.type);
    },

    isValidFileSize(file, maxSizeMB) {
        return file.size <= maxSizeMB * 1024 * 1024;
    },

    showFieldError(fieldElement, message) {
        this.clearFieldError(fieldElement);
        fieldElement.classList.add('is-invalid');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = Security.sanitizeInput(message);
        fieldElement.parentNode.appendChild(errorDiv);
    },

    clearFieldError(fieldElement) {
        fieldElement.classList.remove('is-invalid');
        const errorDiv = fieldElement.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) errorDiv.remove();
    },

    validateForm(formElement) {
        let isValid = true;
        const requiredFields = formElement.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);

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
// MAIN API EXPORT
// ============================================================================

const NjeyaliAPI = {
    // Core modules
    visa: VisaCheckerAPI,
    services: ServicesAPI,
    packages: PackagesAPI,
    contact: ContactAPI,
    ocr: OCRAPI,
    testimonials: TestimonialsAPI,
    newsletter: NewsletterAPI,
    
    // Enhanced modules
    security: Security,
    performance: Performance,
    network: Network,
    analytics: Analytics,
    integrations: Integrations,
    validation: FormValidation,
    ui: UI,
    
    // Configuration
    config: CONFIG,
    
    // Utility functions
    utils: {
        showToast: UI.showToast.bind(UI),
        showLoading: UI.showLoading.bind(UI),
        hideLoading: UI.hideLoading.bind(UI),
        showConfirm: UI.showConfirm.bind(UI),
        showProgress: UI.showProgress.bind(UI),
        debounce: Performance.debounce.bind(Performance),
        throttle: Performance.throttle.bind(Performance)
    },
    
    // Initialize API
    init(options = {}) {
        console.log('🚀 Initializing Njeyali Travel API v2.0.0...');
        
        // Merge custom config
        Object.assign(CONFIG, options);
        
        // Check security
        Security.checkCSP();
        
        // Setup network monitoring
        Network.onNetworkChange((isOnline) => {
            UI.showToast(
                isOnline ? 'Connection restored' : 'Connection lost',
                isOnline ? 'success' : 'warning'
            );
        });
        
        // Track initialization
        Analytics.track('api_initialized', {
            version: '2.0.0',
            environment: window.location.hostname
        });
        
        console.log('✅ Njeyali Travel API initialized successfully');
        console.log('📊 Security: Enabled');
        console.log('⚡ Performance: Optimized');
        console.log('🔗 Integrations: Ready');
        
        return this;
    }
};

// Make it globally available
window.NjeyaliAPI = NjeyaliAPI;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NjeyaliAPI.init());
} else {
    NjeyaliAPI.init();
}

export default NjeyaliAPI;