 <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    
    <script>
        // Your web app's Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCPp3K-VPzT9PjhCaMGjgI-OQsASZaADJQ",
            authDomain: "orderpage-cf139.firebaseapp.com",
            projectId: "orderpage-cf139",
            storageBucket: "orderpage-cf139.appspot.com",
            messagingSenderId: "242626860827",
            appId: "1:242626860827:web:92d1d0b75630bc937c65be",
            measurementId: "G-XRGTFCR75L"
        };

        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        
        // Google Sign-In
        document.getElementById('googleLogin').addEventListener('click', () => {
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
