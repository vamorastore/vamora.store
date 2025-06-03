 // Firebase Initialization
        const firebaseConfig = {
            apiKey: "AIzaSyBkMUmD27GU34yIPQAj7KUErt9muB0MdLk",
            authDomain: "vamora-co-in.firebaseapp.com",
            projectId: "vamora-co-in",
            storageBucket: "vamora-co-in.appspot.com",
            messagingSenderId: "613048727757",
            appId: "1:613048727757:web:d0c73e84fa7d93a5c21184",
            measurementId: "G-8R6TDRQGS6"
        };

        try {
            firebase.initializeApp(firebaseConfig);
        } catch (error) {
            console.error("Firebase initialization error:", error);
        }

        const auth = firebase.auth();
        const db = firebase.firestore();
        let authModal = null;

        // Main Auth State Handler
        auth.onAuthStateChanged(async user => {
            // Always close modal first (if open)
            closeAuthModal();
            
            if (!user) {
                // Hide dashboard content
                document.getElementById('navBar').classList.add('hidden');
                document.getElementById('mainContent').classList.add('hidden');
                // Show sign-in modal
                showGoogleSignIn();
                return;
            }
            
            // Verify Google authentication
            const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
            if (!isGoogleUser) {
                handleUnauthorized("Please sign in with Google");
                return;
            }
            
            try {
                // Check admin status
                const hasAccess = user.email === 'vamora.co.in@gmail.com' || 
                                await checkAdminStatus(user.uid);
                
                if (hasAccess) {
                    // Show dashboard content
                    document.getElementById('navBar').classList.remove('hidden');
                    document.getElementById('mainContent').classList.remove('hidden');
                    initializePage();
                    loadSubmissions('all');
                } else {
                    handleUnauthorized("You don't have admin privileges");
                }
            } catch (error) {
                console.error("Auth verification failed:", error);
                handleUnauthorized("Error verifying access");
            }
        });

        // Admin Verification
async function checkAdminStatus(uid) {
    try {
        const user = auth.currentUser;
        console.log("Checking admin status for:", user.email, uid);
        
        if (user.email === 'vamora.co.in@gmail.com') {
            console.log("Primary admin detected");
            return true;
        }
        
        const doc = await db.collection('admins').doc(uid).get();
        console.log("Admin document exists:", doc.exists);
        return doc.exists;
    } catch (error) {
        console.error("Admin check error:", error);
        return false;
    }
}        // Enhanced unauthorized handler
        function handleUnauthorized(message) {
            showError(message);
            
            // Show sign-in modal again if not already shown
            if (!authModal) {
                showGoogleSignIn();
            }
            
            // Sign out after delay
            setTimeout(() => {
                auth.signOut().catch(error => {
                    console.error("Sign out error:", error);
                });
            }, 3000);
        }

        // Google Sign-In function
        function showGoogleSignIn() {
            if (authModal) return; // Already showing
            
            authModal = document.createElement('div');
            authModal.className = 'auth-modal';
            authModal.innerHTML = `
                <div class="auth-modal-content">
                    <h2 class="text-xl font-bold mb-2">Admin Login Required</h2>
                    <p class="mb-4">Restricted Access: Admin Login</p>
                    <button id="googleSignInBtn" class="google-signin-btn">
                        <i class="fab fa-google"></i> Sign in with Google
                    </button>
                    <div id="authError" class="auth-error hidden mt-4"></div>
                </div>
            `;
            
            document.body.appendChild(authModal);

            // Enhanced sign-in handler
            document.getElementById('googleSignInBtn').addEventListener('click', async () => {
                const btn = document.getElementById('googleSignInBtn');
                const errorEl = document.getElementById('authError');
                btn.disabled = true;
                btn.innerHTML = '<span class="loading-spinner"></span> Signing in...';
                errorEl.classList.add('hidden');
                
                try {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    await auth.signInWithPopup(provider);
                    // Success - auth state handler will take over
                } catch (error) {
                    errorEl.textContent = error.message;
                    errorEl.classList.remove('hidden');
                    btn.innerHTML = '<i class="fab fa-google"></i> Try Again';
                    btn.disabled = false;
                }
            });
            
            // Modal close handlers
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) closeAuthModal();
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeAuthModal();
            });
        }

        // Clean modal close function
        function closeAuthModal() {
            if (authModal) {
                authModal.classList.add('fade-out');
                setTimeout(() => {
                    authModal.remove();
                    authModal = null;
                }, 300);
            }
        }

        // Initialize page components and event listeners
        function initializePage() {
            // Filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.filter-btn').forEach(b => 
                        b.classList.remove('active'));
                    btn.classList.add('active');
                    loadSubmissions(btn.dataset.filter);
                });
            });
            
            // Search functionality
            document.getElementById('searchInput').addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                document.querySelectorAll('.submission-card').forEach(card => {
                    card.style.display = card.textContent.toLowerCase().includes(term) 
                        ? 'block' 
                        : 'none';
                });
            });

            // Logout button
            document.getElementById('logoutBtn').addEventListener('click', () => {
                auth.signOut().catch(error => {
                    showError("Logout failed: " + error.message);
                });
            });

            // Event delegation for dynamic buttons
document.getElementById('submissionsList').addEventListener('click', async (e) => {
    const target = e.target.closest('.mark-read, .delete');
    if (!target) return;
    
    const id = target.dataset.id;
    const card = target.closest('.submission-card');
    
    try {
        // Add click effect
        target.style.transform = 'scale(0.95)';
        setTimeout(() => { target.style.transform = ''; }, 200);
        
        if (target.classList.contains('mark-read')) {
            await db.collection('contactSubmissions').doc(id).update({ status: 'read' });
            card.querySelector('.status-badge').className = 'status-badge status-read';
            card.querySelector('.status-badge').textContent = 'read';
            target.remove();
        } 
        else if (target.classList.contains('delete')) {
            if (confirm('Are you sure you want to delete this submission?')) {
                await db.collection('contactSubmissions').doc(id).delete();
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 300);
            }
        }
        
        // Update the active filter view
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        if (activeFilter !== 'all') {
            if (target.classList.contains('delete')) {
                // If deleted, no need to check filter
            } else if (activeFilter !== 'read' && target.classList.contains('mark-read')) {
                card.style.display = 'none';
            }
        }
    } catch (error) {
        if (error.code === 'permission-denied') {
            showError("You don't have permission to perform this action");
        } else {
            showError(`Operation failed: ${error.message}`);
        }
    }
});        }

        // Submission Loading
        async function loadSubmissions(filter) {
            try {
                document.getElementById('loadingIndicator').classList.remove('hidden');
                document.getElementById('noResults').classList.add('hidden');
                
                let query = db.collection('contactSubmissions').orderBy('timestamp', 'desc');
                if (filter !== 'all') query = query.where('status', '==', filter);
                
                const snapshot = await query.get();
                
                if (snapshot.empty) {
                    document.getElementById('noResults').classList.remove('hidden');
                    document.getElementById('submissionsList').innerHTML = '';
                } else {
                    let html = '';
                    snapshot.forEach(doc => {
                        html += createSubmissionCard(doc.id, doc.data());
                    });
                    document.getElementById('submissionsList').innerHTML = html;
                }
            } catch (error) {
                showError("Failed to load submissions: " + error.message);
            } finally {
                document.getElementById('loadingIndicator').classList.add('hidden');
            }
        }

        // Card Creation
        function createSubmissionCard(id, data) {
            const date = data.timestamp?.toDate() || new Date();
            return `
                <div class="submission-card" data-id="${id}">
                    <div class="submission-header">
                        <div class="user-info">
                            <h3>${escapeHtml(data.name || 'No name')}</h3>
                            <p>${escapeHtml(data.email || 'No email')}</p>
                        </div>
                        <div class="meta-info">
                            <span class="status-badge ${data.status || 'new'}">
                                ${data.status || 'new'}
                            </span>
                            <span>${date.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="submission-message">
                        ${escapeHtml(data.message || 'No message')}
                    </div>
                    <div class="submission-actions">
                        ${data.status !== 'read' ? `
                            <button class="btn mark-read" data-id="${id}">
                                <i class="fas fa-check"></i> Mark Read
                            </button>
                        ` : ''}
                        <button class="btn delete" data-id="${id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }

        // Helper Functions
        function escapeHtml(unsafe) {
            return unsafe.replace(/[&<"'>]/g, m => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                '"': '&quot;', "'": '&#039;'
            }[m]));
        }

        function showError(message) {
            const el = document.getElementById('errorContainer');
            el.innerHTML = `<div class="error-message">${message}</div>`;
            el.classList.remove('hidden');
            setTimeout(() => {
                el.classList.add('hidden');
            }, 5000);
        }
