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
            updateCartCount();
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

        // Function to update cart count in navbar
        function updateCartCount() {
            const cartCountElement = document.getElementById('cartCount');
            if (cartCountElement) {
                cartCountElement.textContent = cart.length;
                cartCountElement.style.display = cart.length > 0 ? 'flex' : 'none';
            }
        }

        // Cart event listeners
        cartIconNav.addEventListener('click', toggleCart);
        closeCartButton.addEventListener('click', closeCart);
        cartBackdrop.addEventListener('click', closeCart);

        // Search functionality
        const searchData = [
            { id: 1, title: "HOKKAIDO", category: "T-Shirt", url: "#" },
            { id: 2, title: "DE.ORIGIN", category: "T-Shirt", url: "#" },
            { id: 3, title: "EPISTLE RAP", category: "T-Shirt", url: "#" },
            { id: 4, title: "ODD.OUT", category: "T-Shirt", url: "#" }
        ];

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

        // Show login modal when profile is clicked
        function showLoginModal(event) {
            event.preventDefault();
            document.getElementById('auth-container').classList.remove('hidden');
            dropdownMenu.classList.add('hidden');
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

        // Login system event handlers
        document.getElementById('signup-form').addEventListener('submit', async function(event) {
            event.preventDefault();
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

                // Store user with hashed password
                const hashedPassword = await hashData(password);
                
                const user = {
                    name: name,
                    email: email,
                    password: hashedPassword,
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
        profileOption.addEventListener('click', showLoginModal);
        logoutOption.addEventListener('click', logoutUser);
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
            updateCartCount();
            
            const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser'));
            
            if (rememberedUser) {
                document.getElementById('login-email').value = rememberedUser.email;
                document.getElementById('remember-me').checked = true;
            }
        });

        // Make functions available globally
        window.toggleCart = toggleCart;
        window.closeCart = closeCart;
        window.removeFromCart = removeFromCart;
        window.proceedToCheckout = proceedToCheckout;
