document.addEventListener('DOMContentLoaded', function() {
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

            // Share functionality
            const shareButton = document.querySelector('.share-icon');
            shareButton.addEventListener('click', function() {
                if (navigator.share) {
                    navigator.share({
                        title: "DE.ORIGIN T-shirt",
                        text: "Check out this product!",
                        url: window.location.href
                    }).catch(err => {
                        console.log('Error sharing:', err);
                        fallbackShare();
                    });
                } else {
                    fallbackShare();
                }
            });

            function fallbackShare() {
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
    const productName = document.querySelector('h8').textContent.trim();
    const productPrice = document.querySelector('.text-2xl.font-bold').textContent.trim();
    const selectedSize = document.querySelector('.size-button.selected').textContent.trim();
    const quantity = parseInt(document.getElementById('product-quantity').value);
    const productImage = document.querySelector('.main-image').src;
    
    const cartItem = {
        title: productName,
        price: productPrice,
        size: selectedSize,
        quantity: quantity,
        image: productImage
    };
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if item with same title and size already exists in cart
    const existingItemIndex = cart.findIndex(item => 
        item.title === productName && item.size === selectedSize
    );
    
    if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item if it doesn't exist
        cart.push(cartItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count in navbar if exists
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.classList.remove('hidden');
    }
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
    successMessage.textContent = 'Item added to cart!';
    document.body.appendChild(successMessage);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        successMessage.remove();
    }, 3000);
    
    // Open cart if not already open
    if (!cartOpen) {
        toggleCart();
    }
});
    
