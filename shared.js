// shared.js

// Initialize user data if not exists
if (!localStorage.getItem('user')) {
    localStorage.setItem('user', JSON.stringify({
        name: '',
        email: '',
        addresses: []
    }));
}

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartOpen = false;
let searchOpen = false;
let dropdownOpen = false;

// Function to close all open elements
function closeAllOpenElements() {
    // Close cart
    if (cartOpen) {
        document.getElementById('cartOverlay').classList.remove('active');
        document.getElementById('cartBackdrop').classList.remove('active');
        cartOpen = false;
    }
    
    // Close search
    if (searchOpen) {
        document.querySelector('.search-input-container').style.display = 'none';
        searchOpen = false;
    }
    
    // Close dropdown menu
    if (dropdownOpen) {
        document.getElementById('dropdownMenu').classList.add('hidden');
        dropdownOpen = false;
    }
    
    // Close mobile menu
    const mobileMenuContent = document.getElementById('mobileMenuContent');
    if (mobileMenuContent && mobileMenuContent.classList.contains('active')) {
        mobileMenuContent.classList.remove('active');
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        if (mobileMenuButton) {
            mobileMenuButton.querySelector('i').classList.add('fa-bars');
            mobileMenuButton.querySelector('i').classList.remove('fa-times');
        }
    }
}

// Toggle cart function
function toggleCart() {
    // Close other open elements
    if (!cartOpen) {
        closeAllOpenElements();
    }
    
    cartOpen = !cartOpen;
    const cartOverlay = document.getElementById('cartOverlay');
    const cartBackdrop = document.getElementById('cartBackdrop');
    
    if (cartOverlay && cartBackdrop) {
        cartOverlay.classList.toggle('active', cartOpen);
        cartBackdrop.classList.toggle('active', cartOpen);
        
        if (cartOpen) {
            renderCart();
        }
    }
}

// Close cart function
function closeCart() {
    cartOpen = false;
    const cartOverlay = document.getElementById('cartOverlay');
    const cartBackdrop = document.getElementById('cartBackdrop');
    
    if (cartOverlay && cartBackdrop) {
        cartOverlay.classList.remove('active');
        cartBackdrop.classList.remove('active');
    }
}

function renderCart() {
    const cartList = document.getElementById('cartList');
    if (!cartList) return;
    
    cartList.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="text-gray-500 text-center py-8">Your cart is empty</p>';
        const cartTotal = document.getElementById('cartTotal');
        if (cartTotal) {
            cartTotal.textContent = '₹ 0.00';
        }
        return;
    }

    cart.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.classList.add('flex', 'justify-between', 'items-start', 'border-b', 'pb-4');
        listItem.innerHTML = `
            <div class="flex items-start">
                <img src="${item.image}" alt="${item.title}" class="w-16 h-16 rounded-lg mr-4 object-cover"/>
                <div>
                    <p class="font-medium">${item.title}</p>
                    <p class="text-sm text-gray-500">Size: ${item.size}</p>
                    <p class="text-sm text-gray-500">Qty: ${item.quantity}</p>
                </div>
            </div>
            <div class="flex flex-col items-end">
                <p class="font-medium">${item.price}</p>
                <button class="text-red-500 mt-2" onclick="removeFromCart(${index}, event)">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        `;
        cartList.appendChild(listItem);

        const priceValue = parseFloat(item.price.replace(/[^\d.]/g, ''));
        total += priceValue * item.quantity;
    });

    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        cartTotal.textContent = `₹ ${total.toFixed(2)}`;
    }
}

function removeFromCart(index, event) {
    event.stopPropagation();
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

function proceedToCheckout() {
    alert('Proceeding to checkout!');
    // Here you would typically redirect to a checkout page
    // window.location.href = '/checkout';
}

// Function to update cart count in navbar
function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cart.length;
        cartCountElement.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

// Close cart when pressing ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartOpen) {
        closeCart();
    }
});

// Initialize cart count on page load
function initializeCart() {
    updateCartCount();
    
    // Set up event listeners for cart buttons
    const cartIconNav = document.getElementById('cartIconNav');
    const closeCartButton = document.getElementById('closeCartButton');
    const cartBackdrop = document.getElementById('cartBackdrop');
    
    if (cartIconNav) {
        cartIconNav.addEventListener('click', toggleCart);
    }
    
    if (closeCartButton) {
        closeCartButton.addEventListener('click', closeCart);
    }
    
    if (cartBackdrop) {
        cartBackdrop.addEventListener('click', closeCart);
    }
}

// Initialize the shared functionality when the page loads
window.addEventListener('DOMContentLoaded', function() {
    initializeCart();
    updateCartCount();
});

// Make functions available globally
window.toggleCart = toggleCart;
window.closeCart = closeCart;
window.removeFromCart = removeFromCart;
window.proceedToCheckout = proceedToCheckout;
