/**
 * Global Cart System for KV Garage
 * Handles cart functionality across all pages
 */

class GlobalCart {
  constructor() {
    this.cart = this.loadCart();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateCartDisplay();
  }

  bindEvents() {
    // Add to cart buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-to-cart')) {
        e.preventDefault();
        this.addToCart(e.target);
      }
    });

    // Cart toggle (if cart button exists)
    const cartButton = document.querySelector('.cart-toggle');
    if (cartButton) {
      cartButton.addEventListener('click', () => {
        this.toggleCart();
      });
    }
  }

  addToCart(button) {
    const packId = button.dataset.packId;
    const packName = button.dataset.packName;
    const packPrice = parseFloat(button.dataset.packPrice);
    const packImage = button.dataset.packImage;
    const packSlug = button.dataset.packSlug;
    

    // Validate required data
    if (!packId || !packName || isNaN(packPrice)) {
      console.error('Invalid cart item data:', { packId, packName, packPrice });
      alert('Unable to add item to cart - missing required data');
      return;
    }

    // Check if item already exists in cart
    const existingItem = this.cart.find(item => item.id === packId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        id: packId,
        name: packName,
        price: packPrice,
        image: packImage,
        slug: packSlug,
        quantity: 1
      });
    }

    this.saveCart();
    this.updateCartDisplay();
    this.showAddToCartFeedback(button);
  }

  showAddToCartFeedback(button) {
    const originalText = button.textContent;
    button.textContent = 'Added!';
    button.style.backgroundColor = 'var(--primary)';
    button.style.color = '#fff';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
      button.style.color = '';
    }, 1500);
  }

  updateCartDisplay() {
    const cartCount = this.getTotalItems();
    const cartTotal = this.getTotalPrice();
    
    // Update cart count in navigation
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
      cartCountElement.style.display = cartCount > 0 ? 'block' : 'none';
    }

    // Update cart modal total
    const cartTotalAmount = document.querySelector('.cart-total-amount');
    if (cartTotalAmount) {
      cartTotalAmount.textContent = `$${cartTotal.toFixed(2)}`;
    }

    // Update cart items display (if cart modal exists)
    this.updateCartModal();
  }

  updateCartModal() {
    const cartItemsContainer = document.querySelector('.cart-items');
    if (!cartItemsContainer) return;

    if (this.cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
      return;
    }

    const cartHTML = this.cart.map(item => `
      <div class="cart-item">
        <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name || 'Unknown Item'}" class="cart-item-image">
        <div class="cart-item-details">
          <h4>${item.name || 'Unknown Item'}</h4>
          <p>$${(item.price || 0).toFixed(2)} × ${item.quantity || 1}</p>
        </div>
        <button class="remove-item" data-id="${item.id}">×</button>
      </div>
    `).join('');

    cartItemsContainer.innerHTML = cartHTML;

    // Bind remove item events
    cartItemsContainer.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', (e) => {
        this.removeFromCart(e.target.dataset.id);
      });
    });
  }

  removeFromCart(itemId) {
    this.cart = this.cart.filter(item => item.id !== itemId);
    this.saveCart();
    this.updateCartDisplay();
  }

  getTotalItems() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  loadCart() {
    try {
      const cartData = localStorage.getItem('kv-garage-cart');
      const cart = cartData ? JSON.parse(cartData) : [];
      
      // Clean up corrupted items
      return this.cleanupCorruptedItems(cart);
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  cleanupCorruptedItems(cart) {
    const validItems = cart.filter(item => {
      // Check if item has required properties and they're not null/undefined
      const isValid = item && 
                     item.id && 
                     item.name && 
                     typeof item.price === 'number' && 
                     !isNaN(item.price) &&
                     item.quantity > 0;
      
      if (!isValid) {
        console.log('Removing corrupted cart item:', item);
      }
      
      return isValid;
    });
    
    // If we removed items, save the cleaned cart
    if (validItems.length !== cart.length) {
      console.log(`Cleaned cart: removed ${cart.length - validItems.length} corrupted items`);
      this.cart = validItems;
      this.saveCart();
    }
    
    return validItems;
  }

  saveCart() {
    try {
      localStorage.setItem('kv-garage-cart', JSON.stringify(this.cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  toggleCart() {
    const cartModal = document.querySelector('.cart-modal');
    if (cartModal) {
      cartModal.classList.toggle('active');
    }
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartDisplay();
  }

  // Method to clear cart from console for debugging
  debugClearCart() {
    console.log('Clearing cart for debugging');
    this.clearCart();
  }

  // Method to clean corrupted items from console
  debugCleanCart() {
    console.log('Cleaning corrupted cart items');
    this.cart = this.cleanupCorruptedItems(this.cart);
    this.updateCartDisplay();
  }

  // Method to get cart data for checkout
  getCartData() {
    return {
      items: this.cart,
      totalItems: this.getTotalItems(),
      totalPrice: this.getTotalPrice()
    };
  }

  // Cart checkout function - redirects to cart checkout page with Stripe integration
  checkout() {
    if (this.cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // Store cart data in localStorage for the cart checkout page
    localStorage.setItem('kv-garage-cart', JSON.stringify(this.cart));

    // Redirect to cart checkout page for payment processing
    window.location.href = '/cart-checkout/';
  }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.globalCart = new GlobalCart();
  // Make debug methods available globally
  window.debugClearCart = () => window.globalCart.debugClearCart();
  window.debugCleanCart = () => window.globalCart.debugCleanCart();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlobalCart;
}
