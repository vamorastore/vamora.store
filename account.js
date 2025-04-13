<!-- Account Info Page (hidden by default) -->
    <div id="account-info-page" class="hidden fixed inset-0 bg-white z-50 overflow-y-auto pt-20">
        <div class="max-w-4xl mx-auto p-6">
            <div class="bg-white p-6 rounded-lg shadow-md relative">
                <button class="absolute top-4 right-4 text-gray-500 hover:text-gray-700" id="closeAccountInfoPage">
                    <i class="fas fa-times"></i>
                </button>
                <h2 class="text-2xl font-bold mb-4">Account Information</h2>
                <div class="mb-4">
                    <div class="flex items-center mb-2">
                        <span class="font-semibold">Name</span>
                        <i class="fas fa-pen text-blue-500 ml-2 cursor-pointer" id="editProfileIcon"></i>
                    </div>
                    <p id="displayName"></p>
                </div>
                <div class="mb-4">
                    <span class="font-semibold">Email</span>
                    <p id="displayEmail"></p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold">Address</span>
                        <a href="#" class="text-blue-500" id="addAddressLink" style="display: none;">
                            <i class="fas fa-plus-circle"></i> Add
                        </a>
                    </div>
                    <div id="addressContainer" class="bg-gray-100 p-4 rounded-lg min-h-[200px] flex flex-col items-center justify-center">
                        <div class="text-center text-gray-500">
                            <i class="fas fa-map-marker-alt text-3xl mb-3"></i>
                            <p class="text-lg">No addresses saved yet</p>
                            <p class="text-sm mt-2">Your saved addresses will appear here</p>
                        </div>
                    </div>
                </div>
                
                <!-- Orders Section -->
                <div class="bg-white p-4 rounded-lg shadow-md mt-4">
                    <h3 class="text-xl font-bold mb-4">Your Orders</h3>
                    <div id="ordersContainer">
                        <!-- Orders will be displayed here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Profile Modal -->
    <div id="editProfileModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 font-unbounded">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Edit Profile</h3>
                <button id="closeEditProfileModal" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 mb-2">Name</label>
                <input type="text" id="nameInput" class="w-full px-3 py-2 border rounded">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 mb-2">Email</label>
                <input type="email" id="emailDisplay" class="w-full px-3 py-2 border rounded" readonly>
            </div>
            <button id="saveProfileBtn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                <i class="fas fa-save mr-2"></i> Save Changes
            </button>
        </div>
    </div>

    <!-- Enhanced Add Address Modal -->
    <div id="addAddressModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto font-unbounded">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Edit Address</h3>
                <button id="closeAddAddressModal" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="addressForm" class="space-y-4">
                <!-- Full Name -->
                <div>
                    <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                    <input type="text" id="fullName" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- Phone Number -->
                <div>
                    <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                    <input type="tel" id="phoneNumber" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- Address Line 1 -->
                <div>
                    <label for="addressLine1" class="block text-sm font-medium text-gray-700 mb-1">Address Line 1* (Street address, P.O. box)</label>
                    <input type="text" id="addressLine1" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- Address Line 2 -->
                <div>
                    <label for="addressLine2" class="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Apartment, suite, unit, building, floor, etc.)</label>
                    <input type="text" id="addressLine2" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- City -->
                <div>
                    <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City*</label>
                    <input type="text" id="city" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- State/District -->
                <div>
                    <label for="state" class="block text-sm font-medium text-gray-700 mb-1">State/District*</label>
                    <input type="text" id="state" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- Postal/Zip Code -->
                <div>
                    <label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1">Postal/Zip Code*</label>
                    <input type="text" id="postalCode" required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- Country -->
                <div>
                    <label for="country" class="block text-sm font-medium text-gray-700 mb-1">Country*</label>
                    <select id="country" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Country</option>
                        <option value="India">India</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <!-- Address Type -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                    <div class="flex space-x-4">
                        <label class="inline-flex items-center">
                            <input type="radio" name="addressType" value="home" checked 
                                   class="form-radio h-4 w-4 text-blue-600">
                            <span class="ml-2">Home</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="radio" name="addressType" value="work" 
                                   class="form-radio h-4 w-4 text-blue-600">
                            <span class="ml-2">Work</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="radio" name="addressType" value="other" 
                                   class="form-radio h-4 w-4 text-blue-600">
                            <span class="ml-2">Other</span>
                        </label>
                    </div>
                </div>
                
                <!-- Set as Default -->
                <div class="flex items-center">
                    <input type="checkbox" id="setAsDefault" 
                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label for="setAsDefault" class="ml-2 block text-sm text-gray-700">
                        Set as default address
                    </label>
                </div>
                
                <!-- Form Actions -->
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" id="cancelAddressBtn" 
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        <i class="fas fa-times mr-2"></i> Cancel
                    </button>
                    <button type="submit" id="saveAddressBtn" 
                            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        <i class="fas fa-save mr-2"></i> Save Address
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Login/Signup Modal -->
    <div id="auth-container" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white shadow-lg rounded-lg flex flex-col w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button id="close-auth-container" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors" onclick="hideAuthContainer()">
                <i class="fas fa-times"></i>
            </button>
            <div id="login-section" class="w-full p-6 sm:p-8 auth-section">
                <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Log In</h2>
                <form id="login-form">
                    <div class="mb-4">
                        <label for="login-email" class="block text-gray-700 mb-2 text-sm sm:text-base">Email</label>
                        <input type="email" id="login-email" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="Enter your email" required>
                    </div>
                    <div class="mb-4 password-container">
                        <label for="login-password" class="block text-gray-700 mb-2 text-sm sm:text-base">Password</label>
                        <input type="password" id="login-password" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 password-input text-sm sm:text-base" placeholder="Enter your password" required>
                        <button type="button" class="password-toggle" id="toggle-login-password">
                            <i class="far fa-eye"></i>
                        </button>
                    </div>
                    <div class="mb-4 flex items-center justify-between">
                        <label class="inline-flex items-center">
                            <input type="checkbox" id="remember-me" class="form-checkbox text-blue-500 h-4 w-4">
                            <span class="ml-2 text-gray-700 text-sm sm:text-base">Remember me</span>
                        </label>
                        <a href="#" id="forgot-password-link" class="text-blue-500 hover:underline transition-colors text-sm sm:text-base">Forgot password?</a>
                    </div>
                    <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex justify-center items-center text-sm sm:text-base" id="login-submit-button">
                        <span id="login-button-text">Log In</span>
                    </button>
                </form>
                <p id="login-error" class="text-red-500 mt-4 text-center hidden text-sm sm:text-base">Invalid email or password. Please try again.</p>
                <p id="login-success" class="text-green-500 mt-4 text-center hidden text-sm sm:text-base">Login successful!</p>
                <div class="mt-4 sm:mt-6 text-center">
                    <p class="text-gray-700 text-sm sm:text-base">Don't have an account? <a href="#" class="text-blue-500 hover:underline transition-colors" id="show-signup">Sign Up</a></p>
                </div>
            </div>
            <div id="signup-section" class="w-full p-6 sm:p-8 bg-gray-50 hidden auth-section">
                <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Sign Up</h2>
                <form id="signup-form">
                    <div class="mb-4">
                        <label for="signup-name" class="block text-gray-700 mb-2 text-sm sm:text-base">Name</label>
                        <input type="text" id="signup-name" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="Enter your name" required minlength="2" maxlength="50">
                        <p id="name-error" class="text-red-500 mt-2 hidden text-sm sm:text-base">Name must be 2-50 characters long.</p>
                    </div>
                    <div class="mb-4">
                        <label for="signup-email" class="block text-gray-700 mb-2 text-sm sm:text-base">Email</label>
                        <input type="email" id="signup-email" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="Enter your email" required>
                        <p id="email-error" class="text-red-500 mt-2 hidden text-sm sm:text-base">Please enter a valid email address.</p>
                        <p id="email-exists-error" class="text-red-500 mt-2 hidden text-sm sm:text-base">Email already exists. Please use a different email.</p>
                    </div>
                    <div class="mb-4 password-container">
                        <label for="signup-password" class="block text-gray-700 mb-2 text-sm sm:text-base">Password</label>
                        <input type="password" id="signup-password" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 password-input text-sm sm:text-base" placeholder="Enter your password" minlength="8" required>
                        <button type="button" class="password-toggle" id="toggle-signup-password">
                            <i class="far fa-eye"></i>
                        </button>
                        <p class="text-gray-500 text-xs mt-1">Must be at least 8 characters with uppercase, number, and special character.</p>
                    </div>
                    <div class="mb-4 password-container">
                        <label for="signup-confirm-password" class="block text-gray-700 mb-2 text-sm sm:text-base">Confirm Password</label>
                        <input type="password" id="signup-confirm-password" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 password-input text-sm sm:text-base" placeholder="Confirm your password" minlength="8" required>
                        <button type="button" class="password-toggle" id="toggle-signup-confirm-password">
                            <i class="far fa-eye"></i>
                        </button>
                        <p id="password-mismatch-error" class="text-red-500 mt-2 hidden text-sm sm:text-base">Passwords do not match.</p>
                    </div>
                    <div class="mb-4">
                        <label for="security-question" class="block text-gray-700 mb-2 text-sm sm:text-base">Security Question</label>
                        <select id="security-question" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" required>
                            <option value="">Select a security question</option>
                            <option value="pet">What is the name of your first pet?</option>
                            <option value="school">What is the name of your elementary school?</option>
                            <option value="city">In what city were you born?</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label for="security-answer" class="block text-gray-700 mb-2 text-sm sm:text-base">Answer</label>
                        <input type="text" id="security-answer" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="Enter your answer" required minlength="2">
                    </div>
                    <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex justify-center items-center text-sm sm:text-base" id="signup-submit-button">
                        <span id="signup-button-text">Sign Up</span>
                    </button>
                </form>
                <p id="signup-error" class="text-red-500 mt-4 text-center hidden text-sm sm:text-base">Please fill all fields correctly.</p>
                <p id="verify-email-success" class="text-green-500 mt-4 text-center hidden text-sm sm:text-base">Sign up successful! You can now log in.</p>
                <div class="mt-4 sm:mt-6 text-center">
                    <p class="text-gray-700 text-sm sm:text-base">Already have an account? <a href="#" class="text-blue-500 hover:underline transition-colors" id="show-login">Log In</a></p>
                </div>
            </div>
        </div>
    </div>

    <!-- Forgot Password Modal -->
    <div id="forgot-password-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md relative mx-4 max-h-[90vh] overflow-y-auto">
            <button id="close-forgot-password" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors">
                <i class="fas fa-times"></i>
            </button>
            <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Forgot Password</h2>
            <form id="forgot-password-form">
                <div class="mb-4">
                    <label for="forgot-email" class="block text-gray-700 mb-2 text-sm sm:text-base">Registered Email</label>
                    <input type="email" id="forgot-email" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="Enter your registered email" required>
                </div>
                <div class="mb-4">
                    <label for="forgot-security-question" class="block text-gray-700 mb-2 text-sm sm:text-base">Security Question</label>
                    <select id="forgot-security-question" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" required>
                        <option value="">Select a security question</option>
                        <option value="pet">What is the name of your first pet?</option>
                        <option value="school">What is the name of your elementary school?</option>
                        <option value="city">In what city were you born?</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label for="forgot-security-answer" class="block text-gray-700 mb-2 text-sm sm:text-base">Answer</label>
                    <input type="text" id="forgot-security-answer" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="Enter your answer" required>
                </div>
                <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex justify-center items-center text-sm sm:text-base" id="forgot-submit-button">
                    <span id="forgot-button-text">Submit</span>
                </button>
            </form>
            <p id="forgot-error" class="text-red-500 mt-4 text-center hidden text-sm sm:text-base">The information provided doesn't match our records.</p>
            <div id="reset-password-section" class="hidden">
                <div class="mb-4 mt-6 password-container">
                    <label for="new-password" class="block text-gray-700 mb-2 text-sm sm:text-base">New Password</label>
                    <input type="password" id="new-password" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 password-input text-sm sm:text-base" placeholder="Enter new password" minlength="8" required>
                    <button type="button" class="password-toggle" id="toggle-new-password">
                        <i class="far fa-eye"></i>
                    </button>
                    <p class="text-gray-500 text-xs mt-1">Must be at least 8 characters with uppercase, number, and special character.</p>
                </div>
                <div class="mb-4 password-container">
                    <label for="confirm-new-password" class="block text-gray-700 mb-2 text-sm sm:text-base">Confirm New Password</label>
                    <input type="password" id="confirm-new-password" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 password-input text-sm sm:text-base" placeholder="Confirm new password" minlength="8" required>
                    <button type="button" class="password-toggle" id="toggle-confirm-new-password">
                        <i class="far fa-eye"></i>
                    </button>
                    <p id="reset-password-mismatch" class="text-red-500 mt-2 hidden text-sm sm:text-base">Passwords do not match.</p>
                </div>
                <button id="save-new-password" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex justify-center items-center text-sm sm:text-base">
                    <span id="save-password-button-text">Save Changes</span>
                </button>
                <p id="reset-success" class="text-green-500 mt-4 text-center hidden text-sm sm:text-base">Password reset successful! You can now log in with your new password.</p>
            </div>
        </div>
    </div>
