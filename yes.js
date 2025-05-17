// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAe5eAhAI5LTYN8yI6uFN5ib-zqK_SEEt0",
    authDomain: "vamorastore-269.firebaseapp.com",
    projectId: "vamorastore-269",
    storageBucket: "vamorastore-269.appspot.com",
    messagingSenderId: "842951797209",
    appId: "1:842951797209:web:afa169d8117ebcf5aad1c8",
    measurementId: "G-K45X0K580Q"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const analytics = firebase.analytics();
const db = firebase.firestore(); // Add this line

// Initialize cart (updated for Firestore)
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
  // For logged-in users, you would typically fetch the cart from Firestore here
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
    
    // If search is already open, close it
    if (searchOpen) {
        searchInputContainer.style.display = 'none';
        searchInput.value = '';
        searchResults.style.display = 'none';
        searchOpen = false;
        return;
    }
    
    // Otherwise, close other elements and open search
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
    
    // Add click event to results
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
        // Extract numeric price value
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

// Updated addToCart function (example)
async function addToCart(product) {
  const user = auth.currentUser;
  
  // Check if item exists in cart
  const existingItem = cart.find(item => 
    item.id === product.id && item.size === product.size
  );

  if (existingItem) {
    existingItem.quantity += product.quantity;
  } else {
    cart.push(product);
  }

  if (user) {
    // Logged-in user: save to Firestore
    await saveCartToFirestore(user.uid, cart);
  } else {
    // Guest user: save to localStorage
    localStorage.setItem('guestCart', JSON.stringify(cart));
  }
  
  renderCart();
}
// Updated removeFromCart function
async function removeFromCart(productId, size) {
  const user = auth.currentUser;
  
  // Remove item from cart array
  cart = cart.filter(item => !(item.id === productId && item.size === size));

  if (user) {
    // Logged-in user: update Firestore
    await saveCartToFirestore(user.uid, cart);
  } else {
    // Guest user: update localStorage
    localStorage.setItem('guestCart', JSON.stringify(cart));
  }
  
  renderCart();
}

async function updateCartItem(productId, size, newQuantity) {
  const user = auth.currentUser;
  
  // Update quantity in cart array
  const item = cart.find(item => item.id === productId && item.size === size);
  if (item) {
    item.quantity = newQuantity;
  }

  if (user) {
    // Logged-in user: update Firestore
    await saveCartToFirestore(user.uid, cart);
  } else {
    // Guest user: update localStorage
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
    // Prompt login or continue as guest
    showAuthContainer();
    return;
  }

  // Cart is already in Firestore, redirect to checkout
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
        // Extract numeric price value
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
    
    // Update totals
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
    
    // Helper function to validate and highlight fields
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
    
    // Validate all required fields (except apartment/suite)
    validateField('email', 'email-error');
    validateField('first-name', 'first-name-error');
    validateField('last-name', 'last-name-error');
    validateField('address', 'address-error');
    validateField('city', 'city-error');
    validateField('state', 'state-error');
    validateField('pin-code', 'pin-code-error');
    validateField('phone', 'phone-error');
    
    // Additional email validation
    const email = document.getElementById('email').value;
    if (email && !validateEmail(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email address';
        document.getElementById('email-error').style.display = 'block';
        document.getElementById('email').classList.add('error-highlight');
        isValid = false;
    }
    
    // Additional phone validation
    const phone = document.getElementById('phone').value;
    if (phone && !/^\d{10}$/.test(phone)) {
        document.getElementById('phone-error').textContent = 'Please enter a valid 10-digit phone number';
        document.getElementById('phone-error').style.display = 'block';
        document.getElementById('phone').classList.add('error-highlight');
        isValid = false;
    }
    
    // Additional PIN code validation
    const pinCode = document.getElementById('pin-code').value;
    if (pinCode && !/^\d{6}$/.test(pinCode)) {
        document.getElementById('pin-code-error').textContent = 'Please enter a valid 6-digit PIN code';
        document.getElementById('pin-code-error').style.display = 'block';
        document.getElementById('pin-code').classList.add('error-highlight');
        isValid = false;
    }
    
    // Scroll to first error if any
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
    // If dropdown is already open, close it
    if (dropdownOpen) {
        dropdownMenu.classList.add('hidden');
        dropdownOpen = false;
        return;
    }
    
    // Otherwise, close other elements and open dropdown
    closeAllOpenElements();
    dropdownOpen = true;
    dropdownMenu.classList.remove('hidden');
}

// Mobile menu toggle
function toggleMobileMenu() {
    // If mobile menu is already open, close it
    if (mobileMenuContent.classList.contains('active')) {
        mobileMenuContent.classList.remove('active');
        mobileMenuButton.querySelector('i').classList.add('fa-bars');
        mobileMenuButton.querySelector('i').classList.remove('fa-times');
        document.getElementById('mobileAccountOptions').classList.add('hidden');
        return;
    }
    
    // Otherwise, close other elements and open mobile menu
    closeAllOpenElements();
    mobileMenuContent.classList.add('active');
    mobileMenuButton.querySelector('i').classList.remove('fa-bars');
    mobileMenuButton.querySelector('i').classList.add('fa-times');
    
    // Show account options if logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
        document.getElementById('mobileAccountOptions').classList.remove('hidden');
    } else {
        document.getElementById('mobileAccountOptions').classList.add('hidden');
    }
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
        } else {
            // Clear addresses and orders if no email (logged out)
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
        }
        
        accountInfoPage.classList.remove('hidden');
        dropdownMenu.classList.add('hidden');
        mobileMenuContent.classList.remove('active');
        document.getElementById('mobileAccountOptions').classList.add('hidden');
        mobileMenuButton.querySelector('i').classList.add('fa-bars');
        mobileMenuButton.querySelector('i').classList.remove('fa-times');
    } else {
        // Show login modal if user is not logged in
        showAuthContainer();
        showLoginSection(); // Always show login first
    }
}

// Close account info page
closeAccountInfoPage.addEventListener('click', function(event) {
    event.preventDefault();
    accountInfoPage.classList.add('hidden');
});
function renderAddresses(addresses) {
    if (addresses.length === 0) {
        addressContainer.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                <p class="text-lg">No addresses saved yet</p>
                <p class="text-sm mt-2">Add an address to get started</p>
            </div>
        `;
        return;
    }

    addressContainer.innerHTML = addresses.map(address => `
        <div class="address-item border rounded-lg p-4 mb-4 ${address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-medium">${address.fullName}</h3>
                    <p class="text-gray-600">${address.addressLine1}</p>
                    ${address.addressLine2 ? `<p class="text-gray-600">${address.addressLine2}</p>` : ''}
                    <p class="text-gray-600">${address.city}, ${address.state} ${address.postalCode}</p>
                    <p class="text-gray-600">${address.country}</p>
                    <p class="text-gray-600">Phone: ${address.phoneNumber}</p>
                    <span class="inline-block mt-2 px-2 py-1 text-xs rounded-full ${address.isDefault ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                        ${address.addressType === 'home' ? 'Home' : 'Work'}
                    </span>
                    ${address.isDefault ? '<span class="ml-2 text-xs text-blue-600">(Default)</span>' : ''}
                </div>
                <div class="flex space-x-2">
                    <button onclick="editAddress('${address.id}')" class="text-blue-500 hover:text-blue-700">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteAddress('${address.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${!address.isDefault ? `
                <div class="mt-3">
                    <button onclick="setDefaultAddress('${address.id}')" class="text-sm text-blue-600 hover:text-blue-800">
                        Set as default
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}
async function loadAccountInfo(userId) {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      renderEmptyAccountState();
      return;
    }

    // Fetch user data from Firestore
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      console.warn("No user data found in Firestore");
      renderEmptyAccountState();
      return;
    }

    const userData = userDoc.data();
    
    // Update UI with Firestore data
    updateUIWithUserData(user, userData);
    
  } catch (error) {
    console.error("Error loading account info:", error);
    renderEmptyAccountState();
  }
}
function renderEmptyAccountState() {
    // Clear UI for logged out state
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
    
    // Clear any profile fields
    if (document.getElementById('displayName')) {
        document.getElementById('displayName').textContent = '';
    }
    if (document.getElementById('displayEmail')) {
        document.getElementById('displayEmail').textContent = '';
    }
}

async function applyDefaultAddress() {
    const user = auth.currentUser;
    
    if (user) {
        try {
            // Get user data from Firestore
            const userDoc = await db.collection("users").doc(user.uid).get();
            
            if (userDoc.exists && userDoc.data().defaultAddress) {
                const defaultAddress = userDoc.data().defaultAddress;
                
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
                document.getElementById('country').value = defaultAddress.country || '';
                document.getElementById('phone').value = defaultAddress.phoneNumber || '';
            }
        } catch (error) {
            console.error("Error fetching default address:", error);
        }
    }
}
// Load addresses
async function loadAddresses() {
    const user = auth.currentUser;
    if (!user) {
        addressContainer.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                <p class="text-lg">Please sign in to view addresses</p>
            </div>
        `;
        return;
    }

    try {
        const doc = await db.collection("users").doc(user.uid).get();
        if (doc.exists) {
            const userData = doc.data();
            renderAddresses(userData.addresses || []);
        } else {
            renderEmptyAddressState();
        }
    } catch (error) {
        console.error("Error loading addresses:", error);
        renderEmptyAddressState();
    }
}
// Load orders
// Load orders from Firestore
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
        // Query orders for this user, ordered by timestamp descending
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

        const orders = querySnapshot.docs.map(doc => doc.data());
        renderOrders(orders);
    } catch (error) {
        console.error("Error loading orders:", error);
        ordersContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                <p class="text-lg">Error loading orders</p>
                <p class="text-sm mt-2">Please try again later</p>
            </div>
        `;
    }
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
            
            <!-- Order Status Bar -->
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

    // Validate required fields
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

    // Get all form values
    const address = {
        fullName: `${document.getElementById('first-name').value} ${document.getElementById('last-name').value}`,
        phoneNumber: document.getElementById('phone').value,
        addressLine1: document.getElementById('address').value,
        addressLine2: document.getElementById('apartment').value || '',
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('pin-code').value,
        country: document.getElementById('country').value,
        addressType: 'home', // Default type
        isDefault: true,
        id: Date.now().toString(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

     try {
        const user = auth.currentUser;
        
        if (user) {
            const userRef = db.collection("users").doc(user.uid);
            
            // Update the user document with the new address
            await userRef.update({
                addresses: firebase.firestore.FieldValue.arrayUnion(address),
                defaultAddress: address, // Store the default address in Firestore
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
    showLoginSection(); // Always show login first
    resetForms();
}

function hideAuthContainer() {
    document.getElementById('auth-container').classList.remove('active');
    document.body.classList.remove('overflow-hidden');
    resetForms();
    // Reset the login form styling
    document.getElementById('login-section').classList.remove('login-success');
    // Hide Google success messages
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

function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const inputId = this.id.replace('toggle-', '');
            const input = document.getElementById(inputId);
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });
}

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

// Validate all fields
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

// Create user with Firebase
auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        // Signed up successfully
        const user = userCredential.user;
        
        // Update user profile with display name
        return user.updateProfile({
            displayName: name
        }).then(() => {
            // Save to Firestore
            return db.collection("users").doc(user.uid).set({
                name: name,
                email: email,
                securityQuestion: securityQuestion,
                securityAnswer: securityAnswer,
                addresses: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }).then(() => {
            // Optional: Cache minimal user data in localStorage
            localStorage.setItem('user', JSON.stringify({
                uid: user.uid,
                name: name,
                email: email
            }));
            
            // Show success message
            document.getElementById('verify-email-success').classList.remove('hidden');
            document.getElementById('signup-form').reset();
            
            // Auto switch to login after delay
            setTimeout(() => {
                document.getElementById('signup-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
                document.getElementById('verify-email-success').classList.add('hidden');
                hideAuthContainer();
                loadAccountInfo(email);
                updateLoginButton();
                updateMobileAccountOptions();
            }, 2000);
        });
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        
        if (errorCode === 'auth/email-already-in-use') {
            document.getElementById('email-exists-error').classList.remove('hidden');
        } else {
            document.getElementById('signup-error').textContent = errorMessage;
            document.getElementById('signup-error').classList.remove('hidden');
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

    // Reset error messages
    document.getElementById('login-error').classList.add('hidden');

 // Inside the login form submit handler
auth.signInWithEmailAndPassword(email, password)
  .then(async (userCredential) => {
    const user = userCredential.user;
    
    try {
      // Get user data from Firestore
      const doc = await db.collection("users").doc(user.uid).get();
      
      if (!doc.exists) {
        throw new Error("User data not found");
      }
      
      const userData = doc.data();
      
      // Update UI with Firestore data
      updateUIWithUserData(user, userData);
      
      // Show success message
      document.getElementById('login-error').classList.add('hidden');
      const successElement = document.getElementById('login-success');
      successElement.textContent = 'Login successful! Redirecting...';
      successElement.classList.remove('hidden');
                
                // Add visual feedback
                document.getElementById('login-section').classList.add('login-success');
                
                // Hide loading immediately
                hideLoading('login-submit-button');
                
                // Wait for animation to complete (500ms) then proceed
                setTimeout(() => {
                    // Close auth modal
                    hideAuthContainer();
                    
                    // Show profile page with animation
                    accountInfoPage.classList.remove('hidden');
                    accountInfoPage.style.opacity = '0';
                    accountInfoPage.style.transition = 'opacity 0.5s ease';
                    
                    // Load user data into profile
                    document.getElementById('displayName').textContent = userData.name || '';
                    document.getElementById('displayEmail').textContent = user.email || '';
                    emailDisplay.value = user.email || '';
                    
                    // Load addresses and orders
                    loadAddresses(user.uid);
                    loadOrders(user.uid);
                    
                    // Force reflow to ensure transition works
                    void accountInfoPage.offsetWidth;
                    
                    // Fade in profile page
                    accountInfoPage.style.opacity = '1';
                    
                    // Update UI elements
                    updateLoginButton();
                    updateMobileAccountOptions();
                    
                    // Update checkout email if on checkout page
                    if (document.getElementById('email')) {
                        document.getElementById('email').value = user.email;
                    }
                }, 500);
                
            } catch (error) {
                console.error("Error handling login:", error);
                document.getElementById('login-error').textContent = 'Error processing login. Please try again.';
                document.getElementById('login-error').classList.remove('hidden');
                hideLoading('login-submit-button');
                document.getElementById('login-section').classList.remove('login-success');
            }
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            
            document.getElementById('login-error').textContent = 'Invalid email or password';
            document.getElementById('login-error').classList.remove('hidden');
            hideLoading('login-submit-button');
            
            // Remove success state if there was an error
            document.getElementById('login-section').classList.remove('login-success');
        });
});

// Updated Google Sign In/Sign Up handler with Firestore (no localStorage)
document.querySelectorAll('#google-signin-btn').forEach(button => {
    button.addEventListener('click', function() {
        // Show loading state
        const googleBtn = this;
        const originalContent = googleBtn.innerHTML;
        googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        googleBtn.disabled = true;

        const provider = new firebase.auth.GoogleAuthProvider();
        
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                
                // Get the current auth section (login or signup)
                const currentAuthSection = document.querySelector('.auth-section:not(.hidden)');
                const isLoginSection = currentAuthSection.id === 'login-section';
                
                // Show success message in the appropriate section
                if (isLoginSection) {
                    document.getElementById('google-login-success').classList.remove('hidden');
                } else {
                    document.getElementById('google-signup-success').classList.remove('hidden');
                }
                
                // Hide other messages
                document.getElementById('login-error').classList.add('hidden');
                document.getElementById('signup-error').classList.add('hidden');
                
                // Update user data in Firestore
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
                
                // Reset button state
                googleBtn.innerHTML = originalContent;
                googleBtn.disabled = false;
                
                // Show success state briefly
                setTimeout(() => {
                    hideAuthContainer();
                    
                    // Load all user data directly from Firestore
                    loadAccountInfo(user.uid).then(() => {
                        // Show profile page after data loads
                        accountInfoPage.classList.remove('hidden');
                        
                        // Load profile picture if available
                        if (user.photoURL) {
                            document.getElementById('profilePicture').src = user.photoURL;
                        }
                        
                        // Update UI elements
                        updateLoginButton();
                        updateMobileAccountOptions();
                        
                        // Update checkout email if on checkout page
                        if (document.getElementById('email')) {
                            document.getElementById('email').value = user.email;
                        }
                    });
                }, 1500);
            })
            .catch((error) => {
                // Error handling
                googleBtn.innerHTML = originalContent;
                googleBtn.disabled = false;
                
                const errorMessage = error.message;
                const currentAuthSection = document.querySelector('.auth-section:not(.hidden)');
                const isLoginSection = currentAuthSection.id === 'login-section';
                
                if (isLoginSection) {
                    document.getElementById('login-error').textContent = errorMessage;
                    document.getElementById('login-error').classList.remove('hidden');
                    document.getElementById('google-login-success').classList.add('hidden');
                } else {
                    document.getElementById('signup-error').textContent = errorMessage;
                    document.getElementById('signup-error').classList.remove('hidden');
                    document.getElementById('google-signup-success').classList.add('hidden');
                }
            });
    });
});

// Updated Forgot Password with Firestore
document.getElementById('forgot-password-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading('forgot-submit-button');
    
    const email = document.getElementById('forgot-email').value.trim();
    const securityQuestion = document.getElementById('forgot-security-question').value;
    const securityAnswer = document.getElementById('forgot-security-answer').value.trim();

    // Reset error message
    document.getElementById('forgot-error').classList.add('hidden');

    // Verify security question/answer from Firestore
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
            
            // Send password reset email
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

// Save New Password (unchanged, as it uses Firebase Auth directly)
document.getElementById('save-new-password').addEventListener('click', function() {
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
    const email = document.getElementById('forgot-email').value.trim();

    // Reset error message
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

    // Get the current user (if logged in)
    const user = auth.currentUser;

    if (user) {
        // User is logged in, update password directly
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
        // User not logged in, we've already sent reset email
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

// Event Listeners (unchanged)
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
    document.getElementById('forgot-password-form').reset();
    document.getElementById('reset-password-section').classList.add('hidden');
    document.getElementById('forgot-error').classList.add('hidden');
    document.getElementById('reset-success').classList.add('hidden');
});

document.getElementById('forgot-password-link').addEventListener('click', function(event) {
    event.preventDefault();
    hideAuthContainer();
    document.getElementById('forgot-password-modal').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
});

// Password match validation (unchanged)
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

// Close modals when clicking outside (unchanged)
document.getElementById('auth-container').addEventListener('click', function(e) {
    if (e.target === this) {
        hideAuthContainer();
    }
});

document.getElementById('forgot-password-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
});

// Event listeners for mobile account options (unchanged)
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
    event.preventDefault();
    auth.signOut().then(async () => {
       
        
        // Close all menus
        dropdownMenu.classList.add('hidden');
        mobileMenuContent.classList.remove('active');
        document.getElementById('mobileAccountOptions').classList.add('hidden');
        mobileMenuButton.querySelector('i').classList.add('fa-bars');
        mobileMenuButton.querySelector('i').classList.remove('fa-times');
        
        // Clear the displayed information
        document.getElementById('displayName').textContent = '';
        document.getElementById('displayEmail').textContent = '';
        emailDisplay.value = '';
        
        // Clear addresses and orders display
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
        
        // Hide the account info page if it's visible
        accountInfoPage.classList.add('hidden');
        
        // Update the login button text
        updateLoginButton();
        
        // Refresh the page after a short delay to ensure all changes are applied
        window.location.reload();
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Update login button based on auth state
function updateLoginButton() {
  const user = auth.currentUser; // Now checking auth state directly
  
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
    const user = JSON.parse(localStorage.getItem('user'));
    const mobileAccountOptions = document.getElementById('mobileAccountOptions');
    
    if (mobileAccountOptions) {
        if (user && user.email) {
            mobileAccountOptions.classList.remove('hidden');
        } else {
            mobileAccountOptions.classList.add('hidden');
        }
    }
}

// Show edit profile modal
function showEditProfileModal() {
    const user = JSON.parse(localStorage.getItem('user'));
    nameInput.value = user.name || '';
    emailDisplay.value = user.email || '';
    emailDisplay.readOnly = true;
    editProfileModal.classList.remove('hidden');
}

async function saveProfile() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Update Firebase Auth profile
        await user.updateProfile({ displayName: nameInput.value });
        
        // Update Firestore
        await db.collection("users").doc(user.uid).update({
            name: nameInput.value
        });

        // Update UI
        document.getElementById('displayName').textContent = nameInput.value;
        editProfileModal.classList.add('hidden');
    } catch (error) {
        console.error("Error updating profile:", error);
    }
}

// Show add address modal
function showAddAddressModal(event) {
    event.preventDefault();
    document.getElementById('addressForm').reset();
    delete document.getElementById('addressForm').dataset.editingId;
    addAddressModal.classList.remove('hidden');
}

async function saveAddress(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    // Get all form values
    const address = {
        fullName: document.getElementById('fullName').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        addressLine1: document.getElementById('addressLine1').value.trim(),
        addressLine2: document.getElementById('addressLine2').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        postalCode: document.getElementById('postalCode').value.trim(),
        country: document.getElementById('country').value,
        addressType: document.querySelector('input[name="addressType"]:checked').value,
        isDefault: document.getElementById('setAsDefault').checked,
        id: isEditing || Date.now().toString(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Basic validation
    if (!address.fullName || !address.phoneNumber || !address.addressLine1 || 
        !address.city || !address.state || !address.postalCode || !address.country) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const userRef = db.collection("users").doc(user.uid);
        
        if (isEditing) {
            // For editing, we need to update the specific address in the array
            const userDoc = await userRef.get();
            const currentAddresses = userDoc.data().addresses || [];
            
            // Find and update the address
            const updatedAddresses = currentAddresses.map(addr => 
                addr.id === isEditing ? address : addr
            );
            
            // If this is set as default, unset any existing default
            if (address.isDefault) {
                updatedAddresses.forEach(addr => {
                    if (addr.id !== address.id) addr.isDefault = false;
                });
            }
            
            // Update Firestore
            await userRef.update({
                addresses: updatedAddresses,
                ...(address.isDefault && { defaultAddress: address })
            });
            
            delete document.getElementById('addressForm').dataset.editingId;
        } else {
            // For new address, we add it to the array
            if (address.isDefault) {
                // If setting as default, first unset any existing defaults
                const userDoc = await userRef.get();
                const currentAddresses = userDoc.data().addresses || [];
                
                const updatedAddresses = currentAddresses.map(addr => ({
                    ...addr,
                    isDefault: false
                }));
                
                // Add the new address and update Firestore
                await userRef.update({
                    addresses: [...updatedAddresses, address],
                    defaultAddress: address
                });
            } else {
                // Just add the new address
                await userRef.update({
                    addresses: firebase.firestore.FieldValue.arrayUnion(address)
                });
            }
        }

        // Reload UI
        await loadAddresses();
        addAddressModal.classList.add('hidden');
        document.getElementById('addressForm').reset();
        
    } catch (error) {
        console.error("Error saving address:", error);
        alert("Failed to save address. Please try again.");
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
        
        // Check if we're deleting the default address
        const defaultAddress = userDoc.data().defaultAddress;
        const isDeletingDefault = defaultAddress && defaultAddress.id === addressId;
        
        // Update Firestore
        await userRef.update({
            addresses: updatedAddresses,
            ...(isDeletingDefault && { 
                defaultAddress: updatedAddresses.length > 0 ? updatedAddresses[0] : null 
            })
        });
        
        await loadAddresses();
    } catch (error) {
        console.error("Error deleting address:", error);
        alert("Failed to delete address. Please try again.");
    }
}

async function setDefaultAddress(addressId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userRef = db.collection("users").doc(user.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) return;
        
        const addresses = userDoc.data().addresses || [];
        const updatedAddresses = addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId
        }));
        
        const defaultAddress = addresses.find(addr => addr.id === addressId);
        
        await userRef.update({
            addresses: updatedAddresses,
            defaultAddress: defaultAddress
        });
        
        await loadAddresses();
    } catch (error) {
        console.error("Error setting default address:", error);
    }
}
function editAddress(addressId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.addresses) return;
    
    const address = user.addresses.find(addr => addr.id === addressId);
    if (!address) return;
    
    // Fill the form with the address data
    document.getElementById('fullName').value = address.fullName;
    document.getElementById('phoneNumber').value = address.phoneNumber;
    document.getElementById('addressLine1').value = address.addressLine1;
    document.getElementById('addressLine2').value = address.addressLine2 || '';
    document.getElementById('city').value = address.city;
    document.getElementById('state').value = address.state;
    document.getElementById('postalCode').value = address.postalCode;
    document.getElementById('country').value = address.country;
    document.querySelector(`input[name="addressType"][value="${address.addressType}"]`).checked = true;
    document.getElementById('setAsDefault').checked = address.isDefault;
    
    // Store the address ID being edited
    document.getElementById('addressForm').dataset.editingId = addressId;
    
    // Update modal title
    document.querySelector('#addAddressModal h3').textContent = 'Edit Address';
    
    addAddressModal.classList.remove('hidden');
}

async function setDefaultAddress(addressId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userRef = db.collection("users").doc(user.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) return;
        
        const addresses = userDoc.data().addresses || [];
        const updatedAddresses = addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId
        }));
        
        const defaultAddress = addresses.find(addr => addr.id === addressId);
        
        await userRef.update({
            addresses: updatedAddresses,
            defaultAddress: defaultAddress
        });
        
        await loadAddresses();
    } catch (error) {
        console.error("Error setting default address:", error);
    }
}
// Show thank you popup with order details
function showThankYouPopup(orderDetails, orderId) {
    // Format the date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Update the popup content
    document.getElementById('thankYouOrderId').textContent = `#${orderId}`;
    document.getElementById('popupOrderId').textContent = orderId;
    document.getElementById('popupOrderDate').textContent = formattedDate;
    
    // Update shipping address
    document.getElementById('popupFullName').textContent = `${orderDetails.firstName} ${orderDetails.lastName}`;
    document.getElementById('popupAddress1').textContent = orderDetails.address;
    document.getElementById('popupAddress2').textContent = orderDetails.apartment || '';
    document.getElementById('popupCityStateZip').textContent = `${orderDetails.city}, ${orderDetails.state} ${orderDetails.pinCode}`;
    document.getElementById('popupCountry').textContent = orderDetails.country;
    document.getElementById('popupPhone').textContent = orderDetails.phone;

    // Show the popup
    document.getElementById('thankYouPopup').classList.add('active');
    
    // Close the popup when clicking outside
    document.getElementById('thankYouPopup').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

// Handle successful payment
function handlePaymentSuccess(response, formData) {
    // Save the order and get the order ID
    const orderId = saveOrder(response.razorpay_payment_id, formData);
    
    // Clear the cart
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show thank you popup with order details
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

// Function to generate a unique order ID with VA prefix and 5-digit number
function generateOrderId() {
    const prefix = "VA";
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
    return `${prefix}${randomNum}`;
}

// Function to calculate the total amount from the cart
function calculateTotalAmount() {
    let total = 0;
    cart.forEach(item => {
        const price = parseFloat(item.price.replace(/[^\d.]/g, '')); // Extract numeric price
        total += price * item.quantity;
    });
    return total * 100; // Convert to paise (Razorpay expects amount in smallest currency unit)
}

async function handlePaymentFailure(response) {
    console.error("Payment failed:", response);
    
    // Show payment failed popup
    const popup = document.getElementById('paymentFailedPopup');
    popup.classList.add('active');
    
    // Start countdown and refresh
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
    
    // Log payment failure to Firestore
    try {
        const user = auth.currentUser;
        await db.collection("paymentFailures").add({
            userId: user?.uid || "guest",
            email: user?.email || document.getElementById('email')?.value || "unknown",
            error: response.error,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            amount: calculateTotalAmount() / 100, // Convert back to rupees
            cart: [...cart] // Save cart items for debugging
        });
    } catch (error) {
        console.error("Error logging payment failure:", error);
    }
}
// Save order to Firestore
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
        items: [...cart], // Copy the cart items
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
        // Save to Firestore
        await db.collection("orders").doc(orderId).set(orderData);
        return orderId;
    } catch (error) {
        console.error("Error saving order:", error);
        throw error;
    }
}
// Place order function with Razorpay integration
async function placeOrder() {
    // 1. Validate form first
    if (!validateCheckoutForm()) {
        return;
    }

    // 2. Calculate total amount (in paise)
    const amount = calculateTotalAmount();
    const formData = getFormData();

    // 3. Razorpay options with UPI QR disabled
    const options = {
        key: "rzp_live_DPartLBDccSG34", // Replace with your test/live key
        amount: amount, // Amount in paise (e.g., ₹100 = 10000 paise)
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
                // Handle successful payment
                const orderId = await saveOrder(response.razorpay_payment_id, formData);
                handlePaymentSuccess(response, formData, orderId);
            } catch (error) {
                console.error("Error processing order:", error);
                // Show error message to user
                alert("There was an error saving your order. Please contact support with your payment ID: " + response.razorpay_payment_id);
            }
        },
        method: {
            netbanking: true,
            card: true,
            wallet: true,
            upi: true,
            paylater: true
        },
        upi: {
            flow: "collect",
            vpa: ""
        }
    };

    // 4. Open Razorpay payment modal
    const rzp = new Razorpay(options);
    rzp.open();

    // 5. Handle payment failure
    rzp.on('payment.failed', function(response) {
        handlePaymentFailure(response);
    });
}

// Main event listeners
accountIconNav.addEventListener('click', function(e) {
    e.stopPropagation();
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
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
saveProfileBtn.addEventListener('click', saveProfile);
addAddressLink.addEventListener('click', showAddAddressModal);
closeAddAddressModal.addEventListener('click', function() {
    addAddressModal.classList.add('hidden');
});
saveAddressBtn.addEventListener('click', saveAddress);
cancelAddressBtn.addEventListener('click', cancelAddress);
mobileMenuButton.addEventListener('click', toggleMobileMenu);

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!accountIconNav.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.add('hidden');
        dropdownOpen = false;
    }
});

// Unified auth state handler
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // [1] Handle cart merging (guest → logged-in)
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    const firestoreCart = await getOrCreateUserCart(user.uid);
    
    // Merge carts
    const mergedCart = mergeCarts(firestoreCart, guestCart);
    
    // Save merged cart to Firestore and clear guest cart
    await saveCartToFirestore(user.uid, mergedCart);
    localStorage.removeItem('guestCart');
    
    // Update local cart state
    cart = mergedCart;
    renderCart();

    // [2] Load user data from Firestore
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Handle "Remember Me" functionality
        if (userData.rememberMe) {
          document.getElementById('login-email').value = user.email;
          document.getElementById('remember-me').checked = true;
        }
        
        // Update UI with Firestore data
        updateUIWithUserData(user, userData);
        document.getElementById('email').value = user.email;

      } else {
        // Create user doc if it doesn't exist
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
    cart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    applyDefaultAddress();
  }
  
  // Always update UI elements
  updateLoginButton();
  renderCart();
});

// New helper function to update UI with Firestore data
function updateUIWithUserData(user, userData) {
  // Update account info page
  if (document.getElementById('displayName')) {
    document.getElementById('displayName').textContent = userData.name || '';
  }
  if (document.getElementById('displayEmail')) {
    document.getElementById('displayEmail').textContent = user.email || '';
  }
  
  // Update profile modal if open
  if (nameInput) {
    nameInput.value = userData.name || '';
  }
  if (emailDisplay) {
    emailDisplay.value = user.email || '';
  }
  
  // Load addresses and orders
  loadAddresses(user.uid);
  loadOrders(user.uid);
}

// Update the Pay Now button event listener
if (document.querySelector('.checkout-btn')) {
    document.querySelector('.checkout-btn').addEventListener('click', placeOrder);
}
