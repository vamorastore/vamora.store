// Product Page Specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart count
    updateCartCount();
    
    // Size buttons selection
    const sizeButtons = document.querySelectorAll('.size-button');
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            sizeButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Quantity adjustment
    const decrementButton = document.getElementById('decrement-quantity');
    const incrementButton = document.getElementById('increment-quantity');
    const quantityInput = document.getElementById('product-quantity');

    decrementButton.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
        }
    });

    incrementButton.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        quantityInput.value = value + 1;
    });

    // Size guide toggle
    const sizeGuideBtn = document.getElementById('size-guide-btn');
    const sizeGuideContainer = document.getElementById('size-guide-container');

    sizeGuideBtn.addEventListener('click', function(e) {
        e.preventDefault();
        sizeGuideContainer.classList.toggle('open');
        this.textContent = sizeGuideContainer.classList.contains('open') ? 'Hide guide' : 'Size guide';
    });

    // Input validation
    quantityInput.addEventListener('change', function() {
        if (this.value < 1) this.value = 1;
    });

    // Dropdown toggle functionality
    const dropdownButtons = document.querySelectorAll('.dropdown-button');
    dropdownButtons.forEach(button => {
        button.addEventListener('click', function() {
            const container = this.nextElementSibling;
            const isOpen = container.classList.contains('open');
            
            // Close all other dropdowns
            document.querySelectorAll('.dropdown-container').forEach(dropdown => {
                if (dropdown !== container) {
                    dropdown.classList.remove('open');
                }
            });
            
            // Toggle the clicked dropdown
            container.classList.toggle('open');
            
            // Toggle the open class on the button
            this.classList.toggle('open');
        });
    });

    // Share functionality
    const shareButton = document.querySelector('.share-icon');
    shareButton.addEventListener('click', function() {
        if (navigator.share) {
            // Use the Web Share API if available
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

    function fallbackShare() {
        // Copy the URL to clipboard
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                alert('Link copied to clipboard!');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                prompt('Copy this link:', window.location.href);
            });
    }

    // Add to cart functionality
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    addToCartBtn.addEventListener('click', function() {
        addToCart();
    });

    // Buy now functionality
    const buyNowBtn = document.getElementById('buy-now-btn');
    buyNowBtn.addEventListener('click', function() {
        addToCart();
        toggleCart();
    });

    // Change main image function
    window.changeMainImage = function(newSrc) {
        document.querySelector('.main-image').src = newSrc;
    };
});

function addToCart() {
    // Get product details
    const productName = document.querySelector('h1').textContent;
    const productPrice = document.querySelector('.text-2xl.font-bold').textContent;
    const selectedSize = document.querySelector('.size-button.selected').textContent;
    const quantity = parseInt(document.getElementById('product-quantity').value);
    const productImage = document.querySelector('.main-image').src;
    
    // Create cart item object
    const cartItem = {
        title: productName,
        price: productPrice,
        size: selectedSize,
        quantity: quantity,
        image: productImage,
        id: 'de-origin-tshirt-' + selectedSize.toLowerCase() // Unique ID for this product + size
    };
    
    // Get existing cart or create new one
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if this item (same product + size) already exists in cart
    const existingItemIndex = cart.findIndex(item => 
        item.id === cartItem.id
    );
    
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
