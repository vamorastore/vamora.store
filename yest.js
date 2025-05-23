 // Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBkMUmD27GU34yIPQAj7KUErt9muB0MdLk",
  authDomain: "vamora-co-in.firebaseapp.com",
  projectId: "vamora-co-in",
  storageBucket: "vamora-co-in.appspot.com",
  messagingSenderId: "613048727757",
  appId: "1:613048727757:web:d0c73e84fa7d93a5c21184",
  measurementId: "G-8R6TDRQGS6"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const analytics = firebase.analytics();
const db = firebase.firestore();
// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          console.log("Multiple tabs open, persistence can only be enabled in one tab at a time");
      } else if (err.code == 'unimplemented') {
          console.log("The current browser does not support all of the features required to enable persistence");
      }
  });
// Initialize cart
let cart = [];

// Check for existing cart on page load
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser;
    if (!user) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        cart = guestCart;
        renderCart();
    }
});

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
const loginButton = document.getElementById('login-button');

// Show login section and hide signup section
function showLoginSection() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('bg-white');
    document.getElementById('signup-section').classList.remove('bg-gray-50');
}

// Show signup section and hide login section
function showSignupSection() {
    document.getElementById('signup-section').classList.remove('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.add('bg-gray-50');
    document.getElementById('login-section').classList.remove('bg-white');
}

// Helper function to get or create user's cart in Firestore
async function getOrCreateUserCart(userId) {
    const cartRef = db.collection("carts").doc(userId);
    const doc = await cartRef.get();

    if (!doc.exists) {
        await cartRef.set({
            items: [],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return [];
    }
    return doc.data().items || [];
}

// Save cart to Firestore
async function saveCartToFirestore(userId, cartItems) {
    try {
        await db.collection("carts").doc(userId).set({
            items: cartItems,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving cart:", error);
    }
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
        document.getElementById('mobileAccountOptions').classList.add('hidden');
    }
}

// Search functionality
const searchData = [
    { id: 1, title: "Men's T-Shirt", category: "Clothing", url: "/products/mens-tshirt" },
    { id: 2, title: "Women's Jeans", category: "Clothing", url: "/products/womens-jeans" },
    { id: 3, title: "Running Shoes", category: "Footwear", url: "/products/running-shoes" },
    { id: 4, title: "Smart Watch", category: "Electronics", url: "/products/smart-watch" },
    { id: 5, title: "Backpack", category: "Accessories", url: "/products/backpack" },
    { id: 6, title: "Wireless Headphones", category: "Electronics", url: "/products/headphones" },
    { id: 7, title: "Sunglasses", category: "Accessories", url: "/products/sunglasses" },
    { id: 8, title: "Dress", category: "Clothing", url: "/products/dress" }
];

// DOM elements for search
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const closeSearch = document.getElementById('closeSearch');
const searchButton = document.getElementById('searchButton');

// Toggle search input
enableSearch.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (searchOpen) {
        searchInputContainer.style.display = 'none';
        searchInput.value = '';
        searchResults.style.display = 'none';
        searchOpen = false;
        return;
    }
    
    closeAllOpenElements();
    searchOpen = true;
    searchInputContainer.style.display = 'flex';
    searchInput.focus();
});

// Close search
closeSearch.addEventListener('click', function() {
    searchInputContainer.style.display = 'none';
    searchInput.value = '';
    searchResults.style.display = 'none';
    searchOpen = false;
});

// Search functionality
searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    
    if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    const results = searchData.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.category.toLowerCase().includes(query)
    );
    
    displayResults(results);
});

// Perform search on button click
searchButton.addEventListener('click', function() {
    const query = searchInput.value.toLowerCase();
    
    if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    const results = searchData.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.category.toLowerCase().includes(query)
    );
    
    displayResults(results);
});

// Display search results
function displayResults(results) {
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
    
    if (e.target.closest('[data-action="set-default"]')) {
            const addressId = e.target.closest('[data-action="set-default"]').dataset.addressId;
            setDefaultAddress(addressId);
    }
    
    if (!e.target.closest('.search-container') && !e.target.closest('.search-input-container')) {
        searchResults.style.display = 'none';
    }
});

// Close search results on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        searchResults.style.display = 'none';
    }
});

// Toggle cart function
function toggleCart() {
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

// Updated cart rendering function
function renderCart() {
    const cartList = document.getElementById('cartList');
    cartList.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Your cart is empty</p>
                <a href="/shop" class="mt-4 inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                    Continue Shopping
                </a>
            </div>
        `;
        document.getElementById('cartTotal').textContent = '₹ 0.00';
        return;
    }

    cart.forEach((item, index) => {
        const priceValue = parseFloat(item.price.replace(/[^\d.]/g, ''));
        const itemTotal = priceValue * item.quantity;
        subtotal += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="flex items-center">
                <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-details">
                    <p class="font-medium">${item.title}</p>
                    <p class="text-sm text-gray-500">Size: ${item.size}</p>
                    <div class="flex items-center mt-1">
                        <button class="quantity-button px-2 py-1 text-gray-500" onclick="updateQuantity(${index}, -1)">-</button>
                        <span class="mx-2">${item.quantity}</span>
                        <button class="quantity-button px-2 py-1 text-gray-500" onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                </div>
            </div>
            <div class="flex items-center">
                <span class="cart-item-price">${item.price}</span>
                <button class="cart-item-remove" onclick="removeFromCart(${index}, event)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartList.appendChild(cartItem);
    });

    document.getElementById('cartTotal').textContent = `₹ ${subtotal.toFixed(2)}`;
}

// Updated addToCart function
async function addToCart(product) {
    const user = auth.currentUser;
    
    const existingItem = cart.find(item => 
        item.id === product.id && item.size === product.size
    );

    if (existingItem) {
        existingItem.quantity += product.quantity;
    } else {
        cart.push(product);
    }

    if (user) {
        await saveCartToFirestore(user.uid, cart);
    } else {
        localStorage.setItem('guestCart', JSON.stringify(cart));
    }
    
    renderCart();
}

// Updated removeFromCart function
// Updated removeFromCart function
async function removeFromCart(index, event) {
    event.preventDefault();
    event.stopPropagation();
    
    const user = auth.currentUser;
    
    // Remove the item from the cart array
    cart.splice(index, 1);

    if (user) {
        await saveCartToFirestore(user.uid, cart);
    } else {
        localStorage.setItem('guestCart', JSON.stringify(cart));
    }
    
    renderCart();
    
    // Update cart count
    updateCartCount();
}
async function updateCartItem(productId, size, newQuantity) {
    const user = auth.currentUser;
    
    const item = cart.find(item => item.id === productId && item.size === size);
    if (item) {
        item.quantity = newQuantity;
    }

    if (user) {
        await saveCartToFirestore(user.uid, cart);
    } else {
        localStorage.setItem('guestCart', JSON.stringify(cart));
    }
    
    renderCart();
}

// Updated updateQuantity function
async function updateQuantity(index, change) {
    const newQuantity = cart[index].quantity + change;
    if (newQuantity < 1) return;
    
    cart[index].quantity = newQuantity;
    
    const user = auth.currentUser;
    if (user) {
        await saveCartToFirestore(user.uid, cart);
    }
    renderCart();
}

async function proceedToCheckout() {
    const user = auth.currentUser;
    
    if (!user) {
        showAuthContainer();
        return;
    }

    // Save cart to sessionStorage before redirecting
    sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}
// Function to render order summary
function renderOrderSummary() {
    const orderSummaryItems = document.getElementById('orderSummaryItems');
    orderSummaryItems.innerHTML = '';
    
    let subtotal = 0;
    
    if (cart.length === 0) {
        orderSummaryItems.innerHTML = '<p class="text-sm text-gray-500">Your cart is empty</p>';
        return;
    }
    
    cart.forEach(item => {
        const priceValue = parseFloat(item.price.replace('₹', '').replace(',', ''));
        const itemTotal = priceValue * item.quantity;
        subtotal += itemTotal;
        
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="product-image">
            <div class="product-details">
                <div class="product-title">${item.title}</div>
                <div class="product-variant">Size: ${item.size}</div>
                <div class="product-variant">Quantity: ${item.quantity}</div>
            </div>
            <div class="product-price">${item.price}</div>
        `;
        orderSummaryItems.appendChild(productItem);
    });
    
    document.getElementById('orderSubtotal').textContent = `₹ ${subtotal.toFixed(2)}`;
    document.getElementById('orderGrandTotal').textContent = `₹ ${subtotal.toFixed(2)}`;
}

// Close cart when pressing ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartOpen) {
        closeCart();
    }
});

function validateCheckoutForm() {
    let isValid = true;
    
    function validateField(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(errorId);
        
        if (!field.value.trim()) {
            field.classList.add('error-highlight');
            errorElement.style.display = 'block';
            errorElement.textContent = 'This field is required';
            isValid = false;
        } else {
            field.classList.remove('error-highlight');
            errorElement.style.display = 'none';
        }
    }
    
    validateField('email', 'email-error');
    validateField('first-name', 'first-name-error');
    validateField('last-name', 'last-name-error');
    validateField('address', 'address-error');
    validateField('city', 'city-error');
    validateField('state', 'state-error');
    validateField('pin-code', 'pin-code-error');
    validateField('phone', 'phone-error');
    
    const email = document.getElementById('email').value;
    if (email && !validateEmail(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email address';
        document.getElementById('email-error').style.display = 'block';
        document.getElementById('email').classList.add('error-highlight');
        isValid = false;
    }
    
    const phone = document.getElementById('phone').value;
    if (phone && !/^\d{10}$/.test(phone)) {
        document.getElementById('phone-error').textContent = 'Please enter a valid 10-digit phone number';
        document.getElementById('phone-error').style.display = 'block';
        document.getElementById('phone').classList.add('error-highlight');
        isValid = false;
    }
    
    const pinCode = document.getElementById('pin-code').value;
    if (pinCode && !/^\d{6}$/.test(pinCode)) {
        document.getElementById('pin-code-error').textContent = 'Please enter a valid 6-digit PIN code';
        document.getElementById('pin-code-error').style.display = 'block';
        document.getElementById('pin-code').classList.add('error-highlight');
        isValid = false;
    }
    
    if (!isValid) {
        const firstError = document.querySelector('.error-highlight');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }
    
    return isValid;
}

// Cart event listeners
cartIconNav.addEventListener('click', toggleCart);
closeCartButton.addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);

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
        document.getElementById('mobileAccountOptions').classList.add('hidden');
        return;
    }
    
    closeAllOpenElements();
    mobileMenuContent.classList.add('active');
    mobileMenuButton.querySelector('i').classList.remove('fa-bars');
    mobileMenuButton.querySelector('i').classList.add('fa-times');
    
    const user = auth.currentUser;
    if (user) {
        document.getElementById('mobileAccountOptions').classList.remove('hidden');
    } else {
        document.getElementById('mobileAccountOptions').classList.add('hidden');
    }
}

// Show account info page
function showAccountInfo(event) {
    event.preventDefault();
    const user = auth.currentUser;
    
    if (user) {
        document.getElementById('displayName').textContent = user.displayName || '';
        document.getElementById('displayEmail').textContent = user.email || '';
        emailDisplay.value = user.email || '';
        
        loadAddresses(user.uid);
        loadOrders(user.uid);
        
        accountInfoPage.classList.remove('hidden');
        dropdownMenu.classList.add('hidden');
        mobileMenuContent.classList.remove('active');
        document.getElementById('mobileAccountOptions').classList.add('hidden');
        mobileMenuButton.querySelector('i').classList.add('fa-bars');
        mobileMenuButton.querySelector('i').classList.remove('fa-times');
    } else {
        showAuthContainer();
        showLoginSection();
    }
}

// Close account info page
closeAccountInfoPage.addEventListener('click', function(event) {
    event.preventDefault();
    accountInfoPage.classList.add('hidden');
});

function renderAddresses(addresses) {
    const addressContainer = document.getElementById('addressContainer');
    if (!addressContainer) return;

    if (!addresses || addresses.length === 0) {
        addressContainer.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                <p class="text-lg">No addresses saved yet</p>
                <p class="text-sm mt-2">Your saved addresses will appear here</p>
            </div>
        `;
        return;
    }

    addressContainer.innerHTML = addresses.map(address => `
        <div class="address-card ${address.isDefault ? 'border-2 border-blue-500' : 'border border-gray-200'} bg-white p-4 rounded-lg shadow-sm mb-3">
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
                    <button class="text-blue-500 hover:text-blue-700" onclick="editAddress('${address.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="${address.isDefault ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-700" 
                            data-action="set-default" 
                            data-address-id="${address.id}">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700" onclick="deleteAddress('${address.id}')">
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

    // Add event listeners for set default buttons
    document.querySelectorAll('[data-action="set-default"]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const addressId = this.getAttribute('data-address-id');
            setDefaultAddress(addressId);
        });
    });
}
// Address Management
function showAddAddressModal(event) {
    event.preventDefault();
    document.getElementById('addressForm').reset();
    delete document.getElementById('addressForm').dataset.editingId;
    document.querySelector('#addAddressModal h3').textContent = 'Add New Address';
    addAddressModal.classList.remove('hidden');
}

async function saveAddress(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        showToast('Please sign in to save addresses', 'error');
        return;
    }

    // Get form values
    const address = {
        fullName: document.getElementById('fullName').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        addressLine1: document.getElementById('addressLine1').value.trim(),
        addressLine2: document.getElementById('addressLine2').value.trim() || '',
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        postalCode: document.getElementById('postalCode').value.trim(),
        country: document.getElementById('country').value,
        addressType: document.querySelector('input[name="addressType"]:checked')?.value || 'home',
        isDefault: document.getElementById('setAsDefault').checked,
        id: document.getElementById('addressForm').dataset.editingId || `addr_${Date.now()}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Validation
    const errors = [];
    if (!address.fullName) errors.push('Full name is required');
    if (!address.phoneNumber || !/^\d{10}$/.test(address.phoneNumber)) errors.push('Valid 10-digit phone number is required');
    if (!address.addressLine1) errors.push('Address line 1 is required');
    if (!address.city) errors.push('City is required');
    if (!address.state) errors.push('State is required');
    if (!address.postalCode || !/^\d{6}$/.test(address.postalCode)) errors.push('Valid 6-digit postal code is required');
    if (!address.country) errors.push('Country is required');

    if (errors.length > 0) {
        showToast(errors.join(', '), 'error');
        return;
    }

    try {
        // Show loading state
        const saveBtn = document.getElementById('saveAddressBtn');
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        const userRef = db.collection("users").doc(user.uid);
        
        // Get current addresses
        const userDoc = await userRef.get();
        let currentAddresses = userDoc.exists ? (userDoc.data().addresses || []) : [];

        // Handle default address logic
        if (address.isDefault) {
            currentAddresses = currentAddresses.map(addr => ({
                ...addr,
                isDefault: false
            }));
        }

        // Check if we're editing an existing address
        const isEditing = document.getElementById('addressForm').dataset.editingId;
        if (isEditing) {
            // Update existing address
            currentAddresses = currentAddresses.map(addr => 
                addr.id === isEditing ? address : addr
            );
        } else {
            // Add new address - if it's the first address, make it default
            if (currentAddresses.length === 0) {
                address.isDefault = true;
            }
            currentAddresses.push(address);
        }

        // Prepare update data
        const updateData = {
            addresses: currentAddresses,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // If this is the default address, update that field
        if (address.isDefault) {
            updateData.defaultAddress = address;
        }

        // Save to Firestore
        await userRef.set(updateData, { merge: true });

        // Refresh UI
        await loadAddresses(user.uid);
        addAddressModal.classList.add('hidden');
        document.getElementById('addressForm').reset();
        delete document.getElementById('addressForm').dataset.editingId;
        
        // Show success message
        showToast('Address saved successfully!');
        
    } catch (error) {
        console.error("Error saving address:", error);
        showToast("Failed to save address. Please try again.", 'error');
    } finally {
        // Reset button state
        const saveBtn = document.getElementById('saveAddressBtn');
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Save Address';
        saveBtn.disabled = false;
    }
}

function cancelAddress() {
    document.getElementById('addressForm').reset();
    delete document.getElementById('addressForm').dataset.editingId;
    addAddressModal.classList.add('hidden');
}

async function deleteAddress(addressId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userRef = db.collection("users").doc(user.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) return;
        
        const addresses = userDoc.data().addresses || [];
        const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
        
        const defaultAddress = userDoc.data().defaultAddress;
        const isDeletingDefault = defaultAddress && defaultAddress.id === addressId;
        
        await userRef.update({
            addresses: updatedAddresses,
            ...(isDeletingDefault && { 
                defaultAddress: updatedAddresses.length > 0 ? updatedAddresses[0] : null 
            }),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadAddresses(user.uid);
        showToast('Address deleted successfully!');
    } catch (error) {
        console.error("Error deleting address:", error);
        showToast("Failed to delete address. Please try again.", 'error');
    }
}

async function setDefaultAddress(addressId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userRef = db.collection("users").doc(user.uid);
        
        // First get current addresses
        const userDoc = await userRef.get();
        if (!userDoc.exists) return;
        
        const addresses = userDoc.data().addresses || [];
        const addressToSetDefault = addresses.find(addr => addr.id === addressId);
        
        if (!addressToSetDefault) {
            showToast('Address not found', 'error');
            return;
        }

        // Update all addresses to set this one as default
        const updatedAddresses = addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId
        }));
        
        await userRef.update({
            addresses: updatedAddresses,
            defaultAddress: addressToSetDefault,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadAddresses(user.uid);
        showToast('Default address updated successfully!');
    } catch (error) {
        console.error("Error setting default address:", error);
        showToast('Failed to set default address', 'error');
    }
}

function editAddress(addressId) {
    const user = auth.currentUser;
    if (!user) return;
    
    const userRef = db.collection("users").doc(user.uid);
    userRef.get().then(doc => {
        if (!doc.exists) return;
        
        const addresses = doc.data().addresses || [];
        const address = addresses.find(addr => addr.id === addressId);
        if (!address) return;
        
        // Populate form fields
        document.getElementById('fullName').value = address.fullName;
        document.getElementById('phoneNumber').value = address.phoneNumber;
        document.getElementById('addressLine1').value = address.addressLine1;
        document.getElementById('addressLine2').value = address.addressLine2 || '';
        document.getElementById('city').value = address.city;
        document.getElementById('state').value = address.state;
        document.getElementById('postalCode').value = address.postalCode;
        document.getElementById('country').value = address.country;
        
        // Set address type radio button
        const addressTypeRadios = document.querySelectorAll('input[name="addressType"]');
        addressTypeRadios.forEach(radio => {
            radio.checked = (radio.value === address.addressType);
        });
        
        document.getElementById('setAsDefault').checked = address.isDefault || false;
        
        // Set editing ID
        document.getElementById('addressForm').dataset.editingId = addressId;
        document.querySelector('#addAddressModal h3').textContent = 'Edit Address';
        
        addAddressModal.classList.remove('hidden');
    }).catch(error => {
        console.error("Error loading address for editing:", error);
        showToast('Failed to load address for editing', 'error');
    });
}

// Event Listeners for Address Management
document.getElementById('addAddressLink')?.addEventListener('click', showAddAddressModal);
document.getElementById('closeAddAddressModal')?.addEventListener('click', cancelAddress);
document.getElementById('saveAddressBtn')?.addEventListener('click', saveAddress);
document.getElementById('cancelAddressBtn')?.addEventListener('click', cancelAddress);
document.getElementById('addressForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    saveAddress(e);
});

// Initialize address form
function initAddressForm() {
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        addressForm.reset();
    }
}

// Call init on DOM ready
document.addEventListener('DOMContentLoaded', initAddressForm);
async function loadAccountInfo(userId) {
    try {
        const user = auth.currentUser;
        
        if (!user) {
            renderEmptyAccountState();
            return;
        }

        const userDoc = await db.collection("users").doc(userId).get();
        
        if (!userDoc.exists) {
            // Create basic user document if it doesn't exist
            await db.collection("users").doc(userId).set({
                name: user.displayName || '',
                email: user.email,
                provider: user.providerData[0]?.providerId || 'unknown',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                addresses: []
            });
            
            // Try getting the document again
            const newUserDoc = await db.collection("users").doc(userId).get();
            updateUIWithUserData(user, newUserDoc.data());
        } else {
            updateUIWithUserData(user, userDoc.data());
        }
        
    } catch (error) {
        console.error("Error loading account info:", error);
        renderEmptyAccountState();
    }
}
function renderEmptyAccountState() {
    addressContainer.innerHTML = `
        <div class="text-center text-gray-500">
            <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
            <p class="text-lg">No addresses saved yet</p>
            <p class="text-sm mt-2">Please login to view your saved addresses</p>
        </div>
    `;
    
    ordersContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500">
            <i class="fas fa-shopping-bag text-4xl mb-3"></i>
            <p class="text-lg">You haven't placed any orders yet</p>
            <p class="text-sm mt-2">Please login to view your orders</p>
        </div>
    `;
    
    if (document.getElementById('displayName')) {
        document.getElementById('displayName').textContent = '';
    }
    if (document.getElementById('displayEmail')) {
        document.getElementById('displayEmail').textContent = '';
    }
}

async function applyDefaultAddress() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) return;

        const defaultAddress = userDoc.data().defaultAddress;
        if (!defaultAddress) return;

        // Split full name into first and last names
        const nameParts = defaultAddress.fullName.split(' ');
        document.getElementById('first-name').value = nameParts[0] || '';
        document.getElementById('last-name').value = nameParts.slice(1).join(' ') || '';
        
        // Address fields
        document.getElementById('address').value = defaultAddress.addressLine1 || '';
        document.getElementById('apartment').value = defaultAddress.addressLine2 || '';
        
        // Other fields
        document.getElementById('city').value = defaultAddress.city || '';
        document.getElementById('state').value = defaultAddress.state || '';
        document.getElementById('pin-code').value = defaultAddress.postalCode || '';
        document.getElementById('phone').value = defaultAddress.phoneNumber || '';
    } catch (error) {
        console.error("Error applying default address:", error);
    }
}
// Load addresses
async function loadAddresses(userId) {
    const addressContainer = document.getElementById('addressContainer');
    if (!addressContainer) return;

    try {
        const doc = await db.collection("users").doc(userId).get();
        if (doc.exists) {
            const userData = doc.data();
            const addresses = userData.addresses || [];
            
            if (addresses.length === 0) {
                addressContainer.innerHTML = `
                    <div class="text-center text-gray-500">
                        <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                        <p class="text-lg">No addresses saved yet</p>
                        <p class="text-sm mt-2">Add your first address below</p>
                    </div>
                `;
            } else {
                renderAddresses(addresses);
            }
        } else {
            addressContainer.innerHTML = `
                <div class="text-center text-gray-500">
                    <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                    <p class="text-lg">No addresses saved yet</p>
                    <p class="text-sm mt-2">Add your first address below</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error loading addresses:", error);
        addressContainer.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-exclamation-triangle text-3xl mb-3"></i>
                <p class="text-lg">Error loading addresses</p>
                <p class="text-sm mt-2">${error.message || 'Please try again later'}</p>
            </div>
        `;
    }
}// Update the loadOrders function
async function loadOrders(userId) {
    const user = auth.currentUser;
    if (!user) {
        ordersContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-shopping-bag text-4xl mb-3"></i>
                <p class="text-lg">Please sign in to view your orders</p>
            </div>
        `;
        return;
    }

    try {
        showLoading('ordersLoading');
        
        const querySnapshot = await db.collection("orders")
            .where("userId", "==", userId)
            .orderBy("timestamp", "desc")
            .get();

        if (querySnapshot.empty) {
            ordersContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-shopping-bag text-4xl mb-3"></i>
                    <p class="text-lg">You haven't placed any orders yet</p>
                    <p class="text-sm mt-2">Your orders will appear here once you make a purchase</p>
                </div>
            `;
            return;
        }

        const orders = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                date: data.timestamp?.toDate() || new Date()
            };
        });
        
        renderOrders(orders);
    } catch (error) {
        console.error("Error loading orders:", error);
        ordersContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                <p class="text-lg">Error loading orders</p>
                <p class="text-sm mt-2">${error.message || 'Please try again later'}</p>
            </div>
        `;
    } finally {
        hideLoading('ordersLoading');
    }
}

// Update the renderOrders function to handle the date properly
function renderOrders(orders) {
    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-item border-b border-gray-200 py-6 px-4 rounded-lg mb-4 bg-white shadow-sm">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <span class="font-semibold">Order Number:</span>
                    <span class="block text-gray-600">${order.orderId || order.id}</span>
                </div>
                <div>
                    <span class="font-semibold">Date:</span>
                    <span class="block text-gray-600">${order.date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}</span>
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
                        ${(order.status || 'pending').replace('status-', '').replace('-', ' ')}
                    </span>
                </div>
                <div>
                    <span class="font-semibold">Total:</span>
                    <span class="block text-gray-600">
                        ₹${order.items.reduce((total, item) => {
                            const price = parseFloat(item.price?.replace('₹', '').replace(',', '') || '0');
                            return total + (price * (item.quantity || 1));
                        }, 0).toFixed(2)}
                    </span>
                </div>
            </div>
            
            <div class="mt-4">
                <h4 class="font-medium mb-2">Items:</h4>
                ${order.items.map(item => `
                    <div class="flex items-center mt-2 p-2 bg-gray-50 rounded">
                        <img src="${item.image || 'https://via.placeholder.com/50'}" 
                             alt="${item.title}" 
                             class="w-12 h-12 rounded mr-3 object-cover">
                        <div class="flex-1">
                            <p class="font-medium">${item.title}</p>
                            <div class="flex justify-between text-sm text-gray-500">
                                <span>Size: ${item.size}</span>
                                <span>Qty: ${item.quantity || 1}</span>
                                <span>${item.price || '₹0.00'}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}
// Helper function to render orders
function renderOrders(orders) {
    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-item border-b border-gray-200 py-6 px-4 rounded-lg mb-4 bg-white shadow-sm">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <span class="font-semibold">Order Number:</span>
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
                        ₹${order.items.reduce((total, item) => {
                            const price = parseFloat(item.price.replace('₹', '').replace(',', ''));
                            return total + (price * item.quantity);
                        }, 0).toFixed(2)}
                    </span>
                </div>
            </div>
            
            <div class="mt-4">
                <h4 class="font-medium mb-2">Items:</h4>
                ${order.items.map(item => `
                    <div class="flex items-center mt-2 p-2 bg-gray-50 rounded">
                        <img src="${item.image || 'https://via.placeholder.com/50'}" 
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
}

// Helper function to determine the progress bar width
function getStatusProgress(status) {
    switch(status) {
        case 'status-order-placed':
            return 'bg-blue-500 w-1/4';
        case 'status-processing':
            return 'bg-blue-500 w-2/4';
        case 'status-shipped':
            return 'bg-blue-500 w-3/4';
        case 'status-delivered':
            return 'bg-blue-500 w-full';
        default:
            return 'bg-blue-500 w-1/4';
    }
}

async function saveInformation() {
    const saveInfoCheckbox = document.getElementById('save-info');
    if (!saveInfoCheckbox.checked) return;

    const requiredFields = [
        'first-name', 'last-name', 'address', 
        'city', 'state', 'pin-code', 'phone'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.classList.add('error-highlight');
            isValid = false;
        }
    });
    
    if (!isValid) {
        alert('Please fill all required fields before saving');
        saveInfoCheckbox.checked = false;
        return;
    }

    const address = {
        fullName: `${document.getElementById('first-name').value} ${document.getElementById('last-name').value}`,
        phoneNumber: document.getElementById('phone').value,
        addressLine1: document.getElementById('address').value,
        addressLine2: document.getElementById('apartment').value || '',
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('pin-code').value,
        country: document.getElementById('country').value,
        addressType: 'home',
        isDefault: true,
        id: Date.now().toString(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

     try {
        const user = auth.currentUser;
        
        if (user) {
            const userRef = db.collection("users").doc(user.uid);
            
            await userRef.update({
                addresses: firebase.firestore.FieldValue.arrayUnion(address),
                defaultAddress: address,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert('Address saved as default for future checkouts');
        } else {
            alert('Please sign in to save addresses permanently');
        }
    } catch (error) {
        console.error("Error saving address:", error);
        alert("Failed to save address. Please try again.");
    }
}

// Update the getStatusColor function to include all statuses
function getStatusColor(status) {
    switch(status) {
        case 'status-order-placed':
            return 'text-blue-500';
        case 'status-processing':
            return 'text-yellow-500';
        case 'status-shipped':
            return 'text-purple-500';
        case 'status-delivered':
            return 'text-green-500';
        case 'status-cancelled':
            return 'text-red-500';
        default:
            return 'text-gray-500';
    }
}

// Firebase Authentication Functions
function showAuthContainer() {
    document.getElementById('auth-container').classList.add('active');
    document.body.classList.add('overflow-hidden');
    showLoginSection();
    resetForms();
}

function hideAuthContainer() {
    document.getElementById('auth-container').classList.remove('active');
    document.body.classList.remove('overflow-hidden');
    resetForms();
    document.getElementById('login-section').classList.remove('login-success');
    document.getElementById('google-login-success').classList.add('hidden');
    document.getElementById('google-signup-success').classList.add('hidden');
}

function resetForms() {
    document.getElementById('login-form').reset();
    document.getElementById('signup-form').reset();
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('login-success').classList.add('hidden');
    document.getElementById('signup-error').classList.add('hidden');
    document.getElementById('email-error').classList.add('hidden');
    document.getElementById('email-exists-error').classList.add('hidden');
    document.getElementById('password-mismatch-error').classList.add('hidden');
    document.getElementById('name-error').classList.add('hidden');
}

function showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    const textSpan = button.querySelector('span');
    button.disabled = true;
    button.classList.add('loading');
    textSpan.classList.add('opacity-0');
}

function hideLoading(buttonId) {
    const button = document.getElementById(buttonId);
    const textSpan = button.querySelector('span');
    button.disabled = false;
    button.classList.remove('loading');
    textSpan.classList.remove('opacity-0');
}

// Setup password toggles for all password fields
// Initialize password toggles
function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const inputId = this.getAttribute('data-toggle');
            const input = document.getElementById(inputId);
            if (input) {
                // Toggle input type
                input.type = input.type === 'password' ? 'text' : 'password';
                
                // Toggle eye icon
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            }
        });
    });
}

// Call this when page loads and when auth modal opens
document.addEventListener('DOMContentLoaded', setupPasswordToggles);
document.getElementById('auth-container').addEventListener('transitionend', function() {
    if (this.classList.contains('active')) {
        setupPasswordToggles();
    }
});

// Call this when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggles();
    
    // Also call it whenever the auth container is shown
    document.getElementById('auth-container').addEventListener('transitionend', function() {
        if (this.classList.contains('active')) {
            setupPasswordToggles();
        }
    });
});

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggles();
});

function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[0-9]/.test(password) && 
           /[^A-Za-z0-9]/.test(password);
}

function validateName(name) {
    return name.length >= 2 && name.length <= 50;
}

// Email/Password Sign Up
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading('signup-submit-button');
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const securityQuestion = document.getElementById('security-question').value;
    const securityAnswer = document.getElementById('security-answer').value.trim();

    // Reset error messages
    document.getElementById('signup-error').classList.add('hidden');
    document.getElementById('email-error').classList.add('hidden');
    document.getElementById('email-exists-error').classList.add('hidden');
    document.getElementById('password-mismatch-error').classList.add('hidden');
    document.getElementById('name-error').classList.add('hidden');

    // Validation
    let isValid = true;

    if (!validateName(name)) {
        document.getElementById('name-error').classList.remove('hidden');
        isValid = false;
    }

    if (!validateEmail(email)) {
        document.getElementById('email-error').classList.remove('hidden');
        isValid = false;
    }

    if (!validatePassword(password)) {
        document.getElementById('password-mismatch-error').textContent = 'Password must be at least 8 characters with uppercase, number, and special character';
        document.getElementById('password-mismatch-error').classList.remove('hidden');
        isValid = false;
    }

    if (password !== confirmPassword) {
        document.getElementById('password-mismatch-error').textContent = 'Passwords do not match';
        document.getElementById('password-mismatch-error').classList.remove('hidden');
        isValid = false;
    }

    if (!securityQuestion || !securityAnswer) {
        document.getElementById('signup-error').textContent = 'All fields are required';
        document.getElementById('signup-error').classList.remove('hidden');
        isValid = false;
    }

    if (!isValid) {
        hideLoading('signup-submit-button');
        return;
    }

    // Create user and send verification email
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Send verification email
            return user.sendEmailVerification().then(() => {
                // Update user profile with display name
                return user.updateProfile({
                    displayName: name
                }).then(() => {
                    // Save additional user data to Firestore
                    return db.collection("users").doc(user.uid).set({
                        name: name,
                        email: email,
                        securityQuestion: securityQuestion,
                        securityAnswer: securityAnswer,
                        provider: 'email',
                        emailVerified: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        addresses: []
                    });
                });
            });
        })
        .then(() => {
            // Hide the form and show verification message
            const signupForm = document.getElementById('signup-form');
            const verifyEmailSuccess = document.getElementById('verify-email-success');
            
            if (signupForm) signupForm.classList.add('hidden');
            if (verifyEmailSuccess) {
                verifyEmailSuccess.classList.remove('hidden');
                verifyEmailSuccess.innerHTML = `
                    <div class="text-center">
                        <i class="fas fa-envelope-open-text text-4xl text-green-500 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Verify Your Email</h3>
                        <p class="mb-4">We've sent a verification link to ${email}</p>
                        <button onclick="showLoginSection()" class="px-4 py-2 bg-black text-white rounded">
                            Go to Login
                        </button>
                        <p class="text-sm mt-4 text-gray-600">
                            Didn't get the email? 
                            <a href="#" onclick="resendVerification('${email}')" class="text-blue-600">Resend</a>
                        </p>
                    </div>
                `;
            }
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            
            if (errorCode === 'auth/email-already-in-use') {
                const emailExistsError = document.getElementById('email-exists-error');
                if (emailExistsError) emailExistsError.classList.remove('hidden');
            } else {
                const signupError = document.getElementById('signup-error');
                if (signupError) {
                    signupError.textContent = errorMessage;
                    signupError.classList.remove('hidden');
                }
            }
        })
        .finally(() => {
            hideLoading('signup-submit-button');
        });
});
// Email/Password Login - Firestore Version
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading('login-submit-button');
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    const loginError = document.getElementById('login-error');
    if (loginError) loginError.classList.add('hidden');

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Check if email is verified
            if (!user.emailVerified) {
                auth.signOut(); // Force logout unverified users
                throw new Error("Please verify your email first. Check your inbox or resend the verification email.");
            }
            
            // Update last login time
            return db.collection("users").doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                return db.collection("users").doc(user.uid).get();
            });
        })
        .then((doc) => {
            if (!doc.exists) {
                throw new Error("User data not found");
            }
            
            const user = auth.currentUser;
            const userData = doc.data();
            
            // Update UI elements if they exist
            const loginSuccess = document.getElementById('login-success');
            if (loginSuccess) {
                loginSuccess.textContent = 'Login successful! Redirecting...';
                loginSuccess.classList.remove('hidden');
            }
            
            const loginSection = document.getElementById('login-section');
            if (loginSection) loginSection.classList.add('login-success');
            
            hideLoading('login-submit-button');
            
            setTimeout(() => {
                hideAuthContainer();
                
                // Update account info page if it exists
                const accountInfoPage = document.getElementById('account-info-page');
                if (accountInfoPage) {
                    accountInfoPage.classList.remove('hidden');
                    
                    const displayName = document.getElementById('displayName');
                    if (displayName) displayName.textContent = userData.name || '';
                    
                    const displayEmail = document.getElementById('displayEmail');
                    if (displayEmail) displayEmail.textContent = user.email || '';
                    
                    const emailDisplay = document.getElementById('emailDisplay');
                    if (emailDisplay) emailDisplay.value = user.email || '';
                    
                    loadAddresses(user.uid);
                    loadOrders(user.uid);
                }
                
                updateLoginButton();
                updateMobileAccountOptions();
                
                const emailField = document.getElementById('email');
                if (emailField) emailField.value = user.email;
            }, 500);
        })
        .catch((error) => {
            console.error("Error handling login:", error);
            const loginError = document.getElementById('login-error');
            if (loginError) {
                loginError.textContent = error.message || 'Error processing login. Please try again.';
                loginError.classList.remove('hidden');
            }
            hideLoading('login-submit-button');
            
            const loginSection = document.getElementById('login-section');
            if (loginSection) loginSection.classList.remove('login-success');
        });
});
// Updated Google Sign In/Sign Up handler with Firestore
// Updated Google Sign In/Sign Up handler
document.querySelectorAll('#google-signin-btn').forEach(button => {
    button.addEventListener('click', function() {
        const googleBtn = this;
        const originalContent = googleBtn.innerHTML;
        googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        googleBtn.disabled = true;

        const provider = new firebase.auth.GoogleAuthProvider();
        
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                
                // Show success message in login section
                const loginSuccessEl = document.getElementById('login-success');
                if (loginSuccessEl) {
                    loginSuccessEl.textContent = 'Google login successful! Redirecting...';
                    loginSuccessEl.classList.remove('hidden');
                }
                
                // Hide error messages if they exist
                const loginError = document.getElementById('login-error');
                const signupError = document.getElementById('signup-error');
                if (loginError) loginError.classList.add('hidden');
                if (signupError) signupError.classList.add('hidden');
                
                // Save user data to Firestore
                return db.collection("users").doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    provider: 'google',
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    photoURL: user.photoURL || null,
                    addresses: []
                }, { merge: true });
            })
            .then(() => {
                const user = auth.currentUser;
                
                googleBtn.innerHTML = originalContent;
                googleBtn.disabled = false;
                
                // Hide auth container and redirect
                setTimeout(() => {
                    hideAuthContainer();
                    
                    // Redirect to profile page or show account info
                    if (window.location.pathname.includes('account')) {
                        loadAccountInfo(user.uid);
                    } else {
                        window.location.href = '/account';
                    }
                }, 1500);
            })
            .catch((error) => {
                googleBtn.innerHTML = originalContent;
                googleBtn.disabled = false;
                
                const errorMessage = error.message;
                const currentAuthSection = document.querySelector('.auth-section:not(.hidden)');
                
                if (currentAuthSection) {
                    const isLoginSection = currentAuthSection.id === 'login-section';
                    
                    if (isLoginSection) {
                        const loginError = document.getElementById('login-error');
                        if (loginError) {
                            loginError.textContent = errorMessage;
                            loginError.classList.remove('hidden');
                        }
                    } else {
                        const signupError = document.getElementById('signup-error');
                        if (signupError) {
                            signupError.textContent = errorMessage;
                            signupError.classList.remove('hidden');
                        }
                    }
                }
            });
    });
});

// Updated Email/Password Login
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading('login-submit-button');
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    const loginError = document.getElementById('login-error');
    if (loginError) loginError.classList.add('hidden');

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Check if email is verified
            if (!user.emailVerified) {
                auth.signOut(); // Force logout unverified users
                throw new Error("Please verify your email first. Check your inbox or resend the verification email.");
            }
            
            // Update last login time
            return db.collection("users").doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                return db.collection("users").doc(user.uid).get();
            });
        })
        .then((doc) => {
            if (!doc.exists) {
                throw new Error("User data not found");
            }
            
            const user = auth.currentUser;
            const userData = doc.data();
            
            // Show success message
            const loginSuccess = document.getElementById('login-success');
            if (loginSuccess) {
                loginSuccess.textContent = 'Login successful! Redirecting...';
                loginSuccess.classList.remove('hidden');
            }
            
            hideLoading('login-submit-button');
            
            setTimeout(() => {
                hideAuthContainer();
                
                // Redirect to profile page or show account info
                if (window.location.pathname.includes('account')) {
                    loadAccountInfo(user.uid);
                } else {
                    window.location.href = '/account';
                }
            }, 1500);
        })
        .catch((error) => {
            console.error("Error handling login:", error);
            const loginError = document.getElementById('login-error');
            if (loginError) {
                loginError.textContent = error.message || 'Error processing login. Please try again.';
                loginError.classList.remove('hidden');
            }
            hideLoading('login-submit-button');
        });
});

// Prevent Google-signed-in emails from signing up with email/password
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading('signup-submit-button');
    
    const email = document.getElementById('signup-email').value.trim();
    
    // First check if email is already registered with Google
    auth.fetchSignInMethodsForEmail(email)
        .then((methods) => {
            if (methods.includes('google.com')) {
                throw new Error('This email is already registered with Google. Please sign in with Google.');
            }
            
            // Continue with normal signup if not a Google account
            const name = document.getElementById('signup-name').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const securityQuestion = document.getElementById('security-question').value;
            const securityAnswer = document.getElementById('security-answer').value.trim();

            // Reset error messages
            document.getElementById('signup-error').classList.add('hidden');
            document.getElementById('email-error').classList.add('hidden');
            document.getElementById('email-exists-error').classList.add('hidden');
            document.getElementById('password-mismatch-error').classList.add('hidden');
            document.getElementById('name-error').classList.add('hidden');

            // Validation
            let isValid = true;

            if (!validateName(name)) {
                document.getElementById('name-error').classList.remove('hidden');
                isValid = false;
            }

            if (!validateEmail(email)) {
                document.getElementById('email-error').classList.remove('hidden');
                isValid = false;
            }

            if (!validatePassword(password)) {
                document.getElementById('password-mismatch-error').textContent = 'Password must be at least 8 characters with uppercase, number, and special character';
                document.getElementById('password-mismatch-error').classList.remove('hidden');
                isValid = false;
            }

            if (password !== confirmPassword) {
                document.getElementById('password-mismatch-error').textContent = 'Passwords do not match';
                document.getElementById('password-mismatch-error').classList.remove('hidden');
                isValid = false;
            }

            if (!securityQuestion || !securityAnswer) {
                document.getElementById('signup-error').textContent = 'All fields are required';
                document.getElementById('signup-error').classList.remove('hidden');
                isValid = false;
            }

            if (!isValid) {
                hideLoading('signup-submit-button');
                return;
            }

            // Create user and send verification email
            return auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    
                    // Send verification email
                    return user.sendEmailVerification().then(() => {
                        // Update user profile with display name
                        return user.updateProfile({
                            displayName: name
                        }).then(() => {
                            // Save additional user data to Firestore
                            return db.collection("users").doc(user.uid).set({
                                name: name,
                                email: email,
                                securityQuestion: securityQuestion,
                                securityAnswer: securityAnswer,
                                provider: 'email',
                                emailVerified: false,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                                addresses: []
                            });
                        });
                    });
                })
                .then(() => {
                    // Hide the form and show verification message
                    const signupForm = document.getElementById('signup-form');
                    const verifyEmailSuccess = document.getElementById('verify-email-success');
                    
                    if (signupForm) signupForm.classList.add('hidden');
                    if (verifyEmailSuccess) {
                        verifyEmailSuccess.classList.remove('hidden');
                        verifyEmailSuccess.innerHTML = `
                            <div class="text-center">
                                <i class="fas fa-envelope-open-text text-4xl text-green-500 mb-4"></i>
                                <h3 class="text-xl font-bold mb-2">Verify Your Email</h3>
                                <p class="mb-4">We've sent a verification link to ${email}</p>
                                <button onclick="showLoginSection()" class="px-4 py-2 bg-black text-white rounded">
                                    Go to Login
                                </button>
                                <p class="text-sm mt-4 text-gray-600">
                                    Didn't get the email? 
                                    <a href="#" onclick="resendVerification('${email}')" class="text-blue-600">Resend</a>
                                </p>
                            </div>
                        `;
                    }
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            
            if (errorCode === 'auth/email-already-in-use') {
                const emailExistsError = document.getElementById('email-exists-error');
                if (emailExistsError) {
                    emailExistsError.textContent = 'This email is already registered. Please sign in instead.';
                    emailExistsError.classList.remove('hidden');
                }
            } else {
                const signupError = document.getElementById('signup-error');
                if (signupError) {
                    signupError.textContent = errorMessage;
                    signupError.classList.remove('hidden');
                }
            }
        })
        .finally(() => {
            hideLoading('signup-submit-button');
        });
});// Updated Forgot Password with Firestore
document.getElementById('forgot-password-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading('forgot-submit-button');
    
    const email = document.getElementById('forgot-email').value.trim();
    const securityQuestion = document.getElementById('forgot-security-question').value;
    const securityAnswer = document.getElementById('forgot-security-answer').value.trim();

    document.getElementById('forgot-error').classList.add('hidden');

    auth.fetchSignInMethodsForEmail(email)
        .then(() => {
            return db.collection("users")
                .where("email", "==", email)
                .limit(1)
                .get();
        })
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                throw new Error("User not found");
            }
            
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            if (userData.securityQuestion !== securityQuestion || 
                userData.securityAnswer !== securityAnswer) {
                throw new Error("Security question/answer mismatch");
            }
            
            return auth.sendPasswordResetEmail(email);
        })
        .then(() => {
            document.getElementById('forgot-error').classList.add('hidden');
            document.getElementById('reset-password-section').classList.remove('hidden');
        })
        .catch((error) => {
            document.getElementById('forgot-error').textContent = error.message;
            document.getElementById('forgot-error').classList.remove('hidden');
        })
        .finally(() => {
            hideLoading('forgot-submit-button');
        });
});

// Save New Password
document.getElementById('save-new-password').addEventListener('click', function() {
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
    const email = document.getElementById('forgot-email').value.trim();

    document.getElementById('reset-password-mismatch').classList.add('hidden');
    document.getElementById('reset-success').classList.add('hidden');

    if (!validatePassword(newPassword)) {
        document.getElementById('reset-password-mismatch').textContent = 'Password must be at least 8 characters with uppercase, number, and special character';
        document.getElementById('reset-password-mismatch').classList.remove('hidden');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        document.getElementById('reset-password-mismatch').textContent = 'Passwords do not match';
        document.getElementById('reset-password-mismatch').classList.remove('hidden');
        return;
    }

    showLoading('save-new-password');

    const user = auth.currentUser;

    if (user) {
        user.updatePassword(newPassword)
            .then(() => {
                document.getElementById('reset-success').classList.remove('hidden');
                document.getElementById('reset-password-mismatch').classList.add('hidden');
                
                setTimeout(() => {
                    document.getElementById('forgot-password-modal').classList.add('hidden');
                    document.body.classList.remove('overflow-hidden');
                    document.getElementById('forgot-password-form').reset();
                    document.getElementById('reset-password-section').classList.add('hidden');
                    document.getElementById('reset-success').classList.add('hidden');
                }, 2000);
            })
            .catch((error) => {
                document.getElementById('reset-password-mismatch').textContent = error.message;
                document.getElementById('reset-password-mismatch').classList.remove('hidden');
            })
            .finally(() => {
                hideLoading('save-new-password');
            });
    } else {
        document.getElementById('reset-success').classList.remove('hidden');
        document.getElementById('reset-password-mismatch').classList.add('hidden');
        
        setTimeout(() => {
            document.getElementById('forgot-password-modal').classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            document.getElementById('forgot-password-form').reset();
            document.getElementById('reset-password-section').classList.add('hidden');
            document.getElementById('reset-success').classList.add('hidden');
        }, 2000);
        
        hideLoading('save-new-password');
    }
});
// Add to your existing auth functions
function resendVerification(email) {
    auth.fetchSignInMethodsForEmail(email)
        .then((methods) => {
            if (methods.length > 0) {
                const user = auth.currentUser;
                if (user) {
                    return user.sendEmailVerification()
                        .then(() => {
                            alert("Verification email resent! Please check your inbox.");
                        })
                        .catch((error) => {
                            alert("Error resending verification: " + error.message);
                        });
                } else {
                    // For users who aren't currently signed in
                    return auth.signInWithEmailAndPassword(email, "temporary-password")
                        .then((userCredential) => {
                            return userCredential.user.sendEmailVerification()
                                .then(() => {
                                    auth.signOut(); // Sign out immediately after sending
                                    alert("Verification email resent! Please check your inbox.");
                                });
                        })
                        .catch((error) => {
                            if (error.code === 'auth/wrong-password') {
                                // This is expected since we used a dummy password
                                // Try to send the verification anyway
                                auth.currentUser.sendEmailVerification()
                                    .then(() => {
                                        auth.signOut();
                                        alert("Verification email resent! Please check your inbox.");
                                    })
                                    .catch((sendError) => {
                                        alert("Error resending verification: " + sendError.message);
                                    });
                            } else {
                                alert("Error resending verification: " + error.message);
                            }
                        });
                }
            } else {
                alert("No account found with this email.");
            }
        })
        .catch((error) => {
            alert("Error checking account: " + error.message);
        });
}// Event Listeners
document.getElementById('show-signup').addEventListener('click', function(event) {
    event.preventDefault();
    showSignupSection();
    resetForms();
});

document.getElementById('show-login').addEventListener('click', function(event) {
    event.preventDefault();
    showLoginSection();
    resetForms();
});

document.getElementById('close-forgot-password').addEventListener('click', function() {
    document.getElementById('forgot-password-modal').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    
    // Reset the form and error messages
    document.getElementById('forgot-password-form').reset();
    document.getElementById('reset-password-section').classList.add('hidden');
    document.getElementById('forgot-error').classList.add('hidden');
    document.getElementById('reset-success').classList.add('hidden');
    
    // Show the auth container again
    document.getElementById('auth-container').classList.add('active');
});

document.getElementById('forgot-password-link').addEventListener('click', function(event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent event bubbling
    
    // Hide the auth container but keep the backdrop
    document.getElementById('auth-container').classList.remove('active');
    
    // Show the forgot password modal
    document.getElementById('forgot-password-modal').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
});

// Password match validation
document.getElementById('signup-confirm-password').addEventListener('input', function() {
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password && confirmPassword && password !== confirmPassword) {
        document.getElementById('password-mismatch-error').textContent = 'Passwords do not match';
        document.getElementById('password-mismatch-error').classList.remove('hidden');
    } else {
        document.getElementById('password-mismatch-error').classList.add('hidden');
    }
});

document.getElementById('confirm-new-password').addEventListener('input', function() {
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
        document.getElementById('reset-password-mismatch').textContent = 'Passwords do not match';
        document.getElementById('reset-password-mismatch').classList.remove('hidden');
    } else {
        document.getElementById('reset-password-mismatch').classList.add('hidden');
    }
});

// Close modals when clicking outside
document.getElementById('auth-container').addEventListener('click', function(e) {
    if (e.target === this) {
        hideAuthContainer();
    }
});

document.getElementById('forgot-password-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        // Show the auth container again
        document.getElementById('auth-container').classList.add('active');
    }
});

// Event listeners for mobile account options
document.getElementById('mobileProfileOption')?.addEventListener('click', function(e) {
    e.preventDefault();
    showAccountInfo(e);
    toggleMobileMenu();
});

document.getElementById('mobileLogoutOption')?.addEventListener('click', function(e) {
    e.preventDefault();
    logoutUser(e);
    toggleMobileMenu();
});

// Logout function
function logoutUser(event) {
    if (event) event.preventDefault();
    
    auth.signOut().then(async () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        if (mobileMenuContent) mobileMenuContent.classList.remove('active');
        
        const mobileAccountOptions = document.getElementById('mobileAccountOptions');
        if (mobileAccountOptions) mobileAccountOptions.classList.add('hidden');
        
        if (mobileMenuButton) {
            const icon = mobileMenuButton.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
        
        // Only try to clear account info if on account page
        if (document.getElementById('displayName')) {
            document.getElementById('displayName').textContent = '';
            document.getElementById('displayEmail').textContent = '';
            emailDisplay.value = '';
            
            addressContainer.innerHTML = `
                <div class="text-center text-gray-500">
                    <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                    <p class="text-lg">No addresses saved yet</p>
                    <p class="text-sm mt-2">Please login to view your saved addresses</p>
                </div>
            `;
            
            ordersContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-shopping-bag text-4xl mb-3"></i>
                    <p class="text-lg">You haven't placed any orders yet</p>
                    <p class="text-sm mt-2">Please login to view your orders</p>
                </div>
            `;
            
            if (accountInfoPage) accountInfoPage.classList.add('hidden');
        }
        
        updateLoginButton();
        
        // Reload only if on account page
        if (window.location.pathname.includes('account')) {
            window.location.reload();
        }
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}
// Global function to resend from signup page
function resendVerification(email) {
    auth.fetchSignInMethodsForEmail(email)
        .then((methods) => {
            if (methods.length > 0) {
                // This triggers Firebase to resend
                auth.currentUser.sendEmailVerification()
                    .then(() => alert("Verification email resent!"))
                    .catch((error) => alert(error.message));
            }
        });
}

// Update login button based on auth state
function updateLoginButton() {
    const user = auth.currentUser;
    
    if (loginButton) {
        if (user) {
            loginButton.textContent = 'LOG OUT';
            loginButton.onclick = function(e) {
                e.preventDefault();
                logoutUser(e);
            };
        } else {
            loginButton.textContent = 'LOG IN';
            loginButton.onclick = function(e) {
                e.preventDefault();
                showAuthContainer();
                showLoginSection();
            };
        }
    }
}
// Update mobile account options visibility
function updateMobileAccountOptions() {
    const user = auth.currentUser;
    const mobileAccountOptions = document.getElementById('mobileAccountOptions');
    
    if (mobileAccountOptions) {
        if (user) {
            mobileAccountOptions.classList.remove('hidden');
        } else {
            mobileAccountOptions.classList.add('hidden');
        }
    }
}

// Edit Profile Functionality
function showEditProfileModal() {
    const user = auth.currentUser;
    if (!user) return;
    
    nameInput.value = user.displayName || '';
    emailDisplay.value = user.email || '';
    editProfileModal.classList.remove('hidden');
}

// Update the saveProfile function
async function saveProfile() {
    const user = auth.currentUser;
    if (!user) {
        alert('Please sign in to update your profile');
        return;
    }

    const newName = nameInput.value.trim();
    if (!newName) {
        alert('Please enter a valid name');
        return;
    }

    // Check if name actually changed
    if (newName === user.displayName) {
        editProfileModal.classList.add('hidden');
        return;
    }

    try {
        // Show loading state
        document.getElementById('saveProfileBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        document.getElementById('saveProfileBtn').disabled = true;

        // Update Firebase Auth profile
        await user.updateProfile({
            displayName: newName
        });

        // Update Firestore user document
        await db.collection("users").doc(user.uid).update({
            name: newName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update UI
        document.getElementById('displayName').textContent = newName;
        editProfileModal.classList.add('hidden');
        
        // Show success toast/message
        showToast('Profile updated successfully!');
    } catch (error) {
        console.error("Error updating profile:", error);
        showToast(`Failed to update profile: ${error.message}`, 'error');
    } finally {
        // Reset button state
        document.getElementById('saveProfileBtn').innerHTML = '<i class="fas fa-save mr-2"></i> Save Changes';
        document.getElementById('saveProfileBtn').disabled = false;
    }
}

// Add this helper function for toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
// Address Management

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Edit Profile
    document.getElementById('editProfileIcon')?.addEventListener('click', showEditProfileModal);
    document.getElementById('closeEditProfileModal')?.addEventListener('click', () => {
        editProfileModal.classList.add('hidden');
    });
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
    
    // Address Management
    document.getElementById('closeAddAddressModal')?.addEventListener('click', () => {
        addAddressModal.classList.add('hidden');
    });
});

// Update the setDefaultAddress function
// Show thank you popup with order details
function showThankYouPopup(orderDetails, orderId) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    document.getElementById('thankYouOrderId').textContent = `#${orderId}`;
    document.getElementById('popupOrderId').textContent = orderId;
    document.getElementById('popupOrderDate').textContent = formattedDate;
    
    document.getElementById('popupFullName').textContent = `${orderDetails.firstName} ${orderDetails.lastName}`;
    document.getElementById('popupAddress1').textContent = orderDetails.address;
    document.getElementById('popupAddress2').textContent = orderDetails.apartment || '';
    document.getElementById('popupCityStateZip').textContent = `${orderDetails.city}, ${orderDetails.state} ${orderDetails.pinCode}`;
    document.getElementById('popupCountry').textContent = orderDetails.country;
    document.getElementById('popupPhone').textContent = orderDetails.phone;
// Update the form submission event listener
document.getElementById('addressForm').addEventListener('submit', saveAddress);
    document.getElementById('thankYouPopup').classList.add('active');
    
    document.getElementById('thankYouPopup').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

// Handle successful payment
function handlePaymentSuccess(response, formData) {
    const orderId = saveOrder(response.razorpay_payment_id, formData);
    
    cart = [];
    localStorage.setItem('guestCart', JSON.stringify(cart));
    
    showThankYouPopup(formData, orderId);
}

// Get form data from checkout form
function getFormData() {
    return {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        address: document.getElementById('address').value,
        apartment: document.getElementById('apartment').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pinCode: document.getElementById('pin-code').value,
        country: document.getElementById('country').value,
        phone: document.getElementById('phone').value
    };
}
document.addEventListener('DOMContentLoaded', function() {
    // Get cart from sessionStorage
    const checkoutCart = JSON.parse(sessionStorage.getItem('checkoutCart')) || [];
    
    // Display order summary
    renderOrderSummary(checkoutCart);
    
    // Clear the sessionStorage after use
    sessionStorage.removeItem('checkoutCart');
});

function renderOrderSummary(cartItems) {
    const orderSummaryItems = document.getElementById('orderSummaryItems');
    let subtotal = 0;
    
    if (!cartItems || cartItems.length === 0) {
        orderSummaryItems.innerHTML = '<p class="text-sm text-gray-500">Your cart is empty</p>';
        return;
    }
    
    orderSummaryItems.innerHTML = cartItems.map(item => {
        const priceValue = parseFloat(item.price.replace(/[^\d.]/g, ''));
        const itemTotal = priceValue * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="product-item flex items-center py-4 border-b border-gray-100">
                <img src="${item.image}" alt="${item.title}" 
                     class="w-16 h-16 object-cover rounded mr-4">
                <div class="flex-1">
                    <h4 class="font-medium">${item.title}</h4>
                    <div class="text-sm text-gray-500">
                        <span>Size: ${item.size}</span>
                        <span class="mx-2">•</span>
                        <span>Qty: ${item.quantity}</span>
                    </div>
                </div>
                <div class="font-medium">₹${itemTotal.toFixed(2)}</div>
            </div>
        `;
    }).join('');
    
    // Update totals
    document.getElementById('orderSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('orderGrandTotal').textContent = `₹${subtotal.toFixed(2)}`;
    
    // Store cart in global variable for payment processing
    window.cart = cartItems;
}

// Function to generate a unique order ID with VA prefix and 5-digit number
function generateOrderId() {
    const prefix = "VA";
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNum}`;
}

// Function to calculate the total amount from the cart
function calculateTotalAmount() {
    if (!window.cart) return 0;
    
    let total = 0;
    window.cart.forEach(item => {
        const price = parseFloat(item.price.replace(/[^\d.]/g, ''));
        total += price * item.quantity;
    });
    return total * 100; // Razorpay expects amount in paise
}
async function handlePaymentFailure(response) {
    console.error("Payment failed:", response);
    
    const popup = document.getElementById('paymentFailedPopup');
    popup.classList.add('active');
    
    let seconds = 5;
    const countdownElement = document.getElementById('countdown');
    
    const countdown = setInterval(() => {
        seconds--;
        countdownElement.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(countdown);
            window.location.reload();
        }
    }, 1000);
    
    try {
        const user = auth.currentUser;
        await db.collection("paymentFailures").add({
            userId: user?.uid || "guest",
            email: user?.email || document.getElementById('email')?.value || "unknown",
            error: response.error,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            amount: calculateTotalAmount() / 100,
            cart: [...cart]
        });
    } catch (error) {
        console.error("Error logging payment failure:", error);
    }
}

// Save order to Firestore (updated version)
async function saveOrder(paymentId, formData) {
    const user = auth.currentUser;
    const orderId = generateOrderId();
    
    const orderData = {
        orderId: orderId,
        date: new Date().toISOString(),
        status: 'pending',
        paymentId: paymentId,
        userId: user?.uid || "guest",
        email: user?.email || document.getElementById('email').value,
        items: [...cart],
        shippingAddress: {
            name: `${formData.firstName} ${formData.lastName}`,
            address: formData.address,
            apartment: formData.apartment || '',
            city: formData.city,
            state: formData.state,
            postalCode: formData.pinCode,
            country: formData.country,
            phone: formData.phone
        },
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection("orders").doc(orderId).set(orderData);
        return orderId;
    } catch (error) {
        console.error("Error saving order:", error);
        throw error;
    }
}

// Place order function with Razorpay integration
async function placeOrder() {
    if (!validateCheckoutForm()) {
        return;
    }

    const amount = calculateTotalAmount();
    const formData = getFormData();

    const options = {
        key: "rzp_live_DPartLBDccSG34",
        amount: amount,
        currency: "INR",
        name: "VAMORA.STORE",
        description: "Order Payment",
        prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone
        },
        notes: {
            address: `${formData.address}, ${formData.pinCode}`
        },
        theme: {
            color: "#000000"
        },
handler: async function(response) {
            try {
                const orderId = await saveOrder(response.razorpay_payment_id, formData);
                handlePaymentSuccess(response, formData, orderId);
                
                // Clear cart after successful payment
                if (auth.currentUser) {
                    await db.collection("carts").doc(auth.currentUser.uid).delete();
                }
                sessionStorage.removeItem('guestCart');
                localStorage.removeItem('guestCart');
            } catch (error) {
                console.error("Error processing order:", error);
                alert("There was an error saving your order. Please contact support.");
            }
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();

    rzp.on('payment.failed', function(response) {
        handlePaymentFailure(response);
    });
}

// Main event listeners
accountIconNav.addEventListener('click', function(e) {
    e.stopPropagation();
    const user = auth.currentUser;
    if (user) {
        toggleDropdown();
    } else {
        showAuthContainer();
        showLoginSection();
    }
});
profileOption.addEventListener('click', showAccountInfo);
logoutOption.addEventListener('click', logoutUser);
editProfileIcon.addEventListener('click', showEditProfileModal);
closeEditProfileModal.addEventListener('click', function() {
    editProfileModal.classList.add('hidden');
});
addAddressLink.addEventListener('click', showAddAddressModal);
closeAddAddressModal.addEventListener('click', function() {
    addAddressModal.classList.add('hidden');
});
saveAddressBtn.addEventListener('click', saveAddress);
mobileMenuButton.addEventListener('click', toggleMobileMenu);

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!accountIconNav.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.add('hidden');
        dropdownOpen = false;
    }
});
// Update the auth state handler to show/hide add address button
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Show add address button
        const addAddressLink = document.getElementById('addAddressLink');
        if (addAddressLink) addAddressLink.style.display = 'block';
        
        // Load user data
        loadAccountInfo(user.uid);
    } else {
        // Hide add address button
        const addAddressLink = document.getElementById('addAddressLink');
        if (addAddressLink) addAddressLink.style.display = 'none';
    }
});
// Unified auth state handler
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Handle cart merging (guest → logged-in)
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || []);
        const firestoreCart = await getOrCreateUserCart(user.uid);
        
        const mergedCart = mergeCarts(firestoreCart, guestCart);
        
        await saveCartToFirestore(user.uid, mergedCart);
        localStorage.removeItem('guestCart');
        
        cart = mergedCart;
        renderCart();

        // Load user data from Firestore
        try {
            const userDoc = await db.collection("users").doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                updateUIWithUserData(user, userData);
                document.getElementById('email').value = user.email;
            } else {
                await db.collection("users").doc(user.uid).set({
                    name: user.displayName || '',
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
        } catch (error) {
            console.error("Error loading user data:", error);
        }
        
    } else {
        // User is signed out - load guest cart only
        cart = JSON.parse(localStorage.getItem('guestCart') || []);
        applyDefaultAddress();
    }
    
    setupResendVerification();
    updateLoginButton();
    renderCart();
});
// New helper function to update UI with Firestore data
function updateUIWithUserData(user, userData) {
    // Cache DOM elements to avoid multiple queries
    const displayNameEl = document.getElementById('displayName');
    const displayEmailEl = document.getElementById('displayEmail');
    
    // Update display name if element exists
    if (displayNameEl) {
        displayNameEl.textContent = userData?.name || user?.displayName || '';
    }
    
    // Update display email if element exists
    if (displayEmailEl) {
        displayEmailEl.textContent = user?.email || '';
    }
    
    // Update form inputs if they exist
    if (nameInput) {
        nameInput.value = userData?.name || user?.displayName || '';
    }
    if (emailDisplay) {
        emailDisplay.value = user?.email || '';
        if (emailDisplay.readOnly !== undefined) {
            emailDisplay.readOnly = true; // Keep email read-only in forms
        }
    }
    
    // Only load addresses/orders if user exists and is authenticated
    if (user && user.uid) {
        try {
            loadAddresses(user.uid);
            loadOrders(user.uid);
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }
}

// Update the Pay Now button event listener with better error handling
const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        try {
            placeOrder();
        } catch (error) {
            console.error("Checkout error:", error);
            alert("There was an error processing your order. Please try again.");
        }
    });
}
// Update the Pay Now button event listener
if (document.querySelector('.checkout-btn')) {
    document.querySelector('.checkout-btn').addEventListener('click', placeOrder);
}

// Helper function to merge carts
function mergeCarts(firestoreCart, guestCart) {
    const merged = [...firestoreCart];
    
    guestCart.forEach(guestItem => {
        const existingItem = merged.find(item => 
            item.id === guestItem.id && item.size === guestItem.size
        );
        
        if (existingItem) {
            existingItem.quantity += guestItem.quantity;
        } else {
            merged.push(guestItem);
        }
    });
    
    return merged;
}
