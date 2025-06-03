// Admin Orders Management Script
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loadingState = document.getElementById('loadingState');
    const unauthorizedState = document.getElementById('unauthorizedState');
    const adminDashboard = document.getElementById('adminDashboard');
    const ordersTableBody = document.getElementById('ordersTableBody');
    const orderDetailsModal = document.getElementById('orderDetailsModal');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchOrders = document.getElementById('searchOrders');
    const statusFilter = document.getElementById('statusFilter');
    const toast = document.getElementById('toast');
    
    // Pagination variables
    let currentPage = 1;
    const ordersPerPage = 10;
    let totalOrders = 0;
    let allOrders = [];
    let filteredOrders = [];
    
    // Admin email (only this email can access)
    const ADMIN_EMAIL = 'vamora.co.in@gmail.com';
    
    // Initialize the page
    initAdminPage();
    
    // Event Listeners
    adminLoginBtn?.addEventListener('click', handleAdminLogin);
    logoutBtn?.addEventListener('click', handleLogout);
    searchOrders?.addEventListener('input', filterOrders);
    statusFilter?.addEventListener('change', filterOrders);
    
    // Pagination event listeners would be added after DOM is populated
    
    // Initialize admin page
    function initAdminPage() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Check if user is admin
                if (user.email === ADMIN_EMAIL) {
                    // User is admin - load orders
                    loadingState.classList.remove('hidden');
                    unauthorizedState.classList.add('hidden');
                    adminDashboard.classList.remove('hidden');
                    
                    try {
                        await loadOrders();
                        setupPagination();
                    } catch (error) {
                        console.error("Error loading orders:", error);
                        showToast("Failed to load orders. Please refresh.", "error");
                    } finally {
                        loadingState.classList.add('hidden');
                    }
                } else {
                    // User is not admin
                    loadingState.classList.add('hidden');
                    unauthorizedState.classList.remove('hidden');
                    adminDashboard.classList.add('hidden');
                }
            } else {
                // No user logged in
                loadingState.classList.add('hidden');
                unauthorizedState.classList.remove('hidden');
                adminDashboard.classList.add('hidden');
            }
        });
    }
    
    // Handle admin login
    function handleAdminLogin() {
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                if (user.email === ADMIN_EMAIL) {
                    showToast("Admin login successful", "success");
                    initAdminPage();
                } else {
                    showToast("Only admin accounts can access this page", "error");
                    auth.signOut();
                }
            })
            .catch((error) => {
                console.error("Login error:", error);
                showToast("Login failed: " + error.message, "error");
            });
    }
    
    // Handle logout
    function handleLogout() {
        auth.signOut()
            .then(() => {
                showToast("Logged out successfully", "success");
            })
            .catch((error) => {
                console.error("Logout error:", error);
                showToast("Logout failed: " + error.message, "error");
            });
    }
    
    // Load orders from Firestore
    async function loadOrders() {
        try {
            const querySnapshot = await db.collection("orders")
                .orderBy("timestamp", "desc")
                .get();
            
            allOrders = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.timestamp?.toDate() || new Date()
                };
            });
            
            totalOrders = allOrders.length;
            filteredOrders = [...allOrders];
            
            renderOrders(currentPage);
        } catch (error) {
            console.error("Error loading orders:", error);
            throw error;
        }
    }
    
    // Filter orders based on search and status
    function filterOrders() {
        const searchTerm = searchOrders.value.toLowerCase();
        const statusFilterValue = statusFilter.value;
        
        filteredOrders = allOrders.filter(order => {
            // Search filter
            const matchesSearch = 
                order.orderId?.toLowerCase().includes(searchTerm) ||
                (order.shippingAddress?.name?.toLowerCase().includes(searchTerm)) ||
                (order.email?.toLowerCase().includes(searchTerm));
            
            // Status filter
            const matchesStatus = statusFilterValue ? 
                order.status === statusFilterValue : true;
            
            return matchesSearch && matchesStatus;
        });
        
        totalOrders = filteredOrders.length;
        currentPage = 1; // Reset to first page when filtering
        renderOrders(currentPage);
        setupPagination();
    }
    
    // Render orders for the current page
    function renderOrders(page) {
        const startIndex = (page - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        const ordersToDisplay = filteredOrders.slice(startIndex, endIndex);
        
        ordersTableBody.innerHTML = '';
        
        if (ordersToDisplay.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No orders found
                    </td>
                </tr>
            `;
            return;
        }
        
        ordersToDisplay.forEach(order => {
            const orderRow = document.createElement('tr');
            orderRow.className = 'order-row hover:bg-gray-50 cursor-pointer';
            orderRow.dataset.orderId = order.id;
            
            // Format date
            const formattedDate = order.date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Calculate total
            const total = order.items.reduce((sum, item) => {
                const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
                return sum + (price * (item.quantity || 1));
            }, 0);
            
            orderRow.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium">${order.orderId || order.id}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm">${order.shippingAddress?.name || 'N/A'}</div>
                    <div class="text-sm text-gray-500">${order.email || ''}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formattedDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${order.items.length} item${order.items.length !== 1 ? 's' : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ₹${total.toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge status-${order.status}">${order.status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3 view-order-btn" data-order-id="${order.id}">
                        View
                    </button>
                </td>
            `;
            
            ordersTableBody.appendChild(orderRow);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-order-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const orderId = btn.dataset.orderId;
                showOrderDetails(orderId);
            });
        });
        
        // Add click event to entire row
        document.querySelectorAll('.order-row').forEach(row => {
            row.addEventListener('click', () => {
                const orderId = row.dataset.orderId;
                showOrderDetails(orderId);
            });
        });
    }
    
    // Show order details modal
    async function showOrderDetails(orderId) {
        const order = filteredOrders.find(o => o.id === orderId);
        if (!order) return;
        
        // Format date
        const formattedDate = order.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Calculate total
        const total = order.items.reduce((sum, item) => {
            const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
            return sum + (price * (item.quantity || 1));
        }, 0);
        
        // Set order information
        document.getElementById('modalOrderId').textContent = order.orderId || order.id;
        document.getElementById('modalOrderDate').textContent = formattedDate;
        document.getElementById('modalOrderStatus').textContent = order.status;
        document.getElementById('modalOrderStatus').className = `status-badge status-${order.status}`;
        document.getElementById('modalPaymentStatus').textContent = order.paymentId ? 'Paid' : 'Pending';
        document.getElementById('modalOrderTotal').textContent = `₹${total.toFixed(2)}`;
        
        // Set customer information
        document.getElementById('modalCustomerName').textContent = order.shippingAddress?.name || 'N/A';
        document.getElementById('modalCustomerEmail').textContent = order.email || 'N/A';
        document.getElementById('modalCustomerEmail').innerHTML = order.email ? 
            `<a href="mailto:${order.email}" class="text-blue-600">${order.email}</a>` : 'N/A';
        document.getElementById('modalCustomerPhone').textContent = order.shippingAddress?.phone || 'N/A';
        document.getElementById('modalCustomerPhone').innerHTML = order.shippingAddress?.phone ? 
            `<a href="tel:${order.shippingAddress.phone}" class="text-blue-600">${order.shippingAddress.phone}</a>` : 'N/A';
        
        // Set shipping address
        const shippingAddress = order.shippingAddress || {};
        document.getElementById('modalShippingAddress').innerHTML = `
            <p>${shippingAddress.addressLine1 || ''}</p>
            ${shippingAddress.addressLine2 ? `<p>${shippingAddress.addressLine2}</p>` : ''}
            <p>${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}</p>
            <p>${shippingAddress.country || ''}</p>
        `;
        
        // Set order items
        const orderItemsContainer = document.getElementById('modalOrderItems');
        orderItemsContainer.innerHTML = '';
        
        order.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex items-start border-b pb-3';
            
            const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
            const itemTotal = price * (item.quantity || 1);
            
            itemElement.innerHTML = `
                <img src="${item.image || 'https://via.placeholder.com/50'}" 
                     alt="${item.title}" 
                     class="w-16 h-16 object-cover rounded mr-3">
                <div class="flex-1">
                    <p class="font-medium">${item.title}</p>
                    <p class="text-sm text-gray-600">Size: ${item.size || 'N/A'}</p>
                    <p class="text-sm text-gray-600">Qty: ${item.quantity || 1}</p>
                </div>
                <div class="font-medium">₹${itemTotal.toFixed(2)}</div>
            `;
            
            orderItemsContainer.appendChild(itemElement);
        });
        
        // Set status update select
        document.getElementById('statusUpdateSelect').value = order.status;
        
        // Set up action buttons
        document.getElementById('updateStatusBtn').onclick = () => updateOrderStatus(orderId);
        document.getElementById('cancelOrderBtn').onclick = () => cancelOrder(orderId);
        document.getElementById('deleteOrderBtn').onclick = () => deleteOrder(orderId);
        
        // Show/hide cancel button based on current status
        const cancelBtn = document.getElementById('cancelOrderBtn');
        if (order.status === 'cancelled' || order.status === 'refunded' || order.status === 'delivered') {
            cancelBtn.classList.add('hidden');
        } else {
            cancelBtn.classList.remove('hidden');
        }
        
        // Set up modal close button
        document.getElementById('closeOrderDetails').onclick = () => {
            orderDetailsModal.classList.add('hidden');
        };
        
        // Show modal
        orderDetailsModal.classList.remove('hidden');
    }
    
    // Update order status
    async function updateOrderStatus(orderId) {
        const newStatus = document.getElementById('statusUpdateSelect').value;
        const orderRef = db.collection("orders").doc(orderId);
        
        try {
            await orderRef.update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update local data
            const orderIndex = allOrders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                allOrders[orderIndex].status = newStatus;
            }
            
            // Update filtered orders if needed
            const filteredIndex = filteredOrders.findIndex(o => o.id === orderId);
            if (filteredIndex !== -1) {
                filteredOrders[filteredIndex].status = newStatus;
            }
            
            showToast("Order status updated successfully", "success");
            renderOrders(currentPage);
            orderDetailsModal.classList.add('hidden');
        } catch (error) {
            console.error("Error updating order status:", error);
            showToast("Failed to update order status", "error");
        }
    }
    
    // Cancel order
    async function cancelOrder(orderId) {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        
        const orderRef = db.collection("orders").doc(orderId);
        
        try {
            await orderRef.update({
                status: 'cancelled',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update local data
            const orderIndex = allOrders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                allOrders[orderIndex].status = 'cancelled';
            }
            
            // Update filtered orders if needed
            const filteredIndex = filteredOrders.findIndex(o => o.id === orderId);
            if (filteredIndex !== -1) {
                filteredOrders[filteredIndex].status = 'cancelled';
            }
            
            showToast("Order cancelled successfully", "success");
            renderOrders(currentPage);
            orderDetailsModal.classList.add('hidden');
        } catch (error) {
            console.error("Error cancelling order:", error);
            showToast("Failed to cancel order", "error");
        }
    }
    
    // Delete order
    async function deleteOrder(orderId) {
        if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
        
        const orderRef = db.collection("orders").doc(orderId);
        
        try {
            await orderRef.delete();
            
            // Update local data
            allOrders = allOrders.filter(o => o.id !== orderId);
            filteredOrders = filteredOrders.filter(o => o.id !== orderId);
            totalOrders = filteredOrders.length;
            
            // Adjust current page if needed
            if (currentPage > Math.ceil(totalOrders / ordersPerPage)) {
                currentPage = Math.max(1, currentPage - 1);
            }
            
            showToast("Order deleted successfully", "success");
            renderOrders(currentPage);
            orderDetailsModal.classList.add('hidden');
            setupPagination();
        } catch (error) {
            console.error("Error deleting order:", error);
            showToast("Failed to delete order", "error");
        }
    }
    
    // Setup pagination
    function setupPagination() {
        const totalPages = Math.ceil(totalOrders / ordersPerPage);
        const pageNumbersContainer = document.getElementById('pageNumbers');
        const paginationInfo = document.getElementById('paginationInfo');
        
        // Update pagination info
        const startOrder = (currentPage - 1) * ordersPerPage + 1;
        const endOrder = Math.min(currentPage * ordersPerPage, totalOrders);
        paginationInfo.innerHTML = `
            Showing <span class="font-medium">${startOrder}</span> to 
            <span class="font-medium">${endOrder}</span> of 
            <span class="font-medium">${totalOrders}</span> results
        `;
        
        // Clear existing page numbers
        pageNumbersContainer.innerHTML = '';
        
        // Add page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                i === currentPage 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderOrders(currentPage);
                setupPagination();
            });
            pageNumbersContainer.appendChild(pageBtn);
        }
        
        // Previous button
        document.getElementById('prevPage').onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderOrders(currentPage);
                setupPagination();
            }
        };
        
        document.getElementById('prevPageMobile').onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderOrders(currentPage);
                setupPagination();
            }
        };
        
        // Next button
        document.getElementById('nextPage').onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderOrders(currentPage);
                setupPagination();
            }
        };
        
        document.getElementById('nextPageMobile').onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderOrders(currentPage);
                setupPagination();
            }
        };
        
        // Disable previous/next buttons when appropriate
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('prevPageMobile').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
        document.getElementById('nextPageMobile').disabled = currentPage === totalPages;
    }
    
    // Show toast notification
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === orderDetailsModal) {
            orderDetailsModal.classList.add('hidden');
        }
    });
});
