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

// Global variables
let cart = [];
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
const checkoutAuthButton = document.getElementById('checkoutAuthButton');

// Helper functions
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
            const inputId = this.getAttribute('data-toggle');
            const input = document.getElementById(inputId);
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            }
        });
    });
}

// Cart functions
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.setAttribute('data-count', totalItems);
    }
}

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

function mergeCarts(primaryCart, secondaryCart) {
    const merged = [...primaryCart];
    
    secondaryCart.forEach(item => {
        const existingItem = merged.find(i => 
            i.id === item.id && i.size === item.size
        );
        
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            merged.push(item);
        }
    });
    
    return merged;
}

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
    
    updateCartCount();
    renderCart();
}

async function removeFromCart(index, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    cart.splice(index, 1);

    const user = auth.currentUser;
    if (user) {
        await saveCartToFirestore(user.uid, cart);
    } else {
        localStorage.setItem('guestCart', JSON.stringify(cart));
    }
    
    updateCartCount();
    renderCart();
}

async function updateQuantity(index, change) {
    const newQuantity = cart[index].quantity + change;
    if (newQuantity < 1) return;
    
    cart[index].quantity = newQuantity;
    
    const user = auth.currentUser;
    if (user) {
        await saveCartToFirestore(user.uid, cart);
    } else {
        localStorage.setItem('guestCart', JSON.stringify(cart));
    }
    
    updateCartCount();
    renderCart();
}

function renderCart() {
    const cartList = document.getElementById('cartList');
    if (!cartList) return;

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

// UI Functions
function closeAllOpenElements() {
    if (cartOpen) {
        cartOverlay.classList.remove('active');
        cartBackdrop.classList.remove('active');
        cartOpen = false;
    }
    
    if (searchOpen) {
        searchInputContainer.style.display = 'none';
        searchOpen = false;
    }
    
    if (dropdownOpen) {
        dropdownMenu.classList.add('hidden');
        dropdownOpen = false;
    }
    
    if (mobileMenuContent.classList.contains('active')) {
        mobileMenuContent.classList.remove('active');
        mobileMenuButton.querySelector('i').classList.add('fa-bars');
        mobileMenuButton.querySelector('i').classList.remove('fa-times');
        document.getElementById('mobileAccountOptions').classList.add('hidden');
    }
}

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

function closeCart() {
    cartOpen = false;
    cartOverlay.classList.remove('active');
    cartBackdrop.classList.remove('active');
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

// Account functions
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

function showAccountInfo(event) {
    if (event) event.preventDefault();
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
        
        if (window.location.pathname.includes('account')) {
            window.location.reload();
        }
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}
// Address functions
function renderAddresses(addresses) {
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

    document.querySelectorAll('[data-action="set-default"]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const addressId = this.getAttribute('data-address-id');
            setDefaultAddress(addressId);
        });
    });
}

async function loadAddresses(userId) {
    console.log('Loading addresses for user:', userId);
    if (!addressContainer) {
        console.error('Address container not found');
        return;
    }

    try {
        const doc = await db.collection("users").doc(userId).get();
        console.log('Firestore document:', doc.exists ? doc.data() : 'Does not exist');
        
        if (doc.exists) {
            const userData = doc.data();
            const addresses = userData.addresses || [];
            console.log('Loaded addresses:', addresses);
            
            if (addresses.length === 0) {
                console.log('No addresses found');
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
            console.log('User document does not exist');
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
}

function showAddAddressModal(event) {
    if (event) event.preventDefault();
    document.getElementById('addressForm').reset();
    delete document.getElementById('addressForm').dataset.editingId;
    document.querySelector('#addAddressModal h3').textContent = 'Add New Address';
    addAddressModal.classList.remove('hidden');
}

async function saveAddress(event) {
    if (event) event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        showToast('Please sign in to save addresses', 'error');
        return;
    }

    try {
        console.log('Starting address save process...'); // Debug log

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

        console.log('Address data collected:', address); // Debug log

        // Validate mandatory fields
        const requiredFields = [
            'fullName', 'phoneNumber', 'addressLine1', 
            'city', 'state', 'postalCode', 'country'
        ];
        
        const errors = [];
        
        requiredFields.forEach(field => {
            if (!address[field]) {
                errors.push(field);
                const element = document.getElementById(field);
                if (element) {
                    element.classList.add('border-red-500');
                }
            }
        });

        // Additional validation
        if (address.phoneNumber && !/^\d{10}$/.test(address.phoneNumber)) {
            errors.push('Phone number must be 10 digits');
        }

        if (address.postalCode && !/^\d{6}$/.test(address.postalCode)) {
            errors.push('Postal code must be 6 digits');
        }

        if (errors.length > 0) {
            console.error('Validation errors:', errors); // Debug log
            showToast(`Please fix these issues: ${errors.join(', ')}`, 'error');
            return;
        }

        // Show loading state
        const saveBtn = document.getElementById('saveAddressBtn');
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        console.log('Getting user document...'); // Debug log
        const userRef = db.collection("users").doc(user.uid);
        const userDoc = await userRef.get();
        
        let currentAddresses = [];
        if (userDoc.exists) {
            currentAddresses = userDoc.data().addresses || [];
            console.log('Existing addresses:', currentAddresses); // Debug log
        }

        // If this is default, unset others
        if (address.isDefault) {
            currentAddresses = currentAddresses.map(addr => ({
                ...addr,
                isDefault: false
            }));
        }

        // Check if editing existing address
        const isEditing = document.getElementById('addressForm').dataset.editingId;
        let updatedAddresses = [];
        
        if (isEditing) {
            console.log('Editing existing address'); // Debug log
            updatedAddresses = currentAddresses.map(addr => 
                addr.id === isEditing ? address : addr
            );
        } else {
            console.log('Adding new address'); // Debug log
            // If first address, make it default
            if (currentAddresses.length === 0) {
                address.isDefault = true;
            }
            updatedAddresses = [...currentAddresses, address];
        }

        console.log('Updated addresses:', updatedAddresses); // Debug log

        // Prepare update data
        const updateData = {
            addresses: updatedAddresses,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (address.isDefault) {
            updateData.defaultAddress = address;
        }

        console.log('Attempting to save to Firestore...'); // Debug log
        await userRef.set(updateData, { merge: true });
        console.log('Firestore update successful'); // Debug log

        // Update UI
        await loadAddresses(user.uid);
        addAddressModal.classList.add('hidden');
        document.getElementById('addressForm').reset();
        delete document.getElementById('addressForm').dataset.editingId;
        
        showToast('Address saved successfully!');
    } catch (error) {
        console.error("Error saving address:", error);
        showToast(`Failed to save address: ${error.message}`, 'error');
    } finally {
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
    if (!user) {
        showToast('Please sign in to set default address', 'error');
        return;
    }

    try {
        const userRef = db.collection("users").doc(user.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            showToast('User data not found', 'error');
            return;
        }
        
        const addresses = userDoc.data().addresses || [];
        const addressToSetDefault = addresses.find(addr => addr.id === addressId);
        
        if (!addressToSetDefault) {
            showToast('Address not found', 'error');
            return;
        }

        // Update all addresses to set isDefault correctly
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
        
        document.getElementById('fullName').value = address.fullName;
        document.getElementById('phoneNumber').value = address.phoneNumber;
        document.getElementById('addressLine1').value = address.addressLine1;
        document.getElementById('addressLine2').value = address.addressLine2 || '';
        document.getElementById('city').value = address.city;
        document.getElementById('state').value = address.state;
        document.getElementById('postalCode').value = address.postalCode;
        document.getElementById('country').value = address.country;
        
        const addressTypeRadios = document.querySelectorAll('input[name="addressType"]');
        addressTypeRadios.forEach(radio => {
            radio.checked = (radio.value === address.addressType);
        });
        
        document.getElementById('setAsDefault').checked = address.isDefault || false;
        document.getElementById('addressForm').dataset.editingId = addressId;
        document.querySelector('#addAddressModal h3').textContent = 'Edit Address';
        addAddressModal.classList.remove('hidden');
    }).catch(error => {
        console.error("Error loading address for editing:", error);
        showToast('Failed to load address for editing', 'error');
    });
}
// Order functions
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

function renderOrders(orders) {
    if (!ordersContainer) return;

    ordersContainer.innerHTML = orders.map(order => {
        const orderDate = order.date.toDate ? order.date.toDate() : new Date(order.date);
        const totalAmount = order.items.reduce((total, item) => {
            const price = parseFloat(item.price?.replace('₹', '').replace(',', '') || '0');
            return total + (price * (item.quantity || 1));
        }, 0).toFixed(2);

        return `
        <div class="order-item border-b border-gray-200 py-6 px-4 rounded-lg mb-4 bg-white shadow-sm">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <span class="font-semibold">Order Number:</span>
                    <span class="block text-gray-600">${order.orderId || order.id}</span>
                </div>
                <div>
                    <span class="font-semibold">Date:</span>
                    <span class="block text-gray-600">${orderDate.toLocaleDateString('en-US', {
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
                        ₹${totalAmount}
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
        `;
    }).join('');
}

async function loadOrders(userId) {
    if (!ordersContainer) return;

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

// Authentication functions
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

function showLoginSection() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('bg-white');
    document.getElementById('signup-section').classList.remove('bg-gray-50');
}

function showSignupSection() {
    document.getElementById('signup-section').classList.remove('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.add('bg-gray-50');
    document.getElementById('login-section').classList.remove('bg-white');
}

// Profile functions
function showEditProfileModal() {
    const user = auth.currentUser;
    if (!user) return;
    
    nameInput.value = user.displayName || '';
    emailDisplay.value = user.email || '';
    editProfileModal.classList.remove('hidden');
}

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

    if (newName === user.displayName) {
        editProfileModal.classList.add('hidden');
        return;
    }

    try {
        document.getElementById('saveProfileBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        document.getElementById('saveProfileBtn').disabled = true;

        await user.updateProfile({
            displayName: newName
        });

        await db.collection("users").doc(user.uid).update({
            name: newName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('displayName').textContent = newName;
        editProfileModal.classList.add('hidden');
        showToast('Profile updated successfully!');
    } catch (error) {
        console.error("Error updating profile:", error);
        showToast(`Failed to update profile: ${error.message}`, 'error');
    } finally {
        document.getElementById('saveProfileBtn').innerHTML = '<i class="fas fa-save mr-2"></i> Save Changes';
        document.getElementById('saveProfileBtn').disabled = false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggles();
    
    // Initialize cart
    const user = auth.currentUser;
    if (user) {
        getOrCreateUserCart(user.uid).then(firestoreCart => {
            cart = firestoreCart;
            updateCartCount();
            renderCart();
        });
    } else {
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        cart = guestCart;
        updateCartCount();
        renderCart();
    }

    // Cart event listeners
    if (cartIconNav) cartIconNav.addEventListener('click', toggleCart);
    if (closeCartButton) closeCartButton.addEventListener('click', closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

    // Search functionality
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
            searchInputContainer.style.display = 'flex';
            searchInput.focus();
        });
    }

    if (searchInput) {
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
    }

    // Account dropdown
    if (accountIconNav) {
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
    }

    // Mobile menu
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }

    // Profile options
    if (profileOption) profileOption.addEventListener('click', showAccountInfo);
    if (logoutOption) logoutOption.addEventListener('click', logoutUser);
    if (editProfileIcon) editProfileIcon.addEventListener('click', showEditProfileModal);
    if (closeEditProfileModal) closeEditProfileModal.addEventListener('click', () => {
        editProfileModal.classList.add('hidden');
    });
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);

    // Address management
    if (addAddressLink) addAddressLink.addEventListener('click', showAddAddressModal);
    if (closeAddAddressModal) closeAddAddressModal.addEventListener('click', cancelAddress);
    if (saveAddressBtn) saveAddressBtn.addEventListener('click', saveAddress);
    if (document.getElementById('addressForm')) {
        document.getElementById('addressForm').addEventListener('submit', function(e) {
            e.preventDefault();
            saveAddress(e);
        });
    }

    // Set default address buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-action="set-default"]')) {
            e.preventDefault();
            const addressId = e.target.closest('[data-action="set-default"]').getAttribute('data-address-id');
            setDefaultAddress(addressId);
        }
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!accountIconNav?.contains(event.target) && !dropdownMenu?.contains(event.target)) {
            dropdownMenu?.classList.add('hidden');
            dropdownOpen = false;
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container') && !e.target.closest('.search-input-container')) {
            searchResults.style.display = 'none';
        }
    });

    // Close cart when pressing ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartOpen) {
            closeCart();
        }
    });
});

// Auth state change handler
auth.onAuthStateChanged(async (user) => {
    if (addAddressLink) {
        addAddressLink.style.display = user ? 'block' : 'none';
    }

    if (user) {
        loadAccountInfo(user.uid);

        // Handle cart merging
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        const firestoreCart = await getOrCreateUserCart(user.uid);
        const mergedCart = mergeCarts(firestoreCart, guestCart);
        cart = mergedCart;

        await saveCartToFirestore(user.uid, mergedCart);
        localStorage.removeItem('guestCart');

        try {
            const userDoc = await db.collection("users").doc(user.uid).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                updateUIWithUserData(user, userData);

                const emailInput = document.getElementById('email');
                if (emailInput) emailInput.value = user.email;
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
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        cart = guestCart;
    }

    updateCartCount();
    renderCart();
    updateCheckoutAuthButton(user);
});

function updateCheckoutAuthButton(user) {
    if (!checkoutAuthButton) return;

    if (user) {
        checkoutAuthButton.textContent = 'LOG OUT';
        checkoutAuthButton.classList.remove('text-blue-600', 'hover:text-blue-800');
        checkoutAuthButton.classList.add('text-red-600', 'hover:text-red-800');
    } else {
        checkoutAuthButton.textContent = 'LOG IN';
        checkoutAuthButton.classList.remove('text-red-600', 'hover:text-red-800');
        checkoutAuthButton.classList.add('text-blue-600', 'hover:text-blue-800');
    }
}

if (checkoutAuthButton) {
    checkoutAuthButton.addEventListener('click', function (e) {
        e.preventDefault();
        const user = auth.currentUser;

        if (user) {
            if (confirm('Are you sure you want to log out?')) {
                logoutUser();
            }
        } else {
            showAuthContainer();
            showLoginSection();
        }
    });

    checkoutAuthButton.addEventListener('mouseenter', () => checkoutAuthButton.classList.add('underline'));
    checkoutAuthButton.addEventListener('mouseleave', () => checkoutAuthButton.classList.remove('underline'));
    checkoutAuthButton.addEventListener('mousedown', () => checkoutAuthButton.classList.add('opacity-75'));
    checkoutAuthButton.addEventListener('mouseup', () => checkoutAuthButton.classList.remove('opacity-75'));
    checkoutAuthButton.addEventListener('mouseout', () => checkoutAuthButton.classList.remove('opacity-75'));
}
