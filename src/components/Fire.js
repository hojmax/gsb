import firebase from 'firebase/app';
import 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBB4VipmvlMioarIOzZ6t5YVjMZtS5weCc",
  authDomain: "whopresseditfirst.firebaseapp.com",
  projectId: "whopresseditfirst",
  storageBucket: "whopresseditfirst.appspot.com",
  messagingSenderId: "770192381932",
  databaseURL: "https://whopresseditfirst-default-rtdb.europe-west1.firebasedatabase.app",
  appId: "1:770192381932:web:e93a8754c60e180a39d2c9"
};

const Fire = firebase.initializeApp(firebaseConfig);
const Database = firebase.database();

export {
  Fire, Database
}