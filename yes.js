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

// ==================== CART MANAGEMENT ====================
let cart = [];

// Initialize cart on page load
function initializeCart() {
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
}

// Get or create user's cart in Firestore
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

// Update cart count in navbar
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.setAttribute('data-count', totalItems);
    }
}

// Add item to cart
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
    
    // Also update order summary if on checkout page
    if (window.location.pathname.includes('checkout')) {
        renderOrderSummary();
    }
}

// Remove item from cart
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

// Update item quantity in cart
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

// Merge carts (used when guest logs in)
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

// Render cart items
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

// Render order summary in checkout
function renderOrderSummary() {
    const orderSummaryItems = document.getElementById('orderSummaryItems');
    if (!orderSummaryItems) return;
    
    orderSummaryItems.innerHTML = '';
    
    let subtotal = 0;
    
    if (cart.length === 0) {
        orderSummaryItems.innerHTML = '<p class="text-sm text-gray-500">Your cart is empty</p>';
        document.getElementById('orderSubtotal').textContent = '₹ 0.00';
        document.getElementById('orderGrandTotal').textContent = '₹ 0.00';
        return;
    }
    
    cart.forEach(item => {
        const priceValue = parseFloat(item.price.replace('₹', '').replace(',', ''));
        const itemTotal = priceValue * item.quantity;
        subtotal += itemTotal;
        
        const productItem = document.createElement('div');
        productItem.className = 'product-item flex items-start py-3 border-b border-gray-100';
        productItem.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="product-image w-16 h-16 object-cover rounded mr-3">
            <div class="product-details flex-1">
                <div class="product-title font-medium">${item.title}</div>
                <div class="product-variant text-sm text-gray-500">Size: ${item.size}</div>
                <div class="product-variant text-sm text-gray-500">Qty: ${item.quantity}</div>
            </div>
            <div class="product-price font-medium">₹${(priceValue * item.quantity).toFixed(2)}</div>
        `;
        orderSummaryItems.appendChild(productItem);
    });
    
    document.getElementById('orderSubtotal').textContent = `₹ ${subtotal.toFixed(2)}`;
    document.getElementById('orderGrandTotal').textContent = `₹ ${subtotal.toFixed(2)}`;
}

// Proceed to checkout
async function proceedToCheckout() {
    const user = auth.currentUser;
    
    if (!user) {
        showAuthContainer();
        return;
    }

    window.location.href = 'checkout.html';
}

// ==================== PRODUCT PAGE FUNCTIONS ====================
function setupProductPage() {
    if (!document.querySelector('.product-details')) return;

    // Size selection
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

    decrementButton?.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
        }
    });

    incrementButton?.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        quantityInput.value = value + 1;
    });

    // Size guide toggle
    const sizeGuideBtn = document.getElementById('size-guide-btn');
    const sizeGuideContainer = document.getElementById('size-guide-container');

    sizeGuideBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        sizeGuideContainer.classList.toggle('open');
        this.textContent = sizeGuideContainer.classList.contains('open') ? 'Hide guide' : 'Size guide';
    });

    // Input validation
    quantityInput?.addEventListener('change', function() {
        if (this.value < 1) this.value = 1;
    });
    
    // Share functionality
    const shareButton = document.querySelector('.share-icon');
    shareButton?.addEventListener('click', function() {
        if (navigator.share) {
            navigator.share({
                title: document.querySelector('h1').textContent,
                text: "Check out this product from VAMORA.STORE",
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
        const tempInput = document.createElement('input');
        tempInput.value = window.location.href;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('Link copied to clipboard!');
    }

    // Add to cart button
    document.getElementById('add-to-cart-btn')?.addEventListener('click', function() {
        const selectedSize = document.querySelector('.size-button.selected');
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }
        
        const product = {
            id: window.location.pathname,
            title: document.querySelector('h1').textContent,
            size: selectedSize.textContent,
            price: document.querySelector('.price').textContent,
            quantity: parseInt(quantityInput.value),
            image: document.querySelector('.product-image').src
        };
        
        addToCart(product);
        
        // Show success feedback
        const button = this;
        const originalText = button.textContent;
        button.textContent = 'ADDED TO CART!';
        
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
        
        openCart();
    });

    // Buy now button
    document.getElementById('buy-now-btn')?.addEventListener('click', function() {
        const selectedSize = document.querySelector('.size-button.selected');
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }
        
        const product = {
            id: window.location.pathname,
            title: document.querySelector('h1').textContent,
            size: selectedSize.textContent,
            price: document.querySelector('.price').textContent,
            quantity: parseInt(quantityInput.value),
            image: document.querySelector('.product-image').src
        };
        
        // Replace cart with just this item
        cart = [product];
        
        const user = auth.currentUser;
        if (user) {
            saveCartToFirestore(user.uid, cart);
        } else {
            localStorage.setItem('guestCart', JSON.stringify(cart));
        }
        
        proceedToCheckout();
    });
}

// ==================== CART UI FUNCTIONS ====================
let cartOpen = false;

// Open cart function
function openCart() {
    document.getElementById('cartOverlay').classList.add('active');
    document.getElementById('cartBackdrop').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCart();
}

// Close cart function
function closeCart() {
    cartOpen = false;
    document.getElementById('cartOverlay').classList.remove('active');
    document.getElementById('cartBackdrop').classList.remove('active');
    document.body.style.overflow = '';
}

// Toggle cart function
function toggleCart() {
    if (!cartOpen) {
        closeAllOpenElements();
    }
    
    cartOpen = !cartOpen;
    document.getElementById('cartOverlay').classList.toggle('active', cartOpen);
    document.getElementById('cartBackdrop').classList.toggle('active', cartOpen);
    
    if (cartOpen) {
        renderCart();
    }
}

// Close all open elements (cart, search, etc.)
function closeAllOpenElements() {
    // Close cart
    if (cartOpen) {
        closeCart();
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
    if (mobileMenuContent?.classList.contains('active')) {
        mobileMenuContent.classList.remove('active');
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        if (mobileMenuButton) {
            const icon = mobileMenuButton.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
        document.getElementById('mobileAccountOptions')?.classList.add('hidden');
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart
    initializeCart();
    
    // Set up product page if needed
    setupProductPage();
    
    // Set up cart event listeners
    document.getElementById('cartIconNav')?.addEventListener('click', toggleCart);
    document.getElementById('closeCartButton')?.addEventListener('click', closeCart);
    document.getElementById('cartBackdrop')?.addEventListener('click', closeCart);
    
    // Close cart when pressing ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartOpen) {
            closeCart();
        }
    });
});

auth.onAuthStateChanged(async (user) => {
    const addAddressLink = document.getElementById('addAddressLink');
    const emailInput = document.getElementById('email');
    const onAccountPage = window.location.pathname.includes('account');

    if (user) {
        // ==================== LOGGED-IN USER LOGIC ====================

        // Show "Add Address" link
        if (onAccountPage && addAddressLink) {
            addAddressLink.style.display = 'block';
        }

        // Update email input
        if (emailInput) {
            emailInput.value = user.email;
            emailInput.readOnly = true;
            emailInput.classList.add('bg-gray-100');
        }

        // Update display name and email on account page
        if (onAccountPage) {
            const displayNameEl = document.getElementById('displayName');
            const displayEmailEl = document.getElementById('displayEmail');
            if (displayNameEl) displayNameEl.textContent = user.displayName || '';
            if (displayEmailEl) displayEmailEl.textContent = user.email || '';
            loadAccountInfo(user.uid);
        }

        // Merge guest cart with Firestore cart
        try {
            const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            const firestoreCart = await getOrCreateUserCart(user.uid);
            const mergedCart = mergeCarts(firestoreCart, guestCart);
            cart = mergedCart;

            await saveCartToFirestore(user.uid, mergedCart);
            localStorage.removeItem('guestCart');

            updateCartCount();
            renderCart();
        } catch (error) {
            console.error("Error syncing carts:", error);
        }

        // Load or create Firestore user profile
        try {
            const userDoc = await db.collection("users").doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                updateUIWithUserData(user, userData);
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
        // ==================== GUEST USER LOGIC ====================

        // Hide "Add Address" link
        if (onAccountPage && addAddressLink) {
            addAddressLink.style.display = 'none';
        }

        // Reset email field
        if (emailInput) {
            emailInput.value = '';
            emailInput.readOnly = false;
            emailInput.classList.remove('bg-gray-100');
        }

        // Clear display info
        if (onAccountPage) {
            const displayNameEl = document.getElementById('displayName');
            const displayEmailEl = document.getElementById('displayEmail');
            if (displayNameEl) displayNameEl.textContent = '';
            if (displayEmailEl) displayEmailEl.textContent = '';
            applyDefaultAddress(); // Apply default guest address if needed
        }

        // Load guest cart
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        cart = guestCart;

        updateCartCount();
        renderCart();
    }

    // Always update email field, if function exists
    if (typeof updateEmailField === 'function') {
        updateEmailField(user);
    }
});


// ==================== EXPOSE FUNCTIONS TO WINDOW ====================
// Make cart functions available globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.proceedToCheckout = proceedToCheckout;
window.openCart = openCart;
window.closeCart = closeCart;
window.toggleCart = toggleCart;

// Function to toggle auth state (login/logout)
function toggleAuthState() {
    const user = auth.currentUser;
    const authText = document.getElementById('auth-state-text');
    
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
