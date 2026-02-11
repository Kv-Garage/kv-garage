/**
 * Contact Page Functionality
 * Handles contact form submission and live chat integration
 */

// Use global API_BASE_URL from shared-admin-auth.js
// const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001/api';

class ContactManager {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFormValidation();
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
        }

        // Real-time validation
        const inputs = this.form?.querySelectorAll('input, select, textarea');
        inputs?.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    setupFormValidation() {
        // Add validation rules
        this.validationRules = {
            name: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s]+$/,
                message: 'Please enter a valid name (letters and spaces only)'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                required: false,
                pattern: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
            },
            subject: {
                required: true,
                message: 'Please select a subject'
            },
            message: {
                required: true,
                minLength: 10,
                message: 'Please enter a message with at least 10 characters'
            }
        };
    }

    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
        }
        
        e.target.value = value;
    }

    validateField(field) {
        const fieldName = field.name;
        const rules = this.validationRules[fieldName];
        
        if (!rules) return true;

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (rules.required && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(fieldName)} is required`;
        }
        // Pattern validation
        else if (value && rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message;
        }
        // Min length validation
        else if (value && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = rules.message;
        }

        this.setFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    clearFieldError(field) {
        this.setFieldValidation(field, true, '');
    }

    setFieldValidation(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        
        if (isValid) {
            formGroup.classList.remove('error');
            formGroup.classList.add('success');
        } else {
            formGroup.classList.remove('success');
            formGroup.classList.add('error');
        }

        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        if (!isValid && errorMessage) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = errorMessage;
            formGroup.appendChild(errorElement);
        }
    }

    getFieldLabel(fieldName) {
        const labels = {
            name: 'Full Name',
            email: 'Email Address',
            phone: 'Phone Number',
            business: 'Business Name',
            subject: 'Subject',
            message: 'Message'
        };
        return labels[fieldName] || fieldName;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const submitBtn = this.form.querySelector('.submit-btn');
        const formData = new FormData(this.form);
        
        // Validate all fields
        const inputs = this.form.querySelectorAll('input, select, textarea');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showNotification('Please fix the errors above', 'error');
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            // Convert FormData to object
            const data = Object.fromEntries(formData.entries());
            
            // Send to backend (you'll need to implement this endpoint)
            const response = await fetch(`${window.API_BASE_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showNotification('Message sent successfully! We\'ll get back to you within 24 hours.', 'success');
                this.form.reset();
                this.clearAllValidation();
            } else {
                throw new Error('Failed to send message');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Failed to send message. Please try again or contact us directly.', 'error');
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    clearAllValidation() {
        const formGroups = this.form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error', 'success');
            const errorMessage = group.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '300001',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '400px',
            wordWrap: 'break-word',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Live Chat Integration
function openLiveChat() {
    // This would integrate with your live chat service (e.g., Intercom, Zendesk, etc.)
    // For now, we'll show a placeholder
    alert('Live chat will be available soon! In the meantime, please call us at (616) 228-2244 or email support@kvgarage.com');
    
    // Example integration with Intercom:
    // if (window.Intercom) {
    //     window.Intercom('show');
    // }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ContactManager();
});

// Export for potential use in other modules
// Export removed - using as regular script
