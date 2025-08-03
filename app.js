
function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString("de-CH") + " " + d.toLocaleTimeString("de-CH", {hour: '2-digit', minute: '2-digit'});
}



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
  

function createGoalItem(goal) {
  const li = document.createElement("li");
  if (goal.done) li.classList.add("done");

  const commentHtml = goal.comments ? Object.entries(goal.comments).map(([key, c]) =>
    `<div><strong>${c.name}:</strong> ${c.text}
      <span onclick="deleteComment('${goal.id}', '${key}')" style='cursor:pointer;color:black;margin-left:6px'>✖</span>
    </div>`).join("") : "";

  li.innerHTML = `
    <div class="goal-content">
      <div class="goal-header">
        <div class="goal-text">
          <div style="background:white;color:black;padding:4px 8px;border-radius:8px 8px 8px 0;max-width:fit-content;font-size:0.75rem;">
            📅 <span>${formatDate(goal.updatedAt)}</span>
          </div>
          <input type="checkbox" ${goal.done ? "checked" : ""} onchange="toggleDone('${goal.id}', ${goal.done})" />
          <strong>${goal.text}</strong>
        </div>
        <small>${goal.author} – ${goal.timeframe}
          <button onclick="deleteGoal('${goal.id}')" style='float:right;color:red;background:none;border:none;font-size:16px;'>🗑</button>
          
        </small>
      </div>
      <div class="goal-controls">
        <input type="text" placeholder="Kommentieren…" onkeypress="if(event.key==='Enter'){addComment('${goal.id}', this.value); this.value=''}" />
      </div>
      <div class="comment-section">
        ${commentHtml}
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


function deleteGoal(id) {
  if (confirm("Willst du dieses Ziel wirklich löschen?")) {
    goalsRef.child(id).remove();
  }
}
}


function deleteComment(goalId, commentKey) {
  if (confirm("Willst du diesen Kommentar wirklich löschen?")) {
    goalsRef.child(goalId).child("comments").child(commentKey).remove();
  }
}

}
