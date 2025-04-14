// Initialize user data if not exists
if (!localStorage.getItem('user')) {
    localStorage.setItem('user', JSON.stringify({
        name: '',
        email: '',
        addresses: []
    }));
}

if (!localStorage.getItem('allOrders')) {
    localStorage.setItem('allOrders', JSON.stringify({
        'swa@gmail.com': [
            {
                orderId: 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                date: new Date().toISOString(),
                status: 'status-delivered',
                cart: [
                    {
                        title: 'Sample Product',
                        size: 'M',
                        price: '₹599',
                        quantity: 2,
                        imageUrl: 'https://via.placeholder.com/50'
                    }
                ]
            }
        ]
    }));
}

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartOpen = false;
let searchOpen = false;
let dropdownOpen = false;

// DOM Elements
const cartIconNav = document.getElementById('cartIconNav');
const cartOverlay = document.getElementById('cartOverlay');
const cartBackdrop = document.getElementById('cartBackdrop');
const closeCartButton = document.getElementById('closeCartButton');
const enableSearch = document.getElementById('enableSearch');
const searchInputContainer = document.querySelector('.search-input-container');
const accountIconNav = document.getElementById('accountIconNav');
const dropdownMenu = document.getElementById('dropdownMenu');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenuContent = document.getElementById('mobileMenuContent');
const profileOption = document.getElementById('profileOption');
const logoutOption = document.getElementById('logoutOption');
const accountInfoPage = document.getElementById('account-info-page');
const closeAccountInfoPage = document.getElementById('closeAccountInfoPage');
const editProfileIcon = document.getElementById('editProfileIcon');
const addAddressLink = document.getElementById('addAddressLink');
const editProfileModal = document.getElementById('editProfileModal');
const closeEditProfileModal = document.getElementById('closeEditProfileModal');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const nameInput = document.getElementById('nameInput');
const emailDisplay = document.getElementById('emailDisplay');
const addAddressModal = document.getElementById('addAddressModal');
const closeAddAddressModal = document.getElementById('closeAddAddressModal');
const saveAddressBtn = document.getElementById('saveAddressBtn');
const addressContainer = document.getElementById('addressContainer');
const ordersContainer = document.getElementById('ordersContainer');

// Function to update cart count in navbar
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        if (totalItems > 0) {
            cartCountElement.classList.remove('hidden');
        } else {
            cartCountElement.classList.add('hidden');
        }
    }
}

// Function to show toast message
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('animate-toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Function to close all open elements
function closeAllOpenElements() {
    // Close cart
    if (cartOpen) {
        cartOverlay.classList.remove('active');
        cartBackdrop.classList.remove('active');
        cartOpen = false;
    }
    
    // Close search
    if (searchOpen) {
        searchInputContainer.style.display = 'none';
        searchOpen = false;
    }
    
    // Close dropdown menu
    if (dropdownOpen) {
        dropdownMenu.classList.add('hidden');
        dropdownOpen = false;
    }
    
    // Close mobile menu
    if (mobileMenuContent.classList.contains('active')) {
        mobileMenuContent.classList.remove('active');
        mobileMenuButton.querySelector('i').classList.add('fa-bars');
        mobileMenuButton.querySelector('i').classList.remove('fa-times');
    }
}

// Toggle cart function
function toggleCart() {
    // Close other open elements
    if (!cartOpen) {
        closeAllOpenElements();
    }
    
    cartOpen = !cartOpen;
    cartOverlay.classList.toggle('active', cartOpen);
    cartBackdrop.classList.toggle('active', cartOpen);
    
    if (cartOpen) {
        renderCart();
    }
}

// Close cart function
function closeCart() {
    cartOpen = false;
    cartOverlay.classList.remove('active');
    cartBackdrop.classList.remove('active');
}

function renderCart() {
    const cartList = document.getElementById('cartList');
    cartList.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="text-gray-500 text-center py-8">Your cart is empty</p>';
        document.getElementById('cartTotal').textContent = '₹ 0.00';
        updateCartCount();
        return;
    }

    cart.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.classList.add('flex', 'justify-between', 'items-start', 'border-b', 'pb-4');
        
        // Calculate price value
        const priceValue = parseFloat(item.price.replace(/[^\d.]/g, ''));
        const itemTotal = priceValue * item.quantity;
        total += itemTotal;

        listItem.innerHTML = `
            <div class="flex items-start">
                <img src="${item.image}" alt="${item.title}" class="w-16 h-16 rounded-lg mr-4 object-cover"/>
                <div>
                    <p class="font-medium">${item.title}</p>
                    <p class="text-sm text-gray-500">Size: ${item.size}</p>
                    <p class="text-sm text-gray-500">Qty: ${item.quantity}</p>
                    <p class="text-sm text-gray-500">₹${priceValue.toFixed(2)} each</p>
                </div>
            </div>
            <div class="flex flex-col items-end">
                <p class="font-medium">₹${itemTotal.toFixed(2)}</p>
                <button class="text-red-500 hover:text-red-700 mt-2" onclick="removeFromCart(${index}, event)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartList.appendChild(listItem);
    });

    document.getElementById('cartTotal').textContent = `₹ ${total.toFixed(2)}`;
    updateCartCount();
}

function removeFromCart(index, event) {
    event.stopPropagation();
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    showToast('Item removed from cart');
}

function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    alert('Proceeding to checkout!');
    // Here you would typically redirect to a checkout page
    // window.location.href = '/checkout';
}

// Close cart when pressing ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartOpen) {
        closeCart();
    }
});

// Cart event listeners
if (cartIconNav) cartIconNav.addEventListener('click', toggleCart);
if (closeCartButton) closeCartButton.addEventListener('click', closeCart);
if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

// Search functionality
const searchData = [
    { id: 1, title: "Men's T-Shirt", category: "Clothing", url: "/products/mens-tshirt" },
    { id: 2, title: "Women's Jeans", category: "Clothing", url: "/products/womens-jeans" },
    { id: 3, title: "Running Shoes", category: "Footwear", url: "/products/running-shoes" },
    { id: 4, title: "Smart Watch", category: "Electronics", url: "/products/smart-watch" },
    { id: 5, title: "Backpack", category: "Accessories", url: "/products/backpack" }
];

// Toggle search input
if (enableSearch) {
    enableSearch.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (searchOpen) {
            searchInputContainer.style.display = 'none';
            searchOpen = false;
            return;
        }
        
        closeAllOpenElements();
        searchOpen = true;
        searchInputContainer.style.display = 'block';
        document.getElementById('searchInput').focus();
    });
}

// Search functionality
if (document.getElementById('searchInput')) {
    document.getElementById('searchInput').addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const results = searchData.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.category.toLowerCase().includes(query)
        );
        displayResults(results);
    });
}

// Display search results
function displayResults(results) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No results found</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    searchResults.innerHTML = results.map(item => `
        <div class="search-result-item" data-url="${item.url}">
            <div class="title">${item.title}</div>
            <div class="category">${item.category}</div>
        </div>
    `).join('');
    
    searchResults.style.display = 'block';
    
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            window.location.href = url;
        });
    });
}

// Close search results when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-container') && !e.target.closest('.search-input-container')) {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) searchResults.style.display = 'none';
    }
});

// Account dropdown functionality
function toggleDropdown() {
    if (dropdownOpen) {
        dropdownMenu.classList.add('hidden');
        dropdownOpen = false;
        return;
    }
    
    closeAllOpenElements();
    dropdownOpen = true;
    dropdownMenu.classList.remove('hidden');
}

// Mobile menu toggle
function toggleMobileMenu() {
    if (mobileMenuContent.classList.contains('active')) {
        mobileMenuContent.classList.remove('active');
        mobileMenuButton.querySelector('i').classList.add('fa-bars');
        mobileMenuButton.querySelector('i').classList.remove('fa-times');
        return;
    }
    
    closeAllOpenElements();
    mobileMenuContent.classList.add('active');
    mobileMenuButton.querySelector('i').classList.remove('fa-bars');
    mobileMenuButton.querySelector('i').classList.add('fa-times');
}

// Show account info page
function showAccountInfo(event) {
    event.preventDefault();
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    
    if (loggedInUser && loggedInUser.email) {
        document.getElementById('displayName').textContent = loggedInUser.name || '';
        document.getElementById('displayEmail').textContent = loggedInUser.email || '';
        emailDisplay.value = loggedInUser.email || '';
        
        if (loggedInUser.email) {
            loadAddresses(loggedInUser.email);
            loadOrders(loggedInUser.email);
        }
        
        accountInfoPage.classList.remove('hidden');
        dropdownMenu.classList.add('hidden');
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
    }
}

// Load addresses
function loadAddresses(email) {
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    if (!loggedInUser || !loggedInUser.addresses) {
        addressContainer.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                <p class="text-lg">No addresses saved yet</p>
                <p class="text-sm mt-2">Your saved addresses will appear here</p>
            </div>
        `;
        return;
    }
    
    const userAddresses = loggedInUser.addresses;
    
    if (userAddresses && userAddresses.length > 0) {
        addressContainer.innerHTML = userAddresses.map(address => `
            <div class="address-card ${address.isDefault ? 'default-address' : ''} bg-white p-4 rounded-lg shadow-sm mb-3">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center mb-1">
                            <span class="font-medium">${address.fullName}</span>
                            ${address.isDefault ? 
                                '<span class="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Default</span>' : ''}
                        </div>
                        <p class="text-sm text-gray-600">${address.phoneNumber}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-blue-500 hover:text-blue-700 icon-hover icon-hover-blue icon-click-effect" onclick="editAddress('${address.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-gray-500 hover:text-gray-700 icon-hover icon-hover-gray icon-click-effect" onclick="setDefaultAddress('${address.id}')">
                            <i class="fas fa-check-circle"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-700 icon-hover icon-hover-red icon-click-effect" onclick="deleteAddress('${address.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="mt-2 text-sm">
                    <p>${address.addressLine1}</p>
                    ${address.addressLine2 ? `<p>${address.addressLine2}</p>` : ''}
                    <p>${address.city}, ${address.state} ${address.postalCode}</p>
                    <p>${address.country}</p>
                </div>
                <div class="mt-2 text-xs text-gray-500 capitalize">
                    ${address.addressType} address
                </div>
            </div>
        `).join('');
        document.getElementById('addAddressLink').style.display = 'block';
    } else {
        addressContainer.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                <p class="text-lg">No addresses saved yet</p>
                <p class="text-sm mt-2">Your saved addresses will appear here</p>
            </div>
        `;
        document.getElementById('addAddressLink').style.display = 'block';
    }
}

// Load orders
function loadOrders(email) {
    const allOrders = JSON.parse(localStorage.getItem("allOrders")) || {};
    const userOrders = allOrders[email] || [];
    
    if (userOrders.length > 0) {
        document.getElementById('ordersContainer').innerHTML = userOrders.map(order => `
            <div class="order-item border-b border-gray-200 py-6 px-4 rounded-lg mb-4 bg-white shadow-sm">
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <span class="font-semibold">Order ID:</span>
                        <span class="block text-gray-600">${order.orderId}</span>
                    </div>
                    <div>
                        <span class="font-semibold">Date:</span>
                        <span class="block text-gray-600">${new Date(order.date).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-semibold ${order.status === 'status-order-placed' ? 'text-blue-500' : 'text-gray-500'}">Order Placed</span>
                        <span class="text-sm font-semibold ${order.status === 'status-processing' ? 'text-blue-500' : 'text-gray-500'}">Processing</span>
                        <span class="text-sm font-semibold ${order.status === 'status-shipped' ? 'text-blue-500' : 'text-gray-500'}">Shipped</span>
                        <span class="text-sm font-semibold ${order.status === 'status-delivered' ? 'text-blue-500' : 'text-gray-500'}">Delivered</span>
                    </div>
                    <div class="relative">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full bg-gray-200 h-1.5 rounded-full"></div>
                            <div class="absolute h-1.5 rounded-full ${getStatusProgress(order.status)}"></div>
                        </div>
                        <div class="relative flex justify-between">
                            <div class="w-8 h-8 ${order.status === 'status-order-placed' || 
                                order.status === 'status-processing' || 
                                order.status === 'status-shipped' || 
                                order.status === 'status-delivered' ? 'bg-blue-500' : 'bg-gray-200'} 
                                rounded-full flex items-center justify-center text-white">
                                <i class="fas fa-check text-xs"></i>
                            </div>
                            <div class="w-8 h-8 ${order.status === 'status-processing' || 
                                order.status === 'status-shipped' || 
                                order.status === 'status-delivered' ? 'bg-blue-500' : 'bg-gray-200'} 
                                rounded-full flex items-center justify-center ${order.status === 'status-processing' || 
                                order.status === 'status-shipped' || 
                                order.status === 'status-delivered' ? 'text-white' : 'text-gray-500'}">
                                <i class="fas fa-truck text-xs"></i>
                            </div>
                            <div class="w-8 h-8 ${order.status === 'status-shipped' || 
                                order.status === 'status-delivered' ? 'bg-blue-500' : 'bg-gray-200'} 
                                rounded-full flex items-center justify-center ${order.status === 'status-shipped' || 
                                order.status === 'status-delivered' ? 'text-white' : 'text-gray-500'}">
                                <i class="fas fa-shipping-fast text-xs"></i>
                            </div>
                            <div class="w-8 h-8 ${order.status === 'status-delivered' ? 'bg-blue-500' : 'bg-gray-200'} 
                                rounded-full flex items-center justify-center ${order.status === 'status-delivered' ? 'text-white' : 'text-gray-500'}">
                                <i class="fas fa-box-open text-xs"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <span class="font-semibold">Status:</span>
                        <span class="block capitalize ${getStatusColor(order.status)}">
                            ${order.status.replace('status-', '').replace('-', ' ')}
                        </span>
                    </div>
                    <div>
                        <span class="font-semibold">Total:</span>
                        <span class="block text-gray-600">
                            ₹${order.cart.reduce((total, item) => {
                                const price = parseFloat(item.price.replace('₹', '').replace(',', ''));
                                return total + (price * item.quantity);
                            }, 0).toFixed(2)}
                        </span>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h4 class="font-medium mb-2">Items:</h4>
                    ${order.cart.map(item => `
                        <div class="flex items-center mt-2 p-2 bg-gray-50 rounded">
                            <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" 
                                 alt="${item.title}" 
                                 class="w-12 h-12 rounded mr-3 object-cover">
                            <div class="flex-1">
                                <p class="font-medium">${item.title}</p>
                                <div class="flex justify-between text-sm text-gray-500">
                                    <span>Size: ${item.size}</span>
                                    <span>Qty: ${item.quantity}</span>
                                    <span>${item.price}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } else {
        document.getElementById('ordersContainer').innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-shopping-bag text-4xl mb-3"></i>
                <p class="text-lg">You haven't placed any orders yet</p>
                <p class="text-sm mt-2">Your orders will appear here once you make a purchase</p>
            </div>
        `;
    }
}

// Helper functions for order status
function getStatusProgress(status) {
    switch(status) {
        case 'status-order-placed': return 'bg-blue-500 w-1/4';
        case 'status-processing': return 'bg-blue-500 w-2/4';
        case 'status-shipped': return 'bg-blue-500 w-3/4';
        case 'status-delivered': return 'bg-blue-500 w-full';
        default: return 'bg-blue-500 w-1/4';
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'status-order-placed': return 'text-blue-500';
        case 'status-processing': return 'text-yellow-500';
        case 'status-shipped': return 'text-purple-500';
        case 'status-delivered': return 'text-green-500';
        case 'status-cancelled': return 'text-red-500';
        default: return 'text-gray-500';
    }
}

// Initialize when page loads
window.addEventListener('load', function() {
    updateCartCount();
    
    const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser'));
    if (rememberedUser) {
        document.getElementById('login-email').value = rememberedUser.email;
        document.getElementById('remember-me').checked = true;
    }
    
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    if (loggedInUser && loggedInUser.email) {
        loadAccountInfo(loggedInUser.email);
    }
});

// Make functions available globally
window.deleteAddress = deleteAddress;
window.editAddress = editAddress;
window.setDefaultAddress = setDefaultAddress;
window.toggleCart = toggleCart;
window.closeCart = closeCart;
window.removeFromCart = removeFromCart;
window.proceedToCheckout = proceedToCheckout;
window.renderCart = renderCart;
window.updateCartCount = updateCartCount;
window.showToast = showToast;
