
const firebaseConfig = {
  apiKey: "AIzaSyBKrD4FnVNxhAtcm8vLfNA0xvReYbjQkLY",
  authDomain: "delulu-b5416.firebaseapp.com",
  databaseURL: "https://delulu-b5416-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "delulu-b5416",
  storageBucket: "delulu-b5416.appspot.com",
  messagingSenderId: "758486842158",
  appId: "1:758486842158:web:b423e2ea1e1058f36c18bf"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const goalsRef = db.ref("goals");

document.addEventListener("DOMContentLoaded", () => {
  console.log("🌐 Firebase verbunden, schreibe Testeintrag...");

  const testGoal = {
    text: "🚀 Firebase-Testziel",
    author: "System",
    timeframe: "jetzt",
    done: false,
    comments: [],
    updatedAt: Date.now()
  };

  goalsRef.push(testGoal);

  goalsRef.once("value", (snapshot) => {
    console.log("📥 Daten geladen:", snapshot.val());
  });
});
