type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        
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
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        auth.languageCode = 'en';
        const provider = new GoogleAuthProvider();

        const googleLogin = document.getElementById("googleLogin"); 
        
        googleLogin.addEventListener("click", function() {
            signInWithPopup(auth, provider)
                .then((result) => {
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const user = result.user;
                    console.log(user);
                    window.location.href = "";
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error("Error during Google sign-in:", errorCode, errorMessage);
                    alert("Google sign-in failed: " + errorMessage);
                });
        });
