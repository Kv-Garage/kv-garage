/**
 * Cart Stripe Payment Handler
 * Handles Stripe payment processing for cart purchases
 */

class CartStripePayment {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.paymentIntentId = null;
        this.cartData = null;
        this.customerData = null;
    }

    async initializeStripe() {
        try {
            if (this.stripe) {
                return true;
            }

            // Check if Stripe is loaded
            if (typeof Stripe === 'undefined') {
                console.error('Stripe.js not loaded');
                return false;
            }

            // Get Stripe publishable key from API
            const configResponse = await fetch('http://localhost:3001/api/payments/config');
            const config = await configResponse.json();
            
            if (!config.success) {
                throw new Error('Failed to get Stripe configuration');
            }
            
            // Initialize Stripe with publishable key
            this.stripe = Stripe(config.publishable_key);
            
            console.log('Stripe initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Stripe:', error);
            return false;
        }
    }

    async createCartPaymentForm(containerId, cartData, customerData) {
        try {
            // Initialize Stripe if not already done
            if (!this.stripe) {
                const initialized = await this.initializeStripe();
                if (!initialized) {
                    throw new Error('Failed to initialize Stripe');
                }
            }

            // Calculate total amount
            const totalAmount = cartData.reduce((total, item) => total + (item.price * item.quantity), 0);

            // Create payment intent for cart
            const requestData = {
                cart_items: cartData,
                customer_email: customerData.email,
                customer_name: customerData.name,
                amount: totalAmount
            };

            console.log('Creating cart payment intent with data:', requestData);

            const response = await fetch('http://localhost:3001/api/payments/create-cart-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            console.log('Payment intent response:', result);

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
                throw new Error(`Container with id '${containerId}' not found`);
            }

            this.paymentElement.mount(container);

            console.log('Cart payment form created successfully');
            return true;

        } catch (error) {
            console.error('Error creating cart payment form:', error);
            return false;
        }
    }

    async processCartPayment() {
        const paymentButton = document.getElementById('payment-button');
        const paymentError = document.getElementById('payment-error');
        const paymentSuccess = document.getElementById('payment-success');

        if (!this.stripe || !this.paymentElement) {
            this.showError('Payment system not initialized');
            return;
        }

        // Show loading state
        paymentButton.disabled = true;
        paymentButton.classList.add('loading');
        paymentButton.textContent = 'Processing...';

        try {
            // Confirm payment
            const { error, paymentIntent } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: `${window.location.origin}/cart-checkout-success/`,
                },
                redirect: 'if_required'
            });

            if (error) {
                this.showError(error.message);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                // Payment succeeded, confirm with backend
                await this.confirmCartPayment(paymentIntent.id);
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            this.showError('An unexpected error occurred. Please try again.');
        } finally {
            // Reset button state
            paymentButton.disabled = false;
            paymentButton.classList.remove('loading');
            paymentButton.textContent = 'Complete Payment';
        }
    }

    async confirmCartPayment(paymentIntentId) {
        try {
            const response = await fetch('http://localhost:3001/api/payments/confirm-cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_intent_id: paymentIntentId,
                    cart_items: this.cartData,
                    customer_email: this.customerData.email,
                    customer_name: this.customerData.name
                })
            });

            const result = await response.json();

            if (result.success) {
                // Store order data for success page
                localStorage.setItem('kv-garage-last-order', JSON.stringify(result.order));
                
                // Clear cart
                localStorage.removeItem('kv-garage-cart');
                
                // Redirect to success page
                window.location.href = `/cart-checkout-success/?order_id=${result.order.id}`;
            } else {
                throw new Error(result.error || 'Failed to confirm payment');
            }

        } catch (error) {
            console.error('Error confirming cart payment:', error);
            this.showError('Payment confirmation failed. Please contact support.');
        }
    }

    showError(message) {
        const paymentError = document.getElementById('payment-error');
        if (paymentError) {
            paymentError.textContent = message;
            paymentError.style.display = 'block';
            paymentError.style.color = '#dc2626';
        }
        console.error('Payment error:', message);
    }

    showSuccess(message) {
        const paymentSuccess = document.getElementById('payment-success');
        if (paymentSuccess) {
            paymentSuccess.textContent = message;
            paymentSuccess.style.display = 'block';
            paymentSuccess.style.color = '#059669';
        }
    }
}

// Initialize global instance
window.cartStripePayment = new CartStripePayment();
