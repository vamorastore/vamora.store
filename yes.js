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

// Initialize ordersContainer at the top with other DOM elements
const ordersContainer = document.getElementById('ordersContainer');

// Global cart variable
let cart = [];

// ======================
// CART MANAGEMENT SYSTEM
// ======================

// Initialize cart on page load
function initializeCart() {
    const user = auth.currentUser;
    if (user) {
        getOrCreateUserCart(user.uid).then(firestoreCart => {
            cart = firestoreCart;
            updateCartCount();
            renderCart();
            renderOrderSummary(); // Add this line to ensure order summary is rendered
        });
    } else {
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        cart = guestCart;
        updateCartCount();
        renderCart();
        renderOrderSummary(); // Add this line to ensure order summary is rendered
    }
}

// Call initializeCart whenever auth state changes
auth.onAuthStateChanged(() => {
    initializeCart();
});

// Function to get or create user's cart in Firestore
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

// Function to save cart to Firestore
async function saveCartToFirestore(userId, cartItems) {
    try {
        await db.collection("carts").doc(userId).set({
            items: cartItems,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving cart:", error);
        // Fallback to localStorage if Firestore fails
        if (!userId) {
            localStorage.setItem('guestCart', JSON.stringify(cartItems));
        }
    }
}

// Function to merge carts (guest + user)
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

// Universal Add to Cart function
window.addToCart = async function(product) {
    const user = auth.currentUser;
    
    // Check if item exists with same ID and size
    const existingItem = cart.find(item => 
        item.id === product.id && i.size === product.size
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
    renderOrderSummary(); // Add this line to update order summary when adding to cart
};

// Function to update cart count in navbar
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.setAttribute('data-count', totalItems);
    }
}

// Function to render cart items
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

// Function to render order summary in checkout
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

// Global functions for cart operations
window.updateQuantity = async function(index, change) {
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
    renderOrderSummary(); // Add this line to update order summary when quantity changes
};

window.removeFromCart = async function(index, event) {
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
    renderOrderSummary(); // Add this line to update order summary when item is removed
};

// Function to proceed to checkout
async function proceedToCheckout() {
    const user = auth.currentUser;
    
    if (!user) {
        showAuthContainer();
        return;
    }

    window.location.href = 'checkout.html';
}

// Cart UI functions
window.openCart = function() {
    document.getElementById('cartOverlay').classList.add('active');
    document.getElementById('cartBackdrop').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCart();
};

window.closeCart = function() {
    document.getElementById('cartOverlay').classList.remove('active');
    document.getElementById('cartBackdrop').classList.remove('active');
    document.body.style.overflow = '';
};

// Initialize cart event listeners
function setupCartEventListeners() {
    // Event listeners
    document.getElementById('cartIconNav')?.addEventListener('click', function(e) {
        e.preventDefault();
        openCart();
    });

    document.getElementById('closeCartButton')?.addEventListener('click', function(e) {
        e.preventDefault();
        closeCart();
    });

    document.getElementById('cartBackdrop')?.addEventListener('click', function(e) {
        e.preventDefault();
        closeCart();
    });

    // Close cart when pressing ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('cartOverlay').classList.contains('active')) {
            closeCart();
        }
    });
}

// ======================
// PRODUCT PAGE FUNCTIONS
// ======================

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
            price: document.querySelector('.details-section .text-2xl.font-bold').textContent,
            quantity: parseInt(quantityInput.value),
            image: document.querySelector('.main-image').src
        };
        
        addToCart(product);
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
            price: document.querySelector('.details-section .text-2xl.font-bold').textContent,
            quantity: parseInt(quantityInput.value),
            image: document.querySelector('.main-image').src
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

// ======================
// ORDER MANAGEMENT
// ======================

// Updated loadOrders function
async function loadOrders(userId) {
    // First check if orders container exists
    if (!ordersContainer) {
        console.warn("Orders container element not found");
        return;
    }
    
    const user = auth.currentUser;
    if (!user) {
        ordersContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-shopping-bag text-4xl mb-3"></i>
                <p class="text-lg">Please sign in to view your orders</p>
                <button onclick="showAuthContainer(); showLoginSection()" 
                        class="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                    Sign In
                </button>
            </div>
        `;
        return;
    }

    try {
        // Show loading state
        ordersContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-2xl mb-3"></i>
                <p>Loading your orders...</p>
            </div>
        `;

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
                    <a href="/shop" class="mt-4 inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                        Continue Shopping
                    </a>
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
                <button onclick="loadOrders('${userId}')" 
                        class="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                    Retry
                </button>
            </div>
        `;
    }
}

function renderOrders(orders) {
    if (!ordersContainer) return;

    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-item border border-gray-200 rounded-lg mb-6 bg-white shadow-sm overflow-hidden">
            <!-- Order Header -->
            <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div class="flex flex-wrap justify-between items-center gap-2">
                    <div class="flex-1 min-w-[150px]">
                        <span class="text-sm font-medium text-gray-500">Order #</span>
                        <p class="font-semibold text-gray-800">${order.orderId || order.id}</p>
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <span class="text-sm font-medium text-gray-500">Date</span>
                        <p class="text-gray-600">
                            ${new Date(order.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <span class="text-sm font-medium text-gray-500">Total</span>
                        <p class="font-semibold text-gray-800">
                            ₹${order.items.reduce((total, item) => {
                                const price = parseFloat((item.price || '₹0').replace('₹', '').replace(',', '')) || 0;
                                const qty = item.quantity || 1;
                                return total + (price * qty);
                            }, 0).toFixed(2)}
                        </p>
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <span class="text-sm font-medium text-gray-500">Status</span>
                        <p class="capitalize ${getStatusColor(order.status)} font-medium">
                            ${(order.status || 'pending').replace('status-', '').replace('-', ' ')}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Order Progress - Fully responsive with vertical on mobile -->
            <div class="px-4 py-3 border-b border-gray-200">
                <div class="relative">
                    <!-- Labels - vertical on mobile, horizontal on md+ -->
                    <div class="flex flex-col md:flex-row justify-between gap-2 md:gap-0 mb-3 text-[11px] text-gray-600 md:text-xs text-center">
                        <span class="${order.status === 'status-order-placed' ? 'text-blue-600 font-medium' : ''}">Order Placed</span>
                        <span class="${order.status === 'status-processing' ? 'text-blue-600 font-medium' : ''}">Processing</span>
                        <span class="${order.status === 'status-shipped' ? 'text-blue-600 font-medium' : ''}">Shipped</span>
                        <span class="${order.status === 'status-delivered' ? 'text-blue-600 font-medium' : ''}">Delivered</span>
                    </div>

                    <!-- Progress Bar - vertical on mobile, horizontal on md+ -->
                    <div class="relative mb-4">
                        <!-- Horizontal Progress (md+) -->
                        <div class="hidden md:block h-1.5 bg-gray-200 rounded-full">
                            <div class="h-1.5 rounded-full ${getStatusProgress(order.status)}"></div>
                        </div>
                        <!-- Vertical Progress (mobile) -->
                        <div class="block md:hidden w-1.5 h-24 bg-gray-200 rounded-full mx-auto">
                            <div class="w-1.5 rounded-full ${getStatusProgress(order.status)} h-full"></div>
                        </div>
                    </div>

                    <!-- Icons - vertical on mobile, horizontal on md+ -->
                    <div class="relative flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 px-1 md:px-0">
                        <div class="w-6 h-6 md:w-8 md:h-8 ${['status-order-placed', 'status-processing', 'status-shipped', 'status-delivered'].includes(order.status) ? 'bg-blue-500' : 'bg-gray-200'} 
                            rounded-full flex items-center justify-center text-white">
                            <i class="fas fa-check text-xs"></i>
                        </div>
                        <div class="w-6 h-6 md:w-8 md:h-8 ${['status-processing', 'status-shipped', 'status-delivered'].includes(order.status) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'} 
                            rounded-full flex items-center justify-center">
                            <i class="fas fa-truck text-xs"></i>
                        </div>
                        <div class="w-6 h-6 md:w-8 md:h-8 ${['status-shipped', 'status-delivered'].includes(order.status) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'} 
                            rounded-full flex items-center justify-center">
                            <i class="fas fa-shipping-fast text-xs"></i>
                        </div>
                        <div class="w-6 h-6 md:w-8 md:h-8 ${order.status === 'status-delivered' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'} 
                            rounded-full flex items-center justify-center">
                            <i class="fas fa-box-open text-xs"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Order Items -->
            <div class="px-4 py-3">
                <h4 class="font-medium mb-3 text-gray-800">Items (${order.items.length})</h4>
                <div class="space-y-3">
                    ${order.items.map(item => `
                        <div class="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <img src="${item.image || 'https://via.placeholder.com/50'}" 
                                 alt="${item.title || 'Item'}" 
                                 class="w-16 h-16 md:w-20 md:h-20 rounded-md mr-3 object-cover flex-shrink-0">
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-gray-900 truncate">${item.title}</p>
                                <div class="mt-1 grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div>
                                        <span class="text-gray-500">Size:</span>
                                        <span>${item.size || '-'}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Qty:</span>
                                        <span>${item.quantity || 1}</span>
                                    </div>
                                    <div class="col-span-2 md:col-span-1">
                                        <span class="text-gray-500">Price:</span>
                                        <span>${item.price || '₹0.00'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Track Order Button -->
            <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button class="w-full md:w-auto px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm font-medium">
                    Track Order
                </button>
            </div>
        </div>
    `).join('');
}



// Helper function for mobile vertical progress
function getStatusProgressMobile(status) {
    switch(status) {
        case 'status-order-placed':
            return 'h-[32px]'; // ~25%
        case 'status-processing':
            return 'h-[65px]'; // ~50%
        case 'status-shipped':
            return 'h-[100px]'; // ~75%
        case 'status-delivered':
            return 'h-[130px]'; // 100%
        default:
            return 'h-[32px]';
    }
}

// Keep the existing getStatusProgress for desktop
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

// Keep the existing getStatusColor function
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


// ======================
// CHECKOUT FUNCTIONS
// ======================

// Update the validateCheckoutForm function
function validateCheckoutForm() {
    let isValid = true;

    function validateField(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(errorId);

        let value = '';
        if (field.tagName === 'SELECT') {
            value = field.options[field.selectedIndex].value;
        } else {
            value = field.value.trim();
        }

        if (!value) {
            field.classList.add('error-highlight');
            errorElement.style.display = 'block';
            errorElement.textContent = 'This field is required';
            isValid = false;
        } else {
            field.classList.remove('error-highlight');
            errorElement.style.display = 'none';
        }
    }

    // Validate all mandatory fields
    validateField('first-name', 'first-name-error');
    validateField('last-name', 'last-name-error');
    validateField('address', 'address-error');
    validateField('pin-code', 'pin-code-error');
    validateField('phone', 'phone-error');
    validateField('city', 'city-error');
    validateField('state', 'state-error');
    validateField('email', 'email-error');

    // Additional phone number validation
    const phone = document.getElementById('phone').value.trim();
    if (phone && !/^\d{10}$/.test(phone)) {
        document.getElementById('phone-error').textContent = 'Please enter a valid 10-digit phone number';
        document.getElementById('phone-error').style.display = 'block';
        document.getElementById('phone').classList.add('error-highlight');
        isValid = false;
    }

    // Additional PIN code validation
    const pinCode = document.getElementById('pin-code').value.trim();
    if (pinCode && !/^\d{6}$/.test(pinCode)) {
        document.getElementById('pin-code-error').textContent = 'Please enter a valid 6-digit PIN code';
        document.getElementById('pin-code-error').style.display = 'block';
        document.getElementById('pin-code').classList.add('error-highlight');
        isValid = false;
    }

    // Email validation
    const email = document.getElementById('email').value.trim();
    if (email && !validateEmail(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email address';
        document.getElementById('email-error').style.display = 'block';
        document.getElementById('email').classList.add('error-highlight');
        isValid = false;
    }

    return isValid;
}

// Function to generate a unique order ID with VA prefix and 5-digit number
function generateOrderId() {
    const prefix = "VA";
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNum}`;
}

// Helper function to calculate total amount in paise
function calculateTotalAmount() {
    let total = 0;
    cart.forEach(item => {
        const price = parseFloat(item.price.replace(/[^\d.]/g, '')) * 100; // Convert to paise
        total += price * item.quantity;
    });
    return total; // Returns amount in paise
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
        email: user?.email || (document.getElementById('email')?.value ?? ''),
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

    document.getElementById('thankYouPopup').classList.add('active');
    
    document.getElementById('thankYouPopup').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

// Handle successful payment
function handlePaymentSuccess(response, formData) {
    const orderId = generateOrderId();
    
    // Show thank you popup with order details
    showThankYouPopup(formData, orderId);
    
    // Save order to Firestore
    saveOrder(response.razorpay_payment_id, formData)
        .then(() => {
            // Clear cart
            cart = [];
            if (auth.currentUser) {
                saveCartToFirestore(auth.currentUser.uid, []);
            } else {
                localStorage.removeItem('guestCart');
            }
            updateCartCount();
            renderCart();
            renderOrderSummary();
        })
        .catch(error => {
            console.error("Error saving order:", error);
            // Even if order save fails, show success since payment was successful
        });
}

// Get form data from checkout form
// Update the getFormData function to include email
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
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value
    };
}
async function saveInformation() {
    const saveInfoCheckbox = document.getElementById('save-info');
    if (!saveInfoCheckbox.checked) return;

    // First validate all fields
    if (!validateCheckoutForm()) {
        saveInfoCheckbox.checked = false;
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert('Please sign in to save addresses');
        saveInfoCheckbox.checked = false;
        return;
    }

    try {
        // Show loading state
        saveInfoCheckbox.disabled = true;
        saveInfoCheckbox.nextElementSibling.textContent = 'Saving...';

        // Prepare address data from checkout form
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
            isDefault: true, // Make this the default address
            id: `addr_${Date.now()}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const userRef = db.collection("users").doc(user.uid);
        
        // Get current addresses first
        const userDoc = await userRef.get();
        let currentAddresses = userDoc.exists ? (userDoc.data().addresses || []) : [];
        
        // If there are existing addresses, unset any existing default
        currentAddresses = currentAddresses.map(addr => ({
            ...addr,
            isDefault: false
        }));
        
        // Add the new address
        currentAddresses.push(address);
        
        // Update Firestore
        await userRef.set({
            addresses: currentAddresses,
            defaultAddress: address,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Show success notification
        showToast('Address saved successfully!');
        
    } catch (error) {
        console.error("Error saving address:", error);
        showToast("Failed to save address. Please try again.", 'error');
        saveInfoCheckbox.checked = false;
    } finally {
        saveInfoCheckbox.disabled = false;
        saveInfoCheckbox.nextElementSibling.textContent = 'Save this information for next time';
    }
}

// Place order function with Razorpay integration
// Update the placeOrder function to check these fields
async function placeOrder() {
    // First validate the checkout form
    if (!validateCheckoutForm()) {
        // Scroll to the first error field
        const firstErrorField = document.querySelector('.error-highlight');
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Check if cart is empty
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    // Get form data
    const formData = getFormData();
    const email = document.getElementById('email').value.trim();

    // Save information if checkbox is checked
    const saveInfoCheckbox = document.getElementById('save-info');
    if (saveInfoCheckbox?.checked) {
        try {
            await saveInformation();
        } catch (error) {
            console.error("Error saving address:", error);
            // Continue with order even if address save fails
        }
    }

    // Calculate total amount from cart (in paise for Razorpay)
    const totalAmount = calculateTotalAmount();

    // Create Razorpay options
    const options = {
        key: "rzp_live_DPartLBDccSG34", // Your live Razorpay key
        amount: totalAmount, // Amount in paise
        currency: "INR",
        name: "VAMORA.STORE",
        description: "Order Payment",
        image: "/logo.png", // Your logo
        order_id: "", // This will be generated by Razorpay
        handler: async function(response) {
            // This function runs after successful payment
            try {
                const orderId = await saveOrder(response.razorpay_payment_id, {...formData, email});
                handlePaymentSuccess(response, {...formData, email});
                
                // Clear cart after successful payment
                cart = [];
                updateCartCount();
                renderCart();
                renderOrderSummary();
                
                if (auth.currentUser) {
                    await saveCartToFirestore(auth.currentUser.uid, []);
                } else {
                    localStorage.removeItem('guestCart');
                }
            } catch (error) {
                console.error("Error processing order:", error);
                showToast("There was an error saving your order. Please contact support.", 'error');
            }
        },
        prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: email,
            contact: formData.phone
        },
        notes: {
            address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pinCode}`
        },
        theme: {
            color: "#000000" // Black theme to match your site
        }
    };

    try {
        // Create Razorpay instance and open payment modal
        const rzp = new Razorpay(options);
        rzp.open();

        // Handle payment failure
        rzp.on('payment.failed', function(response) {
            handlePaymentFailure(response);
        });
    } catch (error) {
        console.error("Error initializing Razorpay:", error);
        showToast("Error initializing payment gateway. Please try again.", 'error');
    }
}
// ======================
// ADDRESS MANAGEMENT
// ======================

async function loadAddresses(userId) {
    console.log("Loading addresses for user:", userId);
    try {
        const doc = await db.collection("users").doc(userId).get();
        console.log("Firestore document data:", doc.data());
        
        if (doc.exists) {
            const userData = doc.data();
            const addresses = userData.addresses || [];
            console.log("Addresses fetched:", addresses);
            renderAddresses(addresses);
        } else {
            console.log("No user document found");
            renderAddresses([]);
        }
    } catch (error) {
        console.error("Error loading addresses:", error);
        // Show error message in UI
        const addressContainer = document.getElementById('addressContainer');
        if (addressContainer) {
            addressContainer.innerHTML = `
                <div class="text-center text-red-500">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading addresses. Please refresh.</p>
                </div>
            `;
        }
    }
}

function renderAddresses(addresses) {
    const addressContainer = document.getElementById('addressContainer');
    if (!addressContainer) return;
    
    if (!addresses || addresses.length === 0) {
        addressContainer.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                <p class="text-lg">No addresses saved yet</p>
                <p class="text-sm mt-2">Add your first address below</p>
            </div>
        `;
        return;
    }

    addressContainer.innerHTML = addresses.map(address => `
        <div class="address-card ${address.isDefault ? 'border-2 border-blue-500' : 'border border-gray-200'} bg-white p-4 rounded-lg shadow-sm mb-3">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-medium">${address.fullName}</h4>
                    <p class="text-sm">${address.addressLine1}</p>
                    ${address.addressLine2 ? `<p class="text-sm">${address.addressLine2}</p>` : ''}
                    <p class="text-sm">${address.city}, ${address.state} ${address.postalCode}</p>
                    <p class="text-sm">${address.country}</p>
                    <p class="text-sm mt-2">Phone: ${address.phoneNumber}</p>
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
            <div class="mt-3 flex justify-between items-center">
                <span class="text-xs px-2 py-1 rounded ${address.addressType === 'home' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                    ${address.addressType === 'home' ? 'Home' : 'Work'}
                </span>
                ${address.isDefault ? 
                    '<span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Default</span>' : 
                    `<button data-action="set-default" data-address-id="${address.id}" class="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                        Set as default
                    </button>`
                }
            </div>
        </div>
    `).join('');

    console.log("Address container updated:", addressContainer.innerHTML);
}

function showAddAddressModal(event) {
    if (event) event.preventDefault();
    document.getElementById('addressForm').reset();
    delete document.getElementById('addressForm').dataset.editingId;
    document.querySelector('#addAddressModal h3').textContent = 'Add New Address';
    document.getElementById('addAddressModal').classList.remove('hidden');
}

async function saveAddress(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        showToast('Please sign in to save addresses', 'error');
        return;
    }

    // Get form elements
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const addressLine1 = document.getElementById('addressLine1').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const country = document.getElementById('country').value;
    const addressType = document.querySelector('input[name="addressType"]:checked')?.value || 'home';
    const isDefault = document.getElementById('setAsDefault').checked;

    // Validation checks
    const errors = [];
    
    if (!fullName) errors.push('Full name is required');
    if (!phoneNumber) errors.push('Phone number is required');
    if (!addressLine1) errors.push('Address line 1 is required');
    if (!city) errors.push('City is required');
    if (!state) errors.push('State is required');
    if (!postalCode) errors.push('Postal code is required');
    if (!country) errors.push('Country is required');
    
    // Additional format validation
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
        errors.push('Phone number must be 10 digits');
    }
    
    if (postalCode && !/^\d{6}$/.test(postalCode)) {
        errors.push('Postal code must be 6 digits');
    }

    // Show errors if any
    if (errors.length > 0) {
        showToast(errors.join(', '), 'error');
        return; // Don't proceed with saving
    }

    // Prepare address object
    const address = {
        fullName,
        phoneNumber,
        addressLine1,
        addressLine2: document.getElementById('addressLine2').value.trim() || '',
        city,
        state,
        postalCode,
        country,
        addressType,
        isDefault,
        id: document.getElementById('addressForm').dataset.editingId || `addr_${Date.now()}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

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
        document.getElementById('addAddressModal').classList.add('hidden');
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
    document.getElementById('addAddressModal').classList.add('hidden');
}

async function deleteAddress(addressId) {
    const user = auth.currentUser;
    if (!user) return;

    if (!confirm('Are you sure you want to delete this address?')) return;

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
        
        document.getElementById('addAddressModal').classList.remove('hidden');
    }).catch(error => {
        console.error("Error loading address for editing:", error);
        showToast('Failed to load address for editing', 'error');
    });
}

async function applyDefaultAddress() {
    const user = auth.currentUser;
    const emailInput = document.getElementById('email');
    
    if (user && emailInput) {
        emailInput.value = user.email;
        emailInput.readOnly = true;
        emailInput.classList.add('bg-gray-100');
    }
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

// ======================
// AUTHENTICATION SYSTEM
// ======================

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

// Replace your current setupPasswordToggles function with this:
function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
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

// Also make sure this is called in your DOMContentLoaded event listener
// Add this helper function if not already present
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

// Email/Password Login
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

// Google Sign In/Sign Up
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
                
                setTimeout(() => {
                    hideAuthContainer();
                    
                    if (window.location.pathname.includes('account')) {
                        loadAccountInfo(user.uid);
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

// Forgot Password
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

// Resend verification email
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
}

// Update the auth button function to handle both main and checkout login buttons
function updateAuthButton(user) {
    const authButton = document.getElementById('login-button');
    const authText = document.getElementById('auth-state-text');
    const checkoutAuthButton = document.getElementById('checkoutAuthButton');
    
    // Update main auth button
    if (authButton && authText) {
        if (user) {
            authText.textContent = 'LOG OUT';
            authButton.classList.add('logout-button');
            authButton.classList.remove('login-button');
            authButton.onclick = logoutUser;
        } else {
            authText.textContent = 'LOG IN';
            authButton.classList.add('login-button');
            authButton.classList.remove('logout-button');
            authButton.onclick = showAuthContainer;
        }
    }
    
    // Update checkout auth button if it exists
    if (checkoutAuthButton) {
        if (user) {
            checkoutAuthButton.textContent = 'LOG OUT';
            checkoutAuthButton.classList.remove('text-blue-600', 'hover:text-blue-800');
            checkoutAuthButton.classList.add('text-red-600', 'hover:text-red-800');
            checkoutAuthButton.onclick = function(e) {
                e.preventDefault();
                if (confirm('Are you sure you want to log out?')) {
                    logoutUser();
                }
            };
        } else {
            checkoutAuthButton.textContent = 'LOG IN';
            checkoutAuthButton.classList.remove('text-red-600', 'hover:text-red-800');
            checkoutAuthButton.classList.add('text-blue-600', 'hover:text-blue-800');
            checkoutAuthButton.onclick = function(e) {
                e.preventDefault();
                showAuthContainer();
                showLoginSection();
            };
        }
    }
}

// Logout function
async function logoutUser(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    try {
        // Show loading state
        const logoutBtn = event?.target.closest('button') || event?.target.closest('a');
        if (logoutBtn) {
            const originalContent = logoutBtn.innerHTML;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            logoutBtn.disabled = true;
        }

        await auth.signOut();
        
        // Clear cart and local storage
        cart = [];
        localStorage.removeItem('guestCart');
        updateCartCount();

        // Close all modals and dropdowns
        document.getElementById('account-info-page')?.classList.add('hidden');
        document.getElementById('dropdownMenu')?.classList.add('hidden');
        document.getElementById('mobileAccountOptions')?.classList.add('hidden');
        document.getElementById('mobileMenuContent')?.classList.remove('active');

        // Reset mobile menu button icon
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        if (mobileMenuButton) {
            const mobileMenuIcon = mobileMenuButton.querySelector('i');
            if (mobileMenuIcon) {
                mobileMenuIcon.classList.add('fa-bars');
                mobileMenuIcon.classList.remove('fa-times');
            }
        }

        // Clear email fields in forms
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.value = '';
            input.readOnly = false;
            input.classList.remove('bg-gray-100');
        });

        // Update UI elements
        updateAuthButton(null);
        showToast('Logged out successfully!', 'success');

        // If on account page, reload to reset state
        if (window.location.pathname.includes('account')) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error during logout. Please try again.', 'error');
    } finally {
        // Reset any logout buttons
        document.querySelectorAll('[data-action="logout"]').forEach(btn => {
            btn.innerHTML = btn.getAttribute('data-original') || 'Log Out';
            btn.disabled = false;
        });
    }
}
// ======================
// PROFILE MANAGEMENT
// ======================

// Show account info function
function showAccountInfo(event) {
    if (event) event.preventDefault();
    
    const user = auth.currentUser;
    if (user) {
        document.getElementById('account-info-page').classList.remove('hidden');
    } else {
        showAuthContainer();
    }
}

// Update profile function
async function saveProfile() {
    const user = auth.currentUser;
    if (!user) {
        showToast('Please sign in to update your profile', 'error');
        return;
    }

    const newName = document.getElementById('nameInput').value.trim();
    if (!newName) {
        showToast('Please enter a valid name', 'error');
        return;
    }

    try {
        // Show loading state
        const saveBtn = document.getElementById('saveProfileBtn');
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
        saveBtn.disabled = true;

        // Update Firebase Auth profile
        await user.updateProfile({
            displayName: newName
        });

        // Update Firestore
        await db.collection("users").doc(user.uid).update({
            name: newName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update UI
        document.getElementById('displayName').textContent = newName;
        document.getElementById('editProfileModal').classList.add('hidden');
        
        showToast('Profile updated successfully!');
    } catch (error) {
        console.error("Error updating profile:", error);
        showToast(`Failed to update profile: ${error.message}`, 'error');
    } finally {
        const saveBtn = document.getElementById('saveProfileBtn');
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Save Changes';
        saveBtn.disabled = false;
    }
}

// Show edit profile modal
function showEditProfileModal() {
    const user = auth.currentUser;
    if (!user) return;
    
    document.getElementById('nameInput').value = user.displayName || '';
    document.getElementById('emailDisplay').value = user.email || '';
    document.getElementById('editProfileModal').classList.remove('hidden');
}

// Load account info
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
    const addressContainer = document.getElementById('addressContainer');
    if (addressContainer) {
        addressContainer.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                <p class="text-lg">No addresses saved yet</p>
                <p class="text-sm mt-2">Please login to view your saved addresses</p>
            </div>
        `;
    }
    
    if (ordersContainer) {
        ordersContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-shopping-bag text-4xl mb-3"></i>
                <p class="text-lg">You haven't placed any orders yet</p>
                <p class="text-sm mt-2">Please login to view your orders</p>
            </div>
        `;
    }
    
    if (document.getElementById('displayName')) {
        document.getElementById('displayName').textContent = '';
    }
    if (document.getElementById('displayEmail')) {
        document.getElementById('displayEmail').textContent = '';
    }
}

// Update UI with user data
function updateUIWithUserData(user, userData) {
    // Cache DOM elements
    const displayNameEl = document.getElementById('displayName');
    const displayEmailEl = document.getElementById('displayEmail');
    const emailInput = document.getElementById('email');
    
    // Update display name
    if (displayNameEl) {
        displayNameEl.textContent = userData?.name || user?.displayName || '';
    }

    // Update display email
    if (displayEmailEl) {
        displayEmailEl.textContent = user?.email || '';
    }

    // Update form inputs
    const nameInput = document.getElementById('nameInput');
    const emailDisplay = document.getElementById('emailDisplay');
    
    if (nameInput) {
        nameInput.value = userData?.name || user?.displayName || '';
    }
    if (emailDisplay) {
        emailDisplay.value = user?.email || '';
        if (emailDisplay.readOnly !== undefined) {
            emailDisplay.readOnly = true; // Keep email read-only in forms
        }
    }

    // Update main email input with read-only and styling
    if (emailInput) {
        emailInput.value = user?.email || '';
        emailInput.readOnly = !!user;  // read-only if user exists
        if (user) {
            emailInput.classList.add('bg-gray-100'); // styling to indicate read-only
        } else {
            emailInput.classList.remove('bg-gray-100');
        }
    }

    // Load addresses and orders if user is authenticated
    if (user && user.uid) {
        try {
            loadAddresses(user.uid);
            loadOrders(user.uid);
        } catch (error) {
            console.error("Error loading user data:", error);
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

// ======================
// SEARCH FUNCTIONALITY
// ======================

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

function setupSearch() {
    const enableSearch = document.getElementById('enableSearch');
    const searchInputContainer = document.querySelector('.search-input-container');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const closeSearch = document.getElementById('closeSearch');
    const searchButton = document.getElementById('searchButton');
    
    if (!enableSearch || !searchInputContainer) return;

    let searchOpen = false;

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
    closeSearch?.addEventListener('click', function() {
        searchInputContainer.style.display = 'none';
        searchInput.value = '';
        searchResults.style.display = 'none';
        searchOpen = false;
    });

    // Search functionality
    searchInput?.addEventListener('input', function() {
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
    searchButton?.addEventListener('click', function() {
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
            searchResults.style.display = 'none';
        }
    });

    // Close search results on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchResults.style.display = 'none';
        }
    });
}

// ======================
// UTILITY FUNCTIONS
// ======================

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close all open elements
function closeAllOpenElements() {
    // Close cart
    if (document.getElementById('cartOverlay')?.classList.contains('active')) {
        document.getElementById('cartOverlay').classList.remove('active');
        document.getElementById('cartBackdrop').classList.remove('active');
    }
    
    // Close search
    const searchInputContainer = document.querySelector('.search-input-container');
    if (searchInputContainer && searchInputContainer.style.display !== 'none') {
        searchInputContainer.style.display = 'none';
        document.getElementById('searchResults').style.display = 'none';
    }
    
    // Close dropdown menu
    if (document.getElementById('dropdownMenu')?.classList.contains('hidden') === false) {
        document.getElementById('dropdownMenu').classList.add('hidden');
    }
    
    // Close mobile menu
    const mobileMenuContent = document.getElementById('mobileMenuContent');
    if (mobileMenuContent?.classList.contains('active')) {
        mobileMenuContent.classList.remove('active');
        const mobileMenuIcon = document.getElementById('mobileMenuButton')?.querySelector('i');
        if (mobileMenuIcon) {
            mobileMenuIcon.classList.add('fa-bars');
            mobileMenuIcon.classList.remove('fa-times');
        }
        document.getElementById('mobileAccountOptions').classList.add('hidden');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const mobileMenuContent = document.getElementById('mobileMenuContent');
    if (!mobileMenuContent) return;
    
    if (mobileMenuContent.classList.contains('active')) {
        mobileMenuContent.classList.remove('active');
        const mobileMenuIcon = document.getElementById('mobileMenuButton')?.querySelector('i');
        if (mobileMenuIcon) {
            mobileMenuIcon.classList.add('fa-bars');
            mobileMenuIcon.classList.remove('fa-times');
        }
        document.getElementById('mobileAccountOptions').classList.add('hidden');
        return;
    }
    
    closeAllOpenElements();
    mobileMenuContent.classList.add('active');
    const mobileMenuIcon = document.getElementById('mobileMenuButton')?.querySelector('i');
    if (mobileMenuIcon) {
        mobileMenuIcon.classList.remove('fa-bars');
        mobileMenuIcon.classList.add('fa-times');
    }
    
    const user = auth.currentUser;
    if (user) {
        document.getElementById('mobileAccountOptions').classList.remove('hidden');
    } else {
        document.getElementById('mobileAccountOptions').classList.add('hidden');
    }
}

// Toggle dropdown menu
function toggleDropdown() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (!dropdownMenu) return;
    
    if (dropdownMenu.classList.contains('hidden') === false) {
        dropdownMenu.classList.add('hidden');
        return;
    }
    
    closeAllOpenElements();
    dropdownMenu.classList.remove('hidden');
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

// ======================
// INITIALIZATION
// ======================

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart
    initializeCart();
    
    // Setup cart event listeners
    setupCartEventListeners();
    
    // Setup product page if needed
    setupProductPage();
    
    // Setup search functionality
    setupSearch();
    
    // Setup password toggles
    setupPasswordToggles();
    
    // Event listeners for auth sections
    document.getElementById('show-signup')?.addEventListener('click', function(event) {
        event.preventDefault();
        showSignupSection();
        resetForms();
    });

    document.getElementById('show-login')?.addEventListener('click', function(event) {
        event.preventDefault();
        showLoginSection();
        resetForms();
    });

    document.getElementById('close-forgot-password')?.addEventListener('click', function() {
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

    document.getElementById('forgot-password-link')?.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation(); // Prevent event bubbling
        
        // Hide the auth container but keep the backdrop
        document.getElementById('auth-container').classList.remove('active');
        
        // Show the forgot password modal
        document.getElementById('forgot-password-modal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    });

    // Password match validation
    document.getElementById('signup-confirm-password')?.addEventListener('input', function() {
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (password && confirmPassword && password !== confirmPassword) {
            document.getElementById('password-mismatch-error').textContent = 'Passwords do not match';
            document.getElementById('password-mismatch-error').classList.remove('hidden');
        } else {
            document.getElementById('password-mismatch-error').classList.add('hidden');
        }
    });

    document.getElementById('confirm-new-password')?.addEventListener('input', function() {
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
    document.getElementById('auth-container')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideAuthContainer();
        }
    });

    document.getElementById('forgot-password-modal')?.addEventListener('click', function(e) {
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

    // In your event listeners section, add this:
document.getElementById('logoutOption')?.addEventListener('click', function(e) {
    e.preventDefault();
    logoutUser(e);
    document.getElementById('dropdownMenu').classList.add('hidden'); // Close the dropdown
});

// Also update the mobile logout option:
document.getElementById('mobileLogoutOption')?.addEventListener('click', function(e) {
    e.preventDefault();
    logoutUser(e);
    document.getElementById('mobileAccountOptions').classList.add('hidden'); // Close mobile menu
});

    // Account dropdown functionality
    document.getElementById('accountIconNav')?.addEventListener('click', function(e) {
        e.stopPropagation();
        const user = auth.currentUser;
        if (user) {
            toggleDropdown();
        } else {
            showAuthContainer();
            showLoginSection();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const accountIconNav = document.getElementById('accountIconNav');
        const dropdownMenu = document.getElementById('dropdownMenu');
        
        if (accountIconNav && dropdownMenu && 
            !accountIconNav.contains(event.target) && 
            !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    // Profile Option
    document.getElementById('profileOption')?.addEventListener('click', showAccountInfo);
    document.getElementById('mobileProfileOption')?.addEventListener('click', showAccountInfo);

    // Account Info Page
    document.getElementById('closeAccountInfoPage')?.addEventListener('click', () => {
        document.getElementById('account-info-page').classList.add('hidden');
    });

    // Edit Profile
    document.getElementById('editProfileIcon')?.addEventListener('click', showEditProfileModal);
    document.getElementById('closeEditProfileModal')?.addEventListener('click', () => {
        document.getElementById('editProfileModal').classList.add('hidden');
    });
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);

    // Address Management
    document.getElementById('addAddressLink')?.addEventListener('click', showAddAddressModal);
    document.getElementById('closeAddAddressModal')?.addEventListener('click', cancelAddress);
    document.getElementById('saveAddressBtn')?.addEventListener('click', saveAddress);
    document.getElementById('cancelAddressBtn')?.addEventListener('click', cancelAddress);
    document.getElementById('addressForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        saveAddress(e);
    });

    // Mobile menu button
    document.getElementById('mobileMenuButton')?.addEventListener('click', toggleMobileMenu);

    // Checkout button
    document.querySelector('.checkout-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        try {
            placeOrder();
        } catch (error) {
            console.error("Checkout error:", error);
            alert("There was an error processing your order. Please try again.");
        }
    });

    // Initialize auth state
    auth.onAuthStateChanged(async (user) => {
        updateAuthButton(user);
        
        if (user) {
            // User is signed in
            try {
                // Load user data from Firestore
                const userDoc = await db.collection("users").doc(user.uid).get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    updateUIWithUserData(user, userData);
                } else {
                    // Create user document if it doesn't exist
                    await db.collection("users").doc(user.uid).set({
                        name: user.displayName || '',
                        email: user.email,
                        provider: user.providerData[0]?.providerId || 'unknown',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        addresses: []
                    });
                    
                    // Try getting the document again
                    const newUserDoc = await db.collection("users").doc(user.uid).get();
                    updateUIWithUserData(user, newUserDoc.data());
                }
                
                // Load addresses and orders
                loadAddresses(user.uid);
                loadOrders(user.uid);
                
                // Sync guest cart with user cart if needed
                const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
                if (guestCart.length > 0) {
                    const firestoreCart = await getOrCreateUserCart(user.uid);
                    const mergedCart = mergeCarts(firestoreCart, guestCart);
                    cart = mergedCart;
                    await saveCartToFirestore(user.uid, mergedCart);
                    localStorage.removeItem('guestCart');
                    updateCartCount();
                    renderCart();
                    renderOrderSummary(); // Ensure order summary is updated after merge
                }
            } catch (error) {
                console.error("Error handling auth state change:", error);
            }
        } else {
            // User is signed out
            updateUIWithUserData(null, null);
            
            // If on account page, show login prompt for orders
            if (window.location.pathname.includes('account') && ordersContainer) {
                ordersContainer.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-shopping-bag text-4xl mb-3"></i>
                        <p class="text-lg">Please sign in to view your orders</p>
                        <button onclick="showAuthContainer(); showLoginSection()" 
                                class="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                            Sign In
                        </button>
                    </div>
                `;
            }
            
            // Load guest cart
            const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            cart = guestCart;
            updateCartCount();
            renderCart();
            renderOrderSummary(); // Ensure order summary is updated for guest users
        }
    });
});
