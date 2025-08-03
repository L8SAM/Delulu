
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

function formatDate(ts) {
  const d = new Date(ts || Date.now());
  return d.toLocaleDateString("de-CH") + " " + d.toLocaleTimeString("de-CH", {hour: '2-digit', minute: '2-digit'});
}

let goalsList = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("username").addEventListener("change", e => {
    localStorage.setItem("deluluUser", e.target.value);
  });

  const saved = localStorage.getItem("deluluUser");
  if (saved) document.getElementById("username").value = saved;

  goalsRef.on("value", snapshot => {
    const data = snapshot.val() || {};
    goalsList = Object.entries(data).map(([id, goal]) => ({ id, ...goal }));
    renderGoals();
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
    goalsRef.child(goalId).child("comments").child(commentKey).remove();
  }
}

function deleteGoal(id) {
  if (confirm("Ziel löschen?")) {
    goalsRef.child(id).remove();
  }
}

function createGoalItem(goal) {
  const li = document.createElement("li");
  if (goal.done) li.classList.add("done");

  const comments = goal.comments || {};
  const commentHtml = Object.entries(comments).map(([key, c]) =>
    `<div><strong>${c.name}:</strong> ${c.text}
      <span onclick="deleteComment('${goal.id}', '${key}')" style='cursor:pointer;color:black;margin-left:6px'>✖</span>
    </div>`).join("");

  li.innerHTML = `
    <div class="goal-content">
      <div class="goal-header">
        <div class="goal-text">
          <div style="background:white;color:black;padding:4px 8px;border-radius:8px 8px 8px 0;max-width:fit-content;font-size:0.75rem;">
            📅 ${formatDate(goal.updatedAt)}
          </div>
          <input type="checkbox" ${goal.done ? "checked" : ""} onchange="toggleDone('${goal.id}', ${goal.done})" />
          <strong>${goal.text || ""}</strong>
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

function renderGoals() {
  const list = document.getElementById("bucketList");
  const recent = document.getElementById("recentChanges");
  const doneList = document.getElementById("doneList");
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";

  list.innerHTML = "";
  recent.innerHTML = "";
  doneList.innerHTML = "";

  const filtered = goalsList.filter(goal => (goal.text || "").toLowerCase().includes(search));

  const now = Date.now();
  const recentGoals = filtered.filter(g => !g.done && now - (g.updatedAt || 0) < 7 * 86400000);
  const otherGoals = filtered.filter(g => !g.done && now - (g.updatedAt || 0) >= 7 * 86400000);
  const doneGoals = filtered.filter(g => g.done);

  [...recentGoals, ...otherGoals].forEach(g => list.appendChild(createGoalItem(g)));
  doneGoals.forEach(g => doneList.appendChild(createGoalItem(g)));

  const doneCount = filtered.filter(g => g.done).length;
  const percent = filtered.length ? Math.round((doneCount / filtered.length) * 100) : 0;
  document.getElementById("progressBar").textContent = `Fortschritt: ${percent}%`;
}
