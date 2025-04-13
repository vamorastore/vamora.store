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
                    },
                    {
                        orderId: 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                        status: 'status-processing',
                        cart: [
                            {
                                title: 'Sample Product 2',
                                size: 'L',
                                price: '₹799',
                                quantity: 1,
                                imageUrl: 'https://via.placeholder.com/50'
                            }
                        ]
                    },
                    {
                        orderId: 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                        status: 'status-order-placed',
                        cart: [
                            {
                                title: 'Sample Product 3',
                                size: 'S',
                                price: '₹399',
                                quantity: 3,
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

            document.getElementById('cartTotal').textContent = `₹ ${total.toFixed(2)}`;
        }

        function removeFromCart(index, event) {
            event.stopPropagation();
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
        }

        function proceedToCheckout() {
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
        cartIconNav.addEventListener('click', toggleCart);
        closeCartButton.addEventListener('click', closeCart);
        cartBackdrop.addEventListener('click', closeCart);

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

        // DOM elements
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
                searchOpen = false;
                return;
            }
            
            // Otherwise, close other elements and open search
            closeAllOpenElements();
            searchOpen = true;
            searchInputContainer.style.display = 'block';
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
                return;
            }
            
            // Otherwise, close other elements and open mobile menu
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
            } else {
                // Show login modal if user is not logged in
                document.getElementById('auth-container').classList.remove('hidden');
            }
        }

        // Close account info page
        closeAccountInfoPage.addEventListener('click', function(event) {
            event.preventDefault();
            accountInfoPage.classList.add('hidden');
        });

        // Load account info
        function loadAccountInfo(email) {
            const loggedInUser = JSON.parse(localStorage.getItem('user'));
            if (loggedInUser) {
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

        // Login system functions
        async function hashData(data) {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

        function hideAuthContainer() {
            document.getElementById('auth-container').classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            resetForms();
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

        function showEditProfileModal() {
            const user = JSON.parse(localStorage.getItem('user'));
            nameInput.value = user.name || '';
            emailDisplay.value = user.email || '';
            editProfileModal.classList.remove('hidden');
        }

        function saveProfile() {
            const user = JSON.parse(localStorage.getItem('user'));
            user.name = nameInput.value;
            localStorage.setItem('user', JSON.stringify(user));
            
            document.getElementById('displayName').textContent = user.name || '';
            editProfileModal.classList.add('hidden');
        }

        function showAddAddressModal(event) {
            event.preventDefault();
            document.getElementById('addressForm').reset();
            delete document.getElementById('addressForm').dataset.editingId;
            addAddressModal.classList.remove('hidden');
        }

        function saveAddress(event) {
            event.preventDefault();
            
            const form = document.getElementById('addressForm');
            const isEditing = form.dataset.editingId;
            const user = JSON.parse(localStorage.getItem('user'));
            
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
                id: isEditing || Date.now().toString()
            };
            
            // Basic validation
            if (!address.fullName || !address.phoneNumber || !address.addressLine1 || 
                !address.city || !address.state || !address.postalCode || !address.country) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Initialize user's addresses if not exists
            if (!user.addresses) {
                user.addresses = [];
            }
            
            // If this is set as default, unset any existing default
            if (address.isDefault) {
                user.addresses.forEach(addr => addr.isDefault = false);
            }
            
            if (isEditing) {
                // Update existing address
                const index = user.addresses.findIndex(addr => addr.id === isEditing);
                if (index !== -1) {
                    user.addresses[index] = address;
                }
                delete form.dataset.editingId;
            } else {
                // Add new address
                user.addresses.push(address);
            }
            
            // Save back to storage
            localStorage.setItem('user', JSON.stringify(user));
            
            // Also update in the global users array
            const allUsers = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = allUsers.findIndex(u => u.email === user.email);
            if (userIndex !== -1) {
                allUsers[userIndex] = user;
                localStorage.setItem('users', JSON.stringify(allUsers));
            }
            
            // Store as default address if needed
            if (address.isDefault) {
                localStorage.setItem('defaultAddress', JSON.stringify(address));
            }
            
            loadAddresses(user.email);
            addAddressModal.classList.add('hidden');
            form.reset();
        }

        function cancelAddress() {
            document.getElementById('addressForm').reset();
            delete document.getElementById('addressForm').dataset.editingId;
            addAddressModal.classList.add('hidden');
        }

        function deleteAddress(addressId) {
            if (!confirm('Are you sure you want to delete this address?')) return;
            
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.addresses) return;
            
            // Remove the address
            const updatedAddresses = user.addresses.filter(addr => addr.id !== addressId);
            user.addresses = updatedAddresses;
            
            // If we deleted the default address and there are other addresses, set the first one as default
            if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
                user.addresses[0].isDefault = true;
                localStorage.setItem('defaultAddress', JSON.stringify(user.addresses[0]));
            }
            
            // Update user data
            localStorage.setItem('user', JSON.stringify(user));
            
            // Also update in the global users array
            const allUsers = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = allUsers.findIndex(u => u.email === user.email);
            if (userIndex !== -1) {
                allUsers[userIndex] = user;
                localStorage.setItem('users', JSON.stringify(allUsers));
            }
            
            loadAddresses(user.email);
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

        function setDefaultAddress(addressId) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;
            
            // Initialize addresses array if not exists
            if (!user.addresses) {
                user.addresses = [];
            }
            
            // Unset any existing default address
            user.addresses.forEach(addr => {
                addr.isDefault = addr.id === addressId;
            });
            
            // Find and store the default address
            const defaultAddress = user.addresses.find(addr => addr.isDefault);
            if (defaultAddress) {
                localStorage.setItem('defaultAddress', JSON.stringify(defaultAddress));
            }
            
            localStorage.setItem('user', JSON.stringify(user));
            
            // Also update in the global users array
            const allUsers = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = allUsers.findIndex(u => u.email === user.email);
            if (userIndex !== -1) {
                allUsers[userIndex] = user;
                localStorage.setItem('users', JSON.stringify(allUsers));
            }
            
            loadAddresses(user.email);
        }

        function logoutUser(event) {
            event.preventDefault();
            // Clear user data
            localStorage.setItem('user', JSON.stringify({
                name: '',
                email: '',
                addresses: []
            }));
            
            alert('You have been logged out.');
            dropdownMenu.classList.add('hidden');
            
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
        }

        // Login system event handlers
        document.getElementById('signup-form').addEventListener('submit', async function(event) {
            event.preventDefault();
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

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
                const emailExists = existingUsers.some(user => user.email === email);

                if (emailExists) {
                    document.getElementById('email-exists-error').classList.remove('hidden');
                    hideLoading('signup-submit-button');
                    return;
                }

                // Store user with hashed password and security answer
                const hashedPassword = await hashData(password);
                const hashedAnswer = await hashData(securityAnswer);
                
                const user = {
                    name: name,
                    email: email,
                    password: hashedPassword,
                    securityQuestion: securityQuestion,
                    securityAnswer: hashedAnswer,
                    addresses: []
                };

                existingUsers.push(user);
                localStorage.setItem('users', JSON.stringify(existingUsers));
                
                // Also set as logged in user
                localStorage.setItem('user', JSON.stringify({
                    name: name,
                    email: email,
                    addresses: []
                }));
                
                document.getElementById('verify-email-success').classList.remove('hidden');
                document.getElementById('signup-form').reset();
                
                // Auto switch to login after delay
                setTimeout(() => {
                    document.getElementById('signup-section').classList.add('hidden');
                    document.getElementById('login-section').classList.remove('hidden');
                    document.getElementById('verify-email-success').classList.add('hidden');
                    hideAuthContainer();
                    loadAccountInfo(email);
                }, 2000);
            } catch (error) {
                console.error('Error during signup:', error);
                document.getElementById('signup-error').textContent = 'An error occurred. Please try again.';
                document.getElementById('signup-error').classList.remove('hidden');
            } finally {
                hideLoading('signup-submit-button');
            }
        });

        document.getElementById('login-form').addEventListener('submit', async function(event) {
            event.preventDefault();
            showLoading('login-submit-button');
            
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me').checked;

            // Reset error messages
            document.getElementById('login-error').classList.add('hidden');

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
                const hashedPassword = await hashData(password);
                
                const storedUser = existingUsers.find(user => 
                    user.email === email && 
                    user.password === hashedPassword
                );

                if (storedUser) {
                    if (rememberMe) {
                        localStorage.setItem('rememberedUser', JSON.stringify({ 
                            email: email, 
                            name: storedUser.name 
                        }));
                    } else {
                        localStorage.removeItem('rememberedUser');
                    }
                    
                    // Store user data without password for security
                    const userData = {
                        email: email,
                        name: storedUser.name,
                        addresses: storedUser.addresses || []
                    };
                    
                    localStorage.setItem('user', JSON.stringify(userData));
                    
                    document.getElementById('login-error').classList.add('hidden');
                    document.getElementById('login-success').classList.remove('hidden');
                    
                    // Hide success message after delay
                    setTimeout(() => {
                        document.getElementById('login-success').classList.add('hidden');
                        hideAuthContainer();
                        loadAccountInfo(email);
                    }, 1500);
                } else {
                    document.getElementById('login-error').classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error during login:', error);
                document.getElementById('login-error').textContent = 'An error occurred. Please try again.';
                document.getElementById('login-error').classList.remove('hidden');
            } finally {
                hideLoading('login-submit-button');
            }
        });

        // Forgot Password Handlers
        document.getElementById('forgot-password-form').addEventListener('submit', async function(event) {
            event.preventDefault();
            showLoading('forgot-submit-button');
            
            const email = document.getElementById('forgot-email').value.trim();
            const securityQuestion = document.getElementById('forgot-security-question').value;
            const securityAnswer = document.getElementById('forgot-security-answer').value.trim();

            // Reset error message
            document.getElementById('forgot-error').classList.add('hidden');

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
                const hashedAnswer = await hashData(securityAnswer);
                
                const storedUser = existingUsers.find(user => 
                    user.email === email && 
                    user.securityQuestion === securityQuestion && 
                    user.securityAnswer === hashedAnswer
                );

                if (storedUser) {
                    document.getElementById('forgot-error').classList.add('hidden');
                    document.getElementById('reset-password-section').classList.remove('hidden');
                } else {
                    document.getElementById('forgot-error').classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error during password recovery:', error);
                document.getElementById('forgot-error').textContent = 'An error occurred. Please try again.';
                document.getElementById('forgot-error').classList.remove('hidden');
            } finally {
                hideLoading('forgot-submit-button');
            }
        });

        document.getElementById('save-new-password').addEventListener('click', async function() {
            showLoading('save-new-password');
            
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            const email = document.getElementById('forgot-email').value.trim();

            // Reset error message
            document.getElementById('reset-password-mismatch').classList.add('hidden');
            document.getElementById('reset-success').classList.add('hidden');

            if (!validatePassword(newPassword)) {
                document.getElementById('reset-password-mismatch').textContent = 'Password must be at least 8 characters with uppercase, number, and special character';
                document.getElementById('reset-password-mismatch').classList.remove('hidden');
                hideLoading('save-new-password');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                document.getElementById('reset-password-mismatch').textContent = 'Passwords do not match';
                document.getElementById('reset-password-mismatch').classList.remove('hidden');
                hideLoading('save-new-password');
                return;
            }

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
                const userIndex = existingUsers.findIndex(user => user.email === email);
                const hashedPassword = await hashData(newPassword);

                if (userIndex !== -1) {
                    existingUsers[userIndex].password = hashedPassword;
                    localStorage.setItem('users', JSON.stringify(existingUsers));
                    
                    document.getElementById('reset-success').classList.remove('hidden');
                    document.getElementById('reset-password-mismatch').classList.add('hidden');
                    
                    setTimeout(() => {
                        document.getElementById('forgot-password-modal').classList.add('hidden');
                        document.body.classList.remove('overflow-hidden');
                        document.getElementById('forgot-password-form').reset();
                        document.getElementById('reset-password-section').classList.add('hidden');
                        document.getElementById('reset-success').classList.add('hidden');
                    }, 2000);
                }
            } catch (error) {
                console.error('Error during password reset:', error);
                document.getElementById('reset-password-mismatch').textContent = 'An error occurred. Please try again.';
                document.getElementById('reset-password-mismatch').classList.remove('hidden');
            } finally {
                hideLoading('save-new-password');
            }
        });

        // Event Listeners
        document.getElementById('show-signup').addEventListener('click', function(event) {
            event.preventDefault();
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('signup-section').classList.remove('hidden');
            resetForms();
        });

        document.getElementById('show-login').addEventListener('click', function(event) {
            event.preventDefault();
            document.getElementById('signup-section').classList.add('hidden');
            document.getElementById('login-section').classList.remove('hidden');
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
            }
        });

        // Event listeners
        accountIconNav.addEventListener('click', toggleDropdown);
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

        // Initialize
        window.addEventListener('load', function() {
            setupPasswordToggles();
            
            const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser'));
            
            if (rememberedUser) {
                document.getElementById('login-email').value = rememberedUser.email;
                document.getElementById('remember-me').checked = true;
            }
            
            // Check if user is logged in on page load
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
