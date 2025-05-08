 <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/11.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/11.7.1/firebase-auth-compat.js"></script>
    
    <script>
        // Your web app's Firebase configuration
        const firebaseConfig = {
 apiKey: "AIzaSyAe5eAhAI5LTYN8yI6uFN5ib-zqK_SEEt0",
    authDomain: "vamorastore-269.firebaseapp.com",
    projectId: "vamorastore-269",
    storageBucket: "vamorastore-269.firebasestorage.app",
    messagingSenderId: "842951797209",
    appId: "1:842951797209:web:afa169d8117ebcf5aad1c8",
    measurementId: "G-K45X0K580Q"
        };

        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        
        // Google Sign-In
        document.getElementById('google-signin-btn').addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            auth.signInWithPopup(provider)
                .then((result) => {
                    // Successful sign-in
                    const user = result.user;
                    console.log('Google sign-in successful', user);
                    // Redirect or do something with the user
                    window.location.href = "index.html"; // Change this to your desired redirect
                })
                .catch((error) => {
                    console.error('Google sign-in error:', error);
                    // Errors are handled silently as requested
                });
        });
