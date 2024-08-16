// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: process.env.FIREBASE,
	authDomain: "jek-bot.firebaseapp.com",
	projectId: "jek-bot",
	storageBucket: "jek-bot.appspot.com",
	messagingSenderId: "908480037857",
	appId: "1:908480037857:web:e9eb5d3b84d0105f4948a0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export function that initializes Firebase
export const initFirebase = () => {
	return app;
};
