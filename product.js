// Product Page JavaScript - product.js

// Initialize product page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart count display
    updateCartCount();
    
    // Set up size selection
    setupSizeSelection();
    
    // Set up quantity controls
    setupQuantityControls();
    
    // Set up size guide toggle
    setupSizeGuide();
    
    // Set up dropdown sections (Wash Care, Return Policy)
    setupDropdowns();
    
    // Set up share functionality
    setupShareButton();
    
    // Set up add to cart and buy now buttons
    setupProductButtons();
    
    // Set up thumbnail image gallery
    setupImageGallery();
});

// Size Selection Functionality
function setupSizeSelection() {
    const sizeButtons = document.querySelectorAll('.size-button');
    
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all buttons
            sizeButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            this.classList.add('selected');
        });
    });
}

// Quantity Controls Functionality
function setupQuantityControls() {
    const decrementButton = document.getElementById('decrement-quantity');
    const incrementButton = document.getElementById('increment-quantity');
    const quantityInput = document.getElementById('product-quantity');
    
    // Decrease quantity
    decrementButton.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
        }
    });
    
    // Increase quantity
    incrementButton.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        quantityInput.value = value + 1;
    });
    
    // Validate input
    quantityInput.addEventListener('change', function() {
        if (this.value < 1 || isNaN(this.value)) {
            this.value = 1;
        }
    });
}

// Size Guide Toggle Functionality
function setupSizeGuide() {
    const sizeGuideBtn = document.getElementById('size-guide-btn');
    const sizeGuideContainer = document.getElementById('size-guide-container');
    
    if (sizeGuideBtn && sizeGuideContainer) {
        sizeGuideBtn.addEventListener('click', function(e) {
            e.preventDefault();
            sizeGuideContainer.classList.toggle('open');
            this.textContent = sizeGuideContainer.classList.contains('open') ? 
                'Hide guide' : 'Size guide';
        });
    }
}

// Dropdown Sections Functionality
function setupDropdowns() {
    const dropdownButtons = document.querySelectorAll('.dropdown-button');
    
    dropdownButtons.forEach(button => {
        button.addEventListener('click', function() {
            const container = this.nextElementSibling;
            
            // Close all other dropdowns
            document.querySelectorAll('.dropdown-container').forEach(dropdown => {
                if (dropdown !== container) {
                    dropdown.classList.remove('open');
                }
            });
            
            // Toggle the clicked dropdown
            container.classList.toggle('open');
            this.classList.toggle('open');
        });
    });
}

// Share Button Functionality
function setupShareButton() {
    const shareButton = document.querySelector('.share-icon');
    
    if (shareButton) {
        shareButton.addEventListener('click', function() {
            if (navigator.share) {
                // Use Web Share API if available
                navigator.share({
                    title: "DE.ORIGIN T-shirt",
                    text: "crafted for those who lead, blending premium fabric, timeless style, and unmatched comfort—because excellence is meant to be worn.",
                    url: window.location.href
                }).catch(err => {
                    console.log('Error sharing:', err);
                    fallbackShare();
                });
            } else {
                // Fallback for browsers without Web Share API
                fallbackShare();
            }
        });
    }
}

// Fallback share function
function fallbackShare() {
    // Copy the URL to clipboard
    navigator.clipboard.writeText(window.location.href)
        .then(() => {
            showSuccessMessage('Link copied to clipboard!');
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            prompt('Copy this link:', window.location.href);
        });
}

// Product Buttons Functionality
function setupProductButtons() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCart);
    }
    
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function() {
            addToCart();
            toggleCart();
        });
    }
}

// Add to Cart Functionality
function addToCart() {
    // Get product details
    const productName = document.querySelector('h1').textContent;
    const productPrice = document.querySelector('.text-2xl.font-bold').textContent;
    const selectedSize = document.querySelector('.size-button.selected');
    
    if (!selectedSize) {
        showErrorMessage('Please select a size');
        return;
    }
    
    const size = selectedSize.textContent;
    const quantity = parseInt(document.getElementById('product-quantity').value);
    const productImage = document.querySelector('.main-image').src;
    
    // Create cart item object
    const cartItem = {
        title: productName,
        price: productPrice,
        size: size,
        quantity: quantity,
        image: productImage,
        id: 'de-origin-tshirt-' + size.toLowerCase() // Unique ID for this product + size
    };
    
    // Get existing cart or create new one
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if this item (same product + size) already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === cartItem.id);
    
    if (existingItemIndex !== -1) {
        // Update quantity if item already exists
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item to cart
        cart.push(cartItem);
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Show success message
    showSuccessMessage('Item added to cart!');
}

// Image Gallery Functionality
function setupImageGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.querySelector('.main-image');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Update main image source
            mainImage.src = this.src;
            
            // Optional: Add active state to clicked thumbnail
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Helper function to show success messages
function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Helper function to show error messages
function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Update cart count in navigation
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
}
