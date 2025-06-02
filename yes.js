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
const loginButton = document.getElementById('login-button');

// Initialize cart as a global variable
let cart = [];

// Function to update cart count in navbar
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.setAttribute('data-count', totalItems);
    }
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

// Unified function to add to cart
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

// Unified function to remove from cart
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

// Unified function to update quantity
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
        return;
    }
    
    closeAllOpenElements();
    mobileMenuContent.classList.add('active');
    mobileMenuButton.querySelector('i').classList.remove('fa-bars');
    mobileMenuButton.querySelector('i').classList.add('fa-times');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!accountIconNav.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.add('hidden');
        dropdownOpen = false;
    }
});

// Close cart when pressing ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartOpen) {
        closeCart();
    }
});

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
}

function resetForms() {
    // Save the current email values before resetting
    const loginEmail = document.getElementById('login-email')?.value;
    const signupEmail = document.getElementById('signup-email')?.value;
    
    document.getElementById('login-form').reset();
    document.getElementById('signup-form').reset();
    
    // Restore the email values if they exist
    if (loginEmail && document.getElementById('login-email')) {
        document.getElementById('login-email').value = loginEmail;
    }
    if (signupEmail && document.getElementById('signup-email')) {
        document.getElementById('signup-email').value = signupEmail;
    }
    
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
                        provider: 'email',
                        emailVerified: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
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

// Google Sign In/Sign Up handler
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
                    photoURL: user.photoURL || null
                }, { merge: true });
            })
            .then(() => {
                googleBtn.innerHTML = originalContent;
                googleBtn.disabled = false;
                
                // Hide auth container and redirect
                setTimeout(() => {
                    hideAuthContainer();
                }, 1500);
            })
            .catch((error) => {
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
                
                // Restore the button state
                googleBtn.innerHTML = originalContent;
                googleBtn.disabled = false;
            });
    });
});

// Email/Password Login
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading('login-submit-button');
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // Store email in case we need to restore it
    const storedEmail = email;
    
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
            });
        })
        .then(() => {
            // Show success message
            const loginSuccess = document.getElementById('login-success');
            if (loginSuccess) {
                loginSuccess.textContent = 'Login successful! Redirecting...';
                loginSuccess.classList.remove('hidden');
            }
            
            hideLoading('login-submit-button');
            
            setTimeout(() => {
                hideAuthContainer();
            }, 1500);
        })
        .catch((error) => {
            console.error("Error handling login:", error);
            const loginError = document.getElementById('login-error');
            if (loginError) {
                loginError.textContent = error.message || 'Error processing login. Please try again.';
                loginError.classList.remove('hidden');
            }
            
            // Restore the email in the form
            if (document.getElementById('login-email')) {
                document.getElementById('login-email').value = storedEmail;
            }
            
            hideLoading('login-submit-button');
        });
});

// Logout function
function logoutUser(event) {
    if (event) event.preventDefault();
    
    auth.signOut().then(() => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        if (mobileMenuContent) mobileMenuContent.classList.remove('active');
        
        if (mobileMenuButton) {
            const icon = mobileMenuButton.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
        
        // Update the auth button
        updateAuthButton(null);
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Update auth button text based on user state
function updateAuthButton(user) {
    const authText = document.getElementById('auth-state-text');
    const loginButton = document.getElementById('login-button');
    
    if (authText && loginButton) {
        if (user) {
            authText.textContent = 'LOG OUT';
            loginButton.classList.add('logout-button');
            loginButton.classList.remove('login-button');
        } else {
            authText.textContent = 'LOG IN';
            loginButton.classList.add('login-button');
            loginButton.classList.remove('logout-button');
        }
    }
}

// Function to toggle auth state (login/logout)
function toggleAuthState() {
    const user = auth.currentUser;
    
    if (user) {
        // User is logged in, so log them out
        if (confirm('Are you sure you want to log out?')) {
            logoutUser();
        }
    } else {
        // User is logged out, show login form
        showAuthContainer();
        showLoginSection();
    }
}

// Function to merge carts (guest → logged-in)
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

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser;
    if (user) {
        // Load from Firestore
        getOrCreateUserCart(user.uid).then(firestoreCart => {
            cart = firestoreCart;
            updateCartCount();
            renderCart();
        });
    } else {
        // Load from localStorage
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        cart = guestCart;
        updateCartCount();
        renderCart();
    }
});

// Auth state change handler for cart sync
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Handle cart merging (guest → logged-in)
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        const firestoreCart = await getOrCreateUserCart(user.uid);
        const mergedCart = mergeCarts(firestoreCart, guestCart);
        cart = mergedCart;

        await saveCartToFirestore(user.uid, mergedCart);
        localStorage.removeItem('guestCart');
    } else {
        // Load guest cart
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        cart = guestCart;
    }

    // Common actions
    updateCartCount();
    renderCart();
    updateAuthButton(user);
});

// Event Listeners
document.getElementById('show-signup').addEventListener('click', function(event) {
    event.preventDefault();
    showSignupSection();
    resetForms();
});

document.getElementById('checkoutAuthButton').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const user = auth.currentUser;
    if (!user) {
        showAuthContainer();
        showLoginSection();
    } else {
        // If user is logged in, you might want to redirect or do something else
        // For now, we'll just show the login section anyway
        showAuthContainer();
        showLoginSection();
    }
});
document.getElementById('show-login').addEventListener('click', function(event) {
    event.preventDefault();
    showLoginSection();
    resetForms();
});

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

mobileMenuButton.addEventListener('click', toggleMobileMenu);
loginButton.addEventListener('click', toggleAuthState);

// Close modals when clicking outside
document.getElementById('auth-container').addEventListener('click', function(e) {
    if (e.target === this) {
        hideAuthContainer();
    }
});
