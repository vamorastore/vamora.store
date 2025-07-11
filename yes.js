const firebaseConfig = {
  apiKey: "AIzaSyBkMUmD27GU34yIPQAj7KUErt9muB0MdLk",
  authDomain: "vamora.store",
  projectId: "vamora-co-in",
  storageBucket: "vamora-co-in.appspot.com",
  messagingSenderId: "613048727757",
  appId: "1:613048727757:web:d0c73e84fa7d93a5c21184",
  measurementId: "G-8R6TDRQGS6"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const analytics = firebase.analytics();
const db = firebase.firestore();

db.enablePersistence()
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          console.log("Multiple tabs open, persistence can only be enabled in one tab at a time");
      } else if (err.code == 'unimplemented') {
          console.log("The current browser does not support all of the features required to enable persistence");
      }
  });

const ordersContainer = document.getElementById('ordersContainer');

let cart = [];

function initializeCart() {
    const user = auth.currentUser;
    if (user) {
        getOrCreateUserCart(user.uid).then(firestoreCart => {
            cart = firestoreCart;
            updateCartCount();
            renderCart();
            renderOrderSummary();
        });
    } else {
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
        cart = guestCart;
        updateCartCount();
        renderCart();
        renderOrderSummary();
    }
}

auth.onAuthStateChanged(() => {
    initializeCart();
});

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
        if (!userId) {
            localStorage.setItem('guestCart', JSON.stringify(cartItems));
        }
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

window.addToCart = async function(product) {
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
    renderOrderSummary();
    
    openCart();
};

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.setAttribute('data-count', totalItems);
    }
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
                <a href="shop.html" class="mt-4 inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
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
    renderOrderSummary();
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
    renderOrderSummary();
};

async function proceedToCheckout() {
    const user = auth.currentUser;
    
    if (!user) {
        showAuthContainer();
        return;
    }

    window.location.href = 'checkout.html';
}

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

function setupCartEventListeners() {
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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('cartOverlay').classList.contains('active')) {
            closeCart();
        }
    });
}

function setupProductPage() {
    if (!document.querySelector('.product-details')) return;

    const sizeButtons = document.querySelectorAll('.size-button');
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            sizeButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

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
    
    const sizeGuideBtn = document.getElementById('size-guide-btn');
    const sizeGuideContainer = document.getElementById('size-guide-container');

    sizeGuideBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        sizeGuideContainer.classList.toggle('open');
        this.textContent = sizeGuideContainer.classList.contains('open') ? 'Hide guide' : 'Size guide';
    });

    quantityInput?.addEventListener('change', function() {
        if (this.value < 1) this.value = 1;
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

async function loadOrders(userId) {
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
                    <a href="shop.html" class="mt-4 inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
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

    const statusOrder = ['placed', 'processed', 'shipped', 'delivered'];

    ordersContainer.innerHTML = orders.map(order => {
        const currentIndex = statusOrder.indexOf(order.status);

        const iconClass = (index) => {
            if (index === 0) return 'bg-blue-500 text-white';
            return (index <= currentIndex) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500';
        };

        const getStatusProgress = (status) => {
            const currentIndex = statusOrder.indexOf(status);
            const widthClasses = ['w-1/4', 'w-2/4', 'w-3/4', 'w-full'];
            return widthClasses[Math.max(0, currentIndex)] + ' bg-blue-500';
        };

        const getStatusColor = (status) => {
            return statusOrder.includes(status) ? 'text-blue-600' : 'text-gray-600';
        };

        return `
        <div class="order-item border border-gray-200 rounded-lg mb-6 bg-white shadow-sm overflow-hidden">
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
                            ${order.status || 'pending'}
                        </p>
                    </div>
                </div>
            </div>

            <div class="px-4 py-3 border-b border-gray-200">
                <div class="relative">
                    <div class="flex justify-between items-center mb-3 text-[11px] text-gray-600 md:text-xs">
                        <span class="${order.status === 'placed' ? 'text-blue-600 font-medium' : ''}">Placed</span>
                        <span class="${order.status === 'processed' ? 'text-blue-600 font-medium' : ''}">Processed</span>
                        <span class="${order.status === 'shipped' ? 'text-blue-600 font-medium' : ''}">Shipped</span>
                        <span class="${order.status === 'delivered' ? 'text-blue-600 font-medium' : ''}">Delivered</span>
                    </div>

                    <div class="relative h-1.5 bg-gray-200 rounded-full mb-4">
                        <div class="absolute top-0 left-0 h-1.5 rounded-full ${getStatusProgress(order.status)}"></div>
                    </div>

                    <div class="relative flex justify-between px-1 md:px-0">
                        <div class="w-6 h-6 md:w-8 md:h-8 ${iconClass(0)} rounded-full flex items-center justify-center">
                            <i class="fas fa-check text-xs"></i>
                        </div>
                        <div class="w-6 h-6 md:w-8 md:h-8 ${iconClass(1)} rounded-full flex items-center justify-center">
                            <i class="fas fa-cogs text-xs"></i>
                        </div>
                        <div class="w-6 h-6 md:w-8 md:h-8 ${iconClass(2)} rounded-full flex items-center justify-center">
                            <i class="fas fa-shipping-fast text-xs"></i>
                        </div>
                        <div class="w-6 h-6 md:w-8 md:h-8 ${iconClass(3)} rounded-full flex items-center justify-center">
                            <i class="fas fa-box-open text-xs"></i>
                        </div>
                    </div>
                </div>
            </div>

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
                                    <div><span class="text-gray-500">Size:</span> <span>${item.size || '-'}</span></div>
                                    <div><span class="text-gray-500">Qty:</span> <span>${item.quantity || 1}</span></div>
                                    <div class="col-span-2 md:col-span-1"><span class="text-gray-500">Price:</span> <span>${item.price || '₹0.00'}</span></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button onclick="showTrackingLink('${order.trackingLink || ''}')" class="w-full md:w-auto px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm font-medium">
                    Track Order
                </button>
            </div>

            <div id="trackingModal-${order.id}" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">Order Tracking</h3>
                        <button onclick="document.getElementById('trackingModal-${order.id}').classList.add('hidden')" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    ${order.trackingLink ? `
    <div class="mb-4">
        <p class="text-sm text-gray-600 mb-1">Courier Service: <span class="font-medium capitalize">${order.courierService || 'Not specified'}</span></p>
        <p class="text-sm text-gray-600 mb-2">Tracking Link:</p>
        <div class="flex items-center border rounded-md overflow-hidden">
            <input type="text" id="trackingLink-${order.id}" value="${order.trackingLink}" class="flex-1 px-3 py-2 outline-none text-sm" readonly>
            <button onclick="copyTrackingLink('trackingLink-${order.id}')" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    </div>
    <a href="track.html" class="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Open Tracking Page
    </a>
` : `
    <p class="text-gray-600 mb-4">Tracking information is not yet available. Please check back later.</p>
    <button onclick="document.getElementById('trackingModal-${order.id}').classList.add('hidden')" class="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
        Close
    </button>
                    `}
                </div>
            </div>
        </div>
        `;
    }).join('');

    window.showTrackingLink = function (link) {
        if (!link) {
            alert("Tracking information is not yet available. Please check back later.");
            return;
        }
        const orderElement = event.target.closest('.order-item');
        if (orderElement) {
            const modal = orderElement.querySelector('[id^="trackingModal-"]');
            if (modal) modal.classList.remove('hidden');
        }
    };

    window.copyTrackingLink = function (inputId) {
        const input = document.getElementById(inputId);
        input.select();
        document.execCommand('copy');
        const toast = document.createElement('div');
        toast.textContent = 'Link copied!';
        toast.className = 'fixed bottom-4 right-4 px-4 py-2 bg-green-500 text-white rounded-md shadow-lg';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    };
}

function getStatusProgressMobile(status) {
    switch(status) {
        case 'status-order-placed':
            return 'h-[32px]';
        case 'status-processing':
            return 'h-[65px]';
        case 'status-shipped':
            return 'h-[100px]';
        case 'status-delivered':
            return 'h-[130px]';
        default:
            return 'h-[32px]';
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

    validateField('first-name', 'first-name-error');
    validateField('last-name', 'last-name-error');
    validateField('address', 'address-error');
    validateField('pin-code', 'pin-code-error');
    validateField('phone', 'phone-error');
    validateField('city', 'city-error');
    validateField('state', 'state-error');
    validateField('email', 'email-error');

    const phone = document.getElementById('phone').value.trim();
    if (phone && !/^\d{10}$/.test(phone)) {
        document.getElementById('phone-error').textContent = 'Please enter a valid 10-digit phone number';
        document.getElementById('phone-error').style.display = 'block';
        document.getElementById('phone').classList.add('error-highlight');
        isValid = false;
    }

    const pinCode = document.getElementById('pin-code').value.trim();
    if (pinCode && !/^\d{6}$/.test(pinCode)) {
        document.getElementById('pin-code-error').textContent = 'Please enter a valid 6-digit PIN code';
        document.getElementById('pin-code-error').style.display = 'block';
        document.getElementById('pin-code').classList.add('error-highlight');
        isValid = false;
    }

    const email = document.getElementById('email').value.trim();
    if (email && !validateEmail(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email address';
        document.getElementById('email-error').style.display = 'block';
        document.getElementById('email').classList.add('error-highlight');
        isValid = false;
    }

    return isValid;
}

function generateOrderId() {
    const prefix = "VA";
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNum}`;
}

function calculateTotalAmount() {
    let total = 0;
    cart.forEach(item => {
        const price = parseFloat(item.price.replace(/[^\d.]/g, '')) * 100;
        total += price * item.quantity;
    });
    return total;
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

async function saveOrder(paymentId, formData, orderId) {
    const user = auth.currentUser;
    
    const orderData = {
        orderId: orderId,
        date: new Date().toISOString(),
        status: 'placed',
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

function handlePaymentSuccess(response, formData, orderId) {
    showThankYouPopup(formData, orderId);
    
    document.getElementById('thankYouOrderId').textContent = `#${orderId}`;
    document.getElementById('popupOrderId').textContent = orderId;
    
    analytics.logEvent('purchase', {
        transaction_id: orderId,
        value: calculateTotalAmount() / 100,
        currency: 'INR',
        items: cart.map(item => ({
            item_id: item.id,
            item_name: item.title,
            item_category: item.category || 'general',
            price: parseFloat(item.price.replace(/[^\d.]/g, '')),
            quantity: item.quantity
        }))
    });
}

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
        saveInfoCheckbox.disabled = true;
        saveInfoCheckbox.nextElementSibling.textContent = 'Saving...';

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
            id: `addr_${Date.now()}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const userRef = db.collection("users").doc(user.uid);
        
        const userDoc = await userRef.get();
        let currentAddresses = userDoc.exists ? (userDoc.data().addresses || []) : [];
        
        currentAddresses = currentAddresses.map(addr => ({
            ...addr,
            isDefault: false
        }));
        
        currentAddresses.push(address);
        
        await userRef.set({
            addresses: currentAddresses,
            defaultAddress: address,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
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

async function placeOrder() {
    if (!validateCheckoutForm()) {
        const firstErrorField = document.querySelector('.error-highlight');
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    const orderId = generateOrderId();
    
    const formData = getFormData();
    const email = document.getElementById('email').value.trim();

    const saveInfoCheckbox = document.getElementById('save-info');
    if (saveInfoCheckbox?.checked) {
        try {
            await saveInformation();
        } catch (error) {
            console.error("Error saving address:", error);
        }
    }

    const totalAmount = calculateTotalAmount();

    const options = {
        key:"rzp_live_DPartLBDccSG34",
        amount: totalAmount,
        currency: "INR",
        name: "VAMORA.STORE",
        description: "Order Payment",
        image: "/logo.png",
        order_id: "",
        handler: async function(response) {
            try {
                await saveOrder(response.razorpay_payment_id, {...formData, email}, orderId);
                handlePaymentSuccess(response, {...formData, email}, orderId);
                
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
            color: "#528FF0"
        }
    };

    try {
        const rzp = new Razorpay(options);
        rzp.open();

        rzp.on('payment.failed', function(response) {
            handlePaymentFailure(response);
        });
    } catch (error) {
        console.error("Error initializing Razorpay:", error);
        showToast("Error initializing payment gateway. Please try again.", 'error');
    }
}

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

    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const addressLine1 = document.getElementById('addressLine1').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const country = document.getElementById('country').value;
    const addressType = document.querySelector('input[name="addressType"]:checked')?.value || 'home';
    const isDefault = document.getElementById('setAsDefault').checked;

    const errors = [];
    
    if (!fullName) errors.push('Full name is required');
    if (!phoneNumber) errors.push('Phone number is required');
    if (!addressLine1) errors.push('Address line 1 is required');
    if (!city) errors.push('City is required');
    if (!state) errors.push('State is required');
    if (!postalCode) errors.push('Postal code is required');
    if (!country) errors.push('Country is required');
    
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
        errors.push('Phone number must be 10 digits');
    }
    
    if (postalCode && !/^\d{6}$/.test(postalCode)) {
        errors.push('Postal code must be 6 digits');
    }

    if (errors.length > 0) {
        showToast(errors.join(', '), 'error');
        return;
    }

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
        const saveBtn = document.getElementById('saveAddressBtn');
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        const userRef = db.collection("users").doc(user.uid);
        
        const userDoc = await userRef.get();
        let currentAddresses = userDoc.exists ? (userDoc.data().addresses || []) : [];

        if (address.isDefault) {
            currentAddresses = currentAddresses.map(addr => ({
                ...addr,
                isDefault: false
            }));
        }

        const isEditing = document.getElementById('addressForm').dataset.editingId;
        if (isEditing) {
            currentAddresses = currentAddresses.map(addr => 
                addr.id === isEditing ? address : addr
            );
        } else {
            if (currentAddresses.length === 0) {
                address.isDefault = true;
            }
            currentAddresses.push(address);
        }

        const updateData = {
            addresses: currentAddresses,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (address.isDefault) {
            updateData.defaultAddress = address;
        }

        await userRef.set(updateData, { merge: true });

        await loadAddresses(user.uid);
        document.getElementById('addAddressModal').classList.add('hidden');
        document.getElementById('addressForm').reset();
        delete document.getElementById('addressForm').dataset.editingId;
        
        showToast('Address saved successfully!');
        
    } catch (error) {
        console.error("Error saving address:", error);
        showToast("Failed to save address. Please try again.", 'error');
    } finally {
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
        
        const userDoc = await userRef.get();
        if (!userDoc.exists) return;
        
        const addresses = userDoc.data().addresses || [];
        const addressToSetDefault = addresses.find(addr => addr.id === addressId);
        
        if (!addressToSetDefault) {
            showToast('Address not found', 'error');
            return;
        }

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

        const nameParts = defaultAddress.fullName.split(' ');
        document.getElementById('first-name').value = nameParts[0] || '';
        document.getElementById('last-name').value = nameParts.slice(1).join(' ') || '';
        
        document.getElementById('address').value = defaultAddress.addressLine1 || '';
        document.getElementById('apartment').value = defaultAddress.addressLine2 || '';
        
        document.getElementById('city').value = defaultAddress.city || '';
        document.getElementById('state').value = defaultAddress.state || '';
        document.getElementById('pin-code').value = defaultAddress.postalCode || '';
        document.getElementById('phone').value = defaultAddress.phoneNumber || '';
    } catch (error) {
        console.error("Error applying default address:", error);
    }
}

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

function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
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

document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading('signup-submit-button');
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    document.getElementById('signup-error').classList.add('hidden');
    document.getElementById('email-error').classList.add('hidden');
    document.getElementById('email-exists-error').classList.add('hidden');
    document.getElementById('password-mismatch-error').classList.add('hidden');
    document.getElementById('name-error').classList.add('hidden');

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

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            return user.sendEmailVerification()
                .then(() => {
                    return user.updateProfile({
                        displayName: name
                    }).then(() => {
                        return db.collection("users").doc(user.uid).set({
                            name: name,
                            email: email,
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
            const verifyEmailSuccess = document.getElementById('verify-email-success');
            if (verifyEmailSuccess) {
                verifyEmailSuccess.innerHTML = `
                    <div class="text-center">
                        <i class="fas fa-envelope-open-text text-4xl text-green-500 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Verify Your Email</h3>
                        <p class="mb-4">We've sent a verification link to ${email}</p>
                        <p class="text-sm text-gray-600 mb-4">
                            Didn't receive the email? Check your spam folder or
                            <a href="#" onclick="resendVerification('${email}')" 
                               class="text-blue-600 font-medium" id="resend-verification-btn">
                                Resend Verification Email
                            </a>
                        </p>
                        <button onclick="showLoginSection()" class="px-4 py-2 bg-black text-white rounded">
                            Go to Login
                        </button>
                    </div>
                `;
                verifyEmailSuccess.classList.remove('hidden');
                document.getElementById('signup-form').classList.add('hidden');
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

document.getElementById('forgot-email')?.addEventListener('blur', function() {
    const email = this.value.trim();
    const errorEl = document.getElementById('forgot-email-error');
    
    if (!email) {
        errorEl.textContent = 'Email is required';
        errorEl.classList.remove('hidden');
        return;
    }
    
    if (!validateEmail(email)) {
        errorEl.textContent = 'Please enter a valid email address';
        errorEl.classList.remove('hidden');
    } else {
        errorEl.classList.add('hidden');
    }
});

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading('login-submit-button');
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    const loginError = document.getElementById('login-error');
    if (loginError) loginError.classList.add('hidden');

    const persistence = rememberMe ? 
        firebase.auth.Auth.Persistence.LOCAL : 
        firebase.auth.Auth.Persistence.SESSION;

    auth.setPersistence(persistence)
        .then(() => {
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then((userCredential) => {
            const user = userCredential.user;
            
            if (!user.emailVerified) {
                auth.signOut();
                throw new Error("Please verify your email first. Check your inbox.");
            }
            
            return db.collection("users").doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            const loginSuccess = document.getElementById('login-success');
            if (loginSuccess) {
                loginSuccess.textContent = 'Login successful! Redirecting...';
                loginSuccess.classList.remove('hidden');
            }
            
            hideLoading('login-submit-button');
            
            setTimeout(() => {
                hideAuthContainer();
            }, 500);
        })
        .catch((error) => {
        });
});
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
                
                const loginSuccessEl = document.getElementById('login-success');
                if (loginSuccessEl) {
                    loginSuccessEl.textContent = 'Google login successful!';
                    loginSuccessEl.classList.remove('hidden');
                }
                
                const loginError = document.getElementById('login-error');
                const signupError = document.getElementById('signup-error');
                if (loginError) loginError.classList.add('hidden');
                if (signupError) signupError.classList.add('hidden');
                
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

document.getElementById('forgot-password-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading('forgot-submit-button');

    const email = document.getElementById('forgot-email').value.trim().toLowerCase();
    const securityQuestion = document.getElementById('forgot-security-question').value;
    const securityAnswer = document.getElementById('forgot-security-answer').value.trim();
    const forgotErrorEl = document.getElementById('forgot-error');
    forgotErrorEl.classList.add('hidden');

    try {
        const methods = await auth.fetchSignInMethodsForEmail(email);
        if (methods.length === 0) {
            throw new Error("No account found with this email");
        }

        if (!securityQuestion || !securityAnswer) {
            throw new Error("Please answer the security question");
        }

        await auth.sendPasswordResetEmail(email, {
            url: window.location.origin + '/index.html'
        });
        
        document.getElementById('forgot-error').classList.add('hidden');
        showToast("Password reset email sent. Please check your inbox.");
        
        setTimeout(() => {
            document.getElementById('forgot-password-modal').classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            document.getElementById('auth-container').classList.add('active');
        }, 2000);
        
    } catch (error) {
        console.error("Password reset error:", error);
        forgotErrorEl.textContent = error.message;
        forgotErrorEl.classList.remove('hidden');
    } finally {
        hideLoading('forgot-submit-button');
    }
});
function updateAuthButton(user) {
    const authButton = document.getElementById('login-button');
    const authText = document.getElementById('auth-state-text');
    const checkoutAuthButton = document.getElementById('checkoutAuthButton');
    
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

async function logoutUser(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    try {
        const logoutBtn = event?.target.closest('button') || event?.target.closest('a');
        if (logoutBtn) {
            const originalContent = logoutBtn.innerHTML;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            logoutBtn.disabled = true;
        }

        await auth.signOut();
        
        cart = [];
        localStorage.removeItem('guestCart');
        updateCartCount();

        document.getElementById('account-info-page')?.classList.add('hidden');
        document.getElementById('dropdownMenu')?.classList.add('hidden');
        document.getElementById('mobileAccountOptions')?.classList.add('hidden');
        document.getElementById('mobileMenuContent')?.classList.remove('active');

        const mobileMenuButton = document.getElementById('mobileMenuButton');
        if (mobileMenuButton) {
            const mobileMenuIcon = mobileMenuButton.querySelector('i');
            if (mobileMenuIcon) {
                mobileMenuIcon.classList.add('fa-bars');
                mobileMenuIcon.classList.remove('fa-times');
            }
        }

        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.value = '';
            input.readOnly = false;
            input.classList.remove('bg-gray-100');
        });

        updateAuthButton(null);
        showToast('Logged out successfully!', 'success');

        if (window.location.pathname.includes('account')) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error during logout. Please try again.', 'error');
    } finally {
        document.querySelectorAll('[data-action="logout"]').forEach(btn => {
            btn.innerHTML = btn.getAttribute('data-original') || 'Log Out';
            btn.disabled = false;
        });
    }
}

function resendVerification(email) {
    showLoading('resend-verification-btn');
    
    auth.fetchSignInMethodsForEmail(email)
        .then((methods) => {
            if (methods.length === 0) {
                throw new Error('No account found with this email');
            }
            
            if (auth.currentUser && auth.currentUser.email === email) {
                return auth.currentUser.sendEmailVerification();
            }
            
            return auth.signInWithEmailAndPassword(email, "temporary-password")
                .then((userCredential) => {
                    return userCredential.user.sendEmailVerification()
                        .finally(() => auth.signOut());
                })
                .catch((error) => {
                    if (error.code === 'auth/wrong-password') {
                        return auth.currentUser.sendEmailVerification()
                            .finally(() => auth.signOut());
                    }
                    throw error;
                });
        })
        .then(() => {
            showToast("Verification email resent! Please check your inbox.");
        })
        .catch((error) => {
            console.error("Error resending verification:", error);
            showToast(error.message || "Failed to resend verification email", 'error');
        })
        .finally(() => {
            hideLoading('resend-verification-btn');
        });
}

function showAccountInfo(event) {
    if (event) event.preventDefault();
    
    const user = auth.currentUser;
    if (user) {
        document.getElementById('account-info-page').classList.remove('hidden');
    } else {
        showAuthContainer();
    }
}

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
        const saveBtn = document.getElementById('saveProfileBtn');
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
        saveBtn.disabled = true;

        await user.updateProfile({
            displayName: newName
        });

        await db.collection("users").doc(user.uid).update({
            name: newName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

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

function showEditProfileModal() {
    const user = auth.currentUser;
    if (!user) return;
    
    document.getElementById('nameInput').value = user.displayName || '';
    document.getElementById('emailDisplay').value = user.email || '';
    document.getElementById('editProfileModal').classList.remove('hidden');
}

async function loadAccountInfo(userId) {
    try {
        const user = auth.currentUser;
        
        if (!user) {
            renderEmptyAccountState();
            return;
        }

        const userDoc = await db.collection("users").doc(userId).get();
        
        if (!userDoc.exists) {
            await db.collection("users").doc(userId).set({
                name: user.displayName || '',
                email: user.email,
                provider: user.providerData[0]?.providerId || 'unknown',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                addresses: []
            });
            
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

function updateUIWithUserData(user, userData) {
    const displayNameEl = document.getElementById('displayName');
    const displayEmailEl = document.getElementById('displayEmail');
    const emailInput = document.getElementById('email');
    
    if (displayNameEl) {
        displayNameEl.textContent = userData?.name || user?.displayName || '';
    }

    if (displayEmailEl) {
        displayEmailEl.textContent = user?.email || '';
    }

    const nameInput = document.getElementById('nameInput');
    const emailDisplay = document.getElementById('emailDisplay');
    
    if (nameInput) {
        nameInput.value = userData?.name || user?.displayName || '';
    }
    if (emailDisplay) {
        emailDisplay.value = user?.email || '';
        if (emailDisplay.readOnly !== undefined) {
            emailDisplay.readOnly = true;
        }
    }

    if (emailInput) {
        emailInput.value = user?.email || '';
        emailInput.readOnly = !!user;
        if (user) {
            emailInput.classList.add('bg-gray-100');
        } else {
            emailInput.classList.remove('bg-gray-100');
        }
    }

    if (user && user.uid) {
        try {
            loadAddresses(user.uid);
            loadOrders(user.uid);
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }
}

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

const searchData = [
    { id: 1, title: "HOKKAIDO.", category: "Oversized", url: "/hokkaido.html" },
    { id: 2, title: "SIGHT.", category: "Oversized", url: "/sight.html" },
    { id: 3, title: "EPISTLE RAP.", category: "Oversized", url: "/epistlerap.html" },
    { id: 4, title: "ONE.EYE", category: "TEES", url: "/oneeye.html" },
    { id: 5, title: "BRO.GO", category: "TEES", url: "/brogo.html" },
    { id: 6, title: "OVER.THINKER", category: "TEES", url: "/overthinker.html" },
    { id: 7, title: "APEX.", category: "TEES", url: "/apex.html" },
    { id: 8, title: "ONE.PIECE", category: "TEES", url: "/onepiece.html" },
    { id: 9, title: "LUFFY.", category: "TEES", url: "/luffy.html" }
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

    closeSearch?.addEventListener('click', function() {
        searchInputContainer.style.display = 'none';
        searchInput.value = '';
        searchResults.style.display = 'none';
        searchOpen = false;
    });

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

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container') && !e.target.closest('.search-input-container')) {
            searchResults.style.display = 'none';
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchResults.style.display = 'none';
        }
    });
}

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

function closeAllOpenElements() {
    if (document.getElementById('cartOverlay')?.classList.contains('active')) {
        document.getElementById('cartOverlay').classList.remove('active');
        document.getElementById('cartBackdrop').classList.remove('active');
    }
    
    const searchInputContainer = document.querySelector('.search-input-container');
    if (searchInputContainer && searchInputContainer.style.display !== 'none') {
        searchInputContainer.style.display = 'none';
        document.getElementById('searchResults').style.display = 'none';
    }
    
    if (document.getElementById('dropdownMenu')?.classList.contains('hidden') === false) {
        document.getElementById('dropdownMenu').classList.add('hidden');
    }
    
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

document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
    
    setupCartEventListeners();
    
    setupProductPage();
    
    setupSearch();
    
    setupPasswordToggles();
    
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
        
        document.getElementById('forgot-password-form').reset();
        document.getElementById('forgot-error').classList.add('hidden');
        
        if (!auth.currentUser) {
            document.getElementById('auth-container').classList.add('active');
        }
    });

    document.getElementById('forgot-password-link')?.addEventListener('click', function(event) {
        event.preventDefault();
        
        const user = auth.currentUser;
        const forgotEmailInput = document.getElementById('forgot-email');
        
        if (user && forgotEmailInput) {
            forgotEmailInput.value = user.email;
            forgotEmailInput.readOnly = true;
            forgotEmailInput.classList.add('bg-gray-100');
        } else if (forgotEmailInput) {
            forgotEmailInput.value = '';
            forgotEmailInput.readOnly = false;
            forgotEmailInput.classList.remove('bg-gray-100');
        }
        
        document.getElementById('auth-container').classList.remove('active');
        document.getElementById('forgot-password-modal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    });

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

    document.getElementById('auth-container')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideAuthContainer();
        }
    });

    document.getElementById('forgot-password-modal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            document.getElementById('auth-container').classList.add('active');
        }
    });

    document.getElementById('mobileProfileOption')?.addEventListener('click', function(e) {
        e.preventDefault();
        showAccountInfo(e);
        toggleMobileMenu();
    });

    document.getElementById('logoutOption')?.addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser(e);
        document.getElementById('dropdownMenu').classList.add('hidden');
    });

    document.getElementById('mobileLogoutOption')?.addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser(e);
        document.getElementById('mobileAccountOptions').classList.add('hidden');
    });

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

    document.addEventListener('click', function(event) {
        const accountIconNav = document.getElementById('accountIconNav');
        const dropdownMenu = document.getElementById('dropdownMenu');
        
        if (accountIconNav && dropdownMenu && 
            !accountIconNav.contains(event.target) && 
            !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    document.getElementById('profileOption')?.addEventListener('click', showAccountInfo);
    document.getElementById('mobileProfileOption')?.addEventListener('click', showAccountInfo);

    document.getElementById('closeAccountInfoPage')?.addEventListener('click', () => {
        document.getElementById('account-info-page').classList.add('hidden');
    });

    document.getElementById('editProfileIcon')?.addEventListener('click', showEditProfileModal);
    document.getElementById('closeEditProfileModal')?.addEventListener('click', () => {
        document.getElementById('editProfileModal').classList.add('hidden');
    });
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);

    document.getElementById('addAddressLink')?.addEventListener('click', showAddAddressModal);
    document.getElementById('closeAddAddressModal')?.addEventListener('click', cancelAddress);
    document.getElementById('saveAddressBtn')?.addEventListener('click', saveAddress);
    document.getElementById('cancelAddressBtn')?.addEventListener('click', cancelAddress);
    document.getElementById('addressForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        saveAddress(e);
    });

    document.getElementById('mobileMenuButton')?.addEventListener('click', toggleMobileMenu);

    document.querySelector('.checkout-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        try {
            placeOrder();
        } catch (error) {
            console.error("Checkout error:", error);
            alert("There was an error processing your order. Please try again.");
        }
    });

    auth.onAuthStateChanged(async (user) => {
        updateAuthButton(user);
        
        if (user) {
            try {
                const userDoc = await db.collection("users").doc(user.uid).get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    updateUIWithUserData(user, userData);
                } else {
                    await db.collection("users").doc(user.uid).set({
                        name: user.displayName || '',
                        email: user.email,
                        provider: user.providerData[0]?.providerId || 'unknown',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        addresses: []
                    });
                    
                    const newUserDoc = await db.collection("users").doc(user.uid).get();
                    updateUIWithUserData(user, newUserDoc.data());
                }
                
                loadAddresses(user.uid);
                loadOrders(user.uid);
                
                const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
                if (guestCart.length > 0) {
                    const firestoreCart = await getOrCreateUserCart(user.uid);
                    const mergedCart = mergeCarts(firestoreCart, guestCart);
                    cart = mergedCart;
                    await saveCartToFirestore(user.uid, mergedCart);
                    localStorage.removeItem('guestCart');
                    updateCartCount();
                    renderCart();
                    renderOrderSummary();
                }
            } catch (error) {
                console.error("Error handling auth state change:", error);
            }
        } else {
            updateUIWithUserData(null, null);
            
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
            
            const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            cart = guestCart;
            updateCartCount();
            renderCart();
            renderOrderSummary();
        }
    });
});
