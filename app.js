
let currentUser = "";

// Benutzer speichern/laden
function setUsername(name) {
  currentUser = name;
  localStorage.setItem("deluluUser", name);
}

function getUsername() {
  return localStorage.getItem("deluluUser") || "";
}

// Firebase
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

let goalsList = [];

window.addEventListener("DOMContentLoaded", () => {
  const saved = getUsername();
  if (saved) {
    currentUser = saved;
    const userSelect = document.getElementById("username");
    if (userSelect) userSelect.value = saved;
  }

  document.getElementById("username").addEventListener("change", (e) => {
    setUsername(e.target.value);
  });

  goalsRef.on("value", (snapshot) => {
    const data = snapshot.val() || {};
    goalsList = Object.entries(data).map(([id, goal]) => ({ id, ...goal }));
    renderGoals();
  });
});

function addItem() {
  const text = document.getElementById("itemText").value.trim();
  const timeframe = document.getElementById("itemTimeframe").value;
  const author = getUsername();
  if (!author) return alert("Bitte Benutzer wählen!");
  if (text.length < 3) return alert("Bitte ein Ziel eingeben.");

  const newGoal = {
    text,
    author,
    timeframe,
    comments: [],
    done: false,
    updatedAt: Date.now()
  };
  goalsRef.push(newGoal);
  document.getElementById("itemText").value = "";
}

function toggleDone(id, current) {
  goalsRef.child(id).update({
    done: !current,
    updatedAt: Date.now()
  });
}

function addComment(id, text) {
  if (!text) return;
  const name = getUsername();
  goalsRef.child(id).child("comments").push({
    text,
    name,
    time: Date.now()
  });
}

function renderGoals() {
  const list = document.getElementById("bucketList");
  const recent = document.getElementById("recentChanges");
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const sort = document.getElementById("sortType")?.value || "timeframe";

  list.innerHTML = "";
  recent.innerHTML = "";

  let filtered = goalsList.filter(goal => {
    const textMatch = goal.text?.toLowerCase().includes(search);
    return textMatch;
  });

  filtered.forEach(g => {
    g.updatedAt = g.updatedAt || 0;
    g.timeframe = g.timeframe || "zukunft";
    g.author = g.author || "unbekannt";
    g.text = g.text || "";
  });

  const now = Date.now();
  const recentGoals = filtered.filter(g => now - g.updatedAt < 7 * 24 * 60 * 60 * 1000);
  const otherGoals = filtered.filter(g => now - g.updatedAt >= 7 * 24 * 60 * 60 * 1000);

  const timeframeOrder = { jetzt: 1, jahr: 2, zukunft: 3 };
  const sorter = {
    timeframe: (a, b) => (timeframeOrder[a.timeframe] || 99) - (timeframeOrder[b.timeframe] || 99),
    author: (a, b) => a.author.localeCompare(b.author),
    text: (a, b) => a.text.localeCompare(b.text)
  };

  recentGoals.sort(sorter[sort]);
  otherGoals.sort(sorter[sort]);

  recentGoals.forEach(goal => recent.appendChild(createGoalItem(goal)));
  otherGoals.forEach(goal => list.appendChild(createGoalItem(goal)));

  updateProgress(filtered);
}

function createGoalItem(goal) {
  const li = document.createElement("li");
  if (goal.done) li.classList.add("done");

  li.innerHTML = `
    <div class="goal-content">
      <div class="goal-header">
        <div class="goal-text">
          <input type="checkbox" ${goal.done ? "checked" : ""} onchange="toggleDone('${goal.id}', ${goal.done})" />
          <strong>${goal.text}</strong>
        </div>
        <small>${goal.author} – ${goal.timeframe}</small>
      </div>
      <div class="goal-controls">
        <input type="text" placeholder="Kommentieren…" onkeypress="if(event.key==='Enter'){addComment('${goal.id}', this.value); this.value=''}" />
      </div>
      <div class="comment-section">
        ${goal.comments ? Object.values(goal.comments).map(c =>
          `<div><strong>${c.name}:</strong> ${c.text}</div>`).join("") : ""}
      </div>
    </div>
  `;
  return li;
}

function updateProgress(goals) {
  if (!goals.length) {
    document.getElementById("progressBar").textContent = "Fortschritt: 0%";
    return;
  }
  const done = goals.filter(g => g.done).length;
  const percent = Math.round((done / goals.length) * 100);
  document.getElementById("progressBar").textContent = `Fortschritt: ${percent}%`;
}
