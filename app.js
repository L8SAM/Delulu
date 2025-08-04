
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
let lastVisit = parseInt(localStorage.getItem("lastVisit") || "0");

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("deluluUser");
  if (saved) document.getElementById("username").value = saved;
  document.getElementById("username").addEventListener("change", e =>
    localStorage.setItem("deluluUser", e.target.value)
  );

  goalsRef.on("value", snapshot => {
    const data = snapshot.val() || {};
    goalsList = Object.entries(data).map(([id, goal]) => ({ id, ...goal }));
    renderGoals();
    localStorage.setItem("lastVisit", Date.now());
  });
});

function addItem() {
  const text = document.getElementById("itemText").value.trim();
  const timeframe = document.getElementById("itemTimeframe").value;
  const author = document.getElementById("username").value;
  if (!text || !author) return;
  const newGoal = {
    text, author, timeframe,
    comments: {}, done: false,
    updatedAt: Date.now()
  };
  goalsRef.push(newGoal);
  document.getElementById("itemText").value = "";
}

function toggleDone(id, current) {
  goalsRef.child(id).update({ done: !current, updatedAt: Date.now() });
}

function addComment(id, text) {
  if (!text) return;
  const author = document.getElementById("username").value;
  goalsRef.child(id).child("comments").push({ text, name: author, time: Date.now() });
}

function deleteComment(goalId, commentKey) {
  if (confirm("Kommentar löschen?")) {
    db.ref("goals/" + goalId + "/comments/" + commentKey).remove();
  }
}

function deleteGoal(id) {
  if (confirm("Ziel löschen?")) {
    db.ref("goals/" + id).remove();
  }
}

function renderGoals() {
  renderNewsItems(goalsList);

  const list = document.getElementById("bucketList");
  const doneList = document.getElementById("doneList");
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";

  list.innerHTML = "";
  doneList.innerHTML = "";

  const filtered = goalsList.filter(goal => (goal.text || "").toLowerCase().includes(search));
  const sortedGoals = filtered.filter(g => !g.done).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const doneGoals = filtered.filter(g => g.done);

  sortedGoals.forEach(g => list.appendChild(createGoalItem(g)));
  doneGoals.forEach(g => doneList.appendChild(createGoalItem(g)));

  const doneCount = filtered.filter(g => g.done).length;
  const percent = filtered.length ? Math.round((doneCount / filtered.length) * 100) : 0;
  document.getElementById("progressBar").textContent = `Fortschritt: ${percent}%`;
}

function createGoalItem(goal) {
  const li = document.createElement("li");
  if (goal.done) li.classList.add("done");

  const comments = goal.comments || {};
  const commentHtml = Object.entries(comments).map(([key, c]) =>
    `<div><strong>${c.name}:</strong> ${c.text}
      ${c.time > lastVisit ? '<span style="color:blue;margin-left:4px;">💬</span>' : ''}
      <span onclick="deleteComment('${goal.id}', '${key}')" style='cursor:pointer;color:black;margin-left:6px'>✖</span>
    </div>`).join("");

  const isNew = goal.updatedAt > lastVisit;

  li.innerHTML = `
    <div class="goal-content">
      <div class="goal-header">
        <div class="goal-text">
          <input type="checkbox" ${goal.done ? "checked" : ""} onchange="toggleDone('${goal.id}', ${goal.done})" />
          <strong>${goal.text || ""}</strong> ${isNew ? "🆕" : ""}
        </div>
        <small>${goal.author || ""} – ${goal.timeframe || ""}
          <button onclick="deleteGoal('${goal.id}')" style='float:right;color:red;background:none;border:none;font-size:16px;'>🗑</button>
        </small>
      </div>
      <div class="goal-controls">
        <input type="text" placeholder="Kommentieren…" onkeypress="if(event.key==='Enter'){addComment('${goal.id}', this.value); this.value=''}" />
      </div>
      <div class="comment-section">${commentHtml}</div>
    </div>
  `;
  return li;
}

function renderNewsItems(goals) {
  const newsFeed = document.getElementById("newsFeed");
  newsFeed.innerHTML = "";
  const recent = [];

  goals.forEach(goal => {
    if (goal.updatedAt > lastVisit) {
      recent.push(`🆕 ${goal.author} hat das Ziel "${goal.text}" hinzugefügt.`);
    }
    const comments = goal.comments || {};
    const newComments = Object.values(comments).filter(c => c.time > lastVisit);
    if (newComments.length) {
      recent.push(`💬 ${goal.text}: ${newComments.length} neuer Kommentar.`);
    }
  });

  if (recent.length === 0) {
    newsFeed.innerHTML = "<li>Keine neuen Änderungen seit deinem letzten Besuch.</li>";
  } else {
    recent.forEach(msg => {
      const li = document.createElement("li");
      li.textContent = msg;
      newsFeed.appendChild(li);
    });
  }
}
