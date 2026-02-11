/**
 * Stripe Payment Integration
 * Handles payment processing for pack purchases
 */

class StripePayment {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.paymentIntentId = null;
        this.isProcessing = false;
        
        this.init();
    }
    
    async init() {
        // Don't initialize immediately - wait for explicit call
    }
    
    async initializeStripe() {
        try {
            // Try to get Stripe configuration from API
            let publishableKey = null;
            
            try {
                const apiBaseUrl = window.location.hostname === 'localhost' 
                    ? 'http://localhost:3001/api' 
                    : '/api';
                const configResponse = await fetch(`${apiBaseUrl}/payments/config`);
                const config = await configResponse.json();
                
                if (config.success && config.publishable_key) {
                    publishableKey = config.publishable_key;
                }
            } catch (apiError) {
                console.warn('Could not fetch Stripe config from API:', apiError);
            }
            
            // Fallback to test key if no API key is available
            if (!publishableKey) {
                publishableKey = 'pk_test_51SIugHRTEiNjfzF8N8zMrBYuVgL8AkoDbvv6nFbNMlWIbmI8EcrFare32qkRIhXYi2g0UuXl7GigHse0ZqFceHc100xTPdXfg2';
                console.warn('Using fallback Stripe test key');
            }
            
            // Initialize Stripe with analytics disabled to prevent blocking issues
            this.stripe = Stripe(publishableKey, {
                // Use a stable API version
                apiVersion: '2023-10-16',
                // Disable analytics to prevent ad blocker issues
                betas: [],
                // Add error handling for blocked requests
                onError: (error) => {
                    console.warn('Stripe analytics blocked by browser:', error);
                    // Don't show this error to users as it doesn't affect payment functionality
                }
            });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            this.showError('Failed to initialize payment system. Please refresh the page.');
            return false;
        }
    }
    
    async createPaymentForm(containerId, packData, customerData) {
        try {
            // Initialize Stripe if not already done
            if (!this.stripe) {
                const initialized = await this.initializeStripe();
                if (!initialized) {
                    throw new Error('Failed to initialize Stripe');
                }
            }
            
            // Create payment intent
            const requestData = {
                pack_id: packData.id,
                customer_email: customerData.email,
                customer_name: customerData.name,
                amount: packData.price
            };
            
            
            const response = await fetch('http://localhost:3001/api/payments/create-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to create payment intent');
            }
            
            this.paymentIntentId = result.payment_intent_id;
            
            // Create Elements
            this.elements = this.stripe.elements({
                clientSecret: result.client_secret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#0570de',
                        colorBackground: '#ffffff',
                        colorText: '#30313d',
                        colorDanger: '#df1b41',
                        fontFamily: 'Ideal Sans, system-ui, sans-serif',
                        spacingUnit: '2px',
                        borderRadius: '4px',
                    }
                }
            });
            
            // Create payment element
            this.paymentElement = this.elements.create('payment');
            
            // Mount payment element
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container ${containerId} not found`);
            }
            
            container.innerHTML = '';
            this.paymentElement.mount(`#${containerId}`);
            
            return true;
            
        } catch (error) {
            console.error('Failed to create payment form:', error);
            this.showError('Failed to create payment form. Please try again.');
            return false;
        }
    }
    
    async processPayment() {
        if (this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        this.showProcessing(true);
        
        try {
            if (!this.stripe || !this.elements) {
                throw new Error('Payment form not initialized');
            }
            
            // Check if payment intent is already succeeded
            if (this.paymentIntentId) {
                try {
                    const paymentIntent = await this.stripe.retrievePaymentIntent(this.paymentIntentId);
                    if (paymentIntent.status === 'succeeded') {
                        await this.confirmPaymentWithBackend();
                        return;
                    }
                } catch (error) {
                    console.warn('Could not retrieve payment intent status:', error);
                }
            }
            
            // Confirm payment
            const {error} = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success.html`,
                },
                redirect: 'if_required'
            });
            
            if (error) {
                // Handle specific error cases
                if (error.code === 'payment_intent_unexpected_state') {
                    await this.confirmPaymentWithBackend();
                    return;
                }
                throw new Error(error.message);
            }
            
            // Payment succeeded, confirm with backend
            await this.confirmPaymentWithBackend();
            
        } catch (error) {
            console.error('Payment processing error:', error);
            this.showError(error.message || 'Payment failed. Please try again.');
        } finally {
            this.isProcessing = false;
            this.showProcessing(false);
        }
    }
    
    async confirmPaymentWithBackend() {
        try {
            
            const confirmData = {
                payment_intent_id: this.paymentIntentId,
                pack_id: this.packData?.id,
                customer_email: this.customerData?.email,
                customer_name: this.customerData?.name
            };
            
            
            const response = await fetch('http://localhost:3001/api/payments/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(confirmData)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to confirm payment');
            }
            
            // Store order data for success page
            if (result.order) {
                localStorage.setItem('lastOrder', JSON.stringify(result.order));
            }
            
            // Show success message
            this.showSuccess('Payment successful! Your order has been created.');
            
            // Redirect to success page
            setTimeout(() => {
                window.location.href = '/payment-success.html';
            }, 2000);
            
        } catch (error) {
            console.error('Backend confirmation error:', error);
            throw error;
        }
    }
    
    showProcessing(show) {
        const button = document.getElementById('payment-button');
        if (button) {
            if (show) {
                button.disabled = true;
                button.innerHTML = '<span class="spinner"></span> Processing...';
            } else {
                button.disabled = false;
                button.innerHTML = 'Complete Payment';
            }
        }
    }
    
    showError(message) {
        const errorContainer = document.getElementById('payment-error');
        if (errorContainer) {
            errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
            errorContainer.style.display = 'block';
        } else {
            alert(message);
        }
    }
    
    showSuccess(message) {
        const successContainer = document.getElementById('payment-success');
        if (successContainer) {
            successContainer.innerHTML = `<div class="success-message">${message}</div>`;
            successContainer.style.display = 'block';
        }
    }
    
    // Method to set pack and customer data
    setPaymentData(packData, customerData) {
        this.packData = packData;
        this.customerData = customerData;
        console.log('Payment data set:', { packData, customerData });
        console.log('Pack ID set:', packData?.id, 'Type:', typeof packData?.id);
    }
}

// Initialize global Stripe payment instance
window.stripePayment = new StripePayment();

// Global error handler for blocked Stripe requests
window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('r.stripe.com')) {
        console.warn('Stripe analytics request blocked by browser - this is normal and does not affect payment functionality');
        event.preventDefault();
        return false;
    }
});

// Handle unhandled promise rejections for blocked requests
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('r.stripe.com')) {
        console.warn('Stripe analytics request blocked by browser - this is normal and does not affect payment functionality');
        event.preventDefault();
        return false;
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StripePayment;
}
