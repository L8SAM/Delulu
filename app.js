
let currentUser = "";

function setUsername(name) {
  currentUser = name;
  localStorage.setItem("deluluUser", name);
}

function getUsername() {
  return localStorage.getItem("deluluUser") || "";
}

window.addEventListener("DOMContentLoaded", () => {
  const saved = getUsername();
  if (saved) {
    currentUser = saved;
    const userSelect = document.getElementById("username");
    if (userSelect) userSelect.value = saved;
  }
});

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
  goalsRef.child(id).update({ done: !current, updatedAt: Date.now() });
}

function deleteGoal(id) {
  if (confirm("Willst du dieses Ziel wirklich löschen?")) {
    goalsRef.child(id).remove();
  }
}

function addComment(goalId, text) {
  const name = getUsername();
  if (!name) return alert("Bitte Benutzer wählen!");
  if (!text.trim()) return;
  const commentRef = db.ref("goals/" + goalId + "/comments");
  commentRef.once("value", snapshot => {
    const comments = snapshot.val() || [];
    comments.push({ author: name, text, createdAt: Date.now() });
    commentRef.set(comments);
    goalsRef.child(goalId).update({ updatedAt: Date.now() });
  });
}

function deleteComment(goalId, index) {
  if (!confirm("Kommentar wirklich löschen?")) return;
  const commentRef = db.ref("goals/" + goalId + "/comments");
  commentRef.once("value", snapshot => {
    const comments = snapshot.val() || [];
    comments.splice(index, 1);
    commentRef.set(comments);
    goalsRef.child(goalId).update({ updatedAt: Date.now() });
  });
}

function renderGoals() {
  const list = document.getElementById("bucketList");
  const recentList = document.getElementById("recentChanges");
  list.innerHTML = "";
  recentList.innerHTML = "";

  const sortType = document.getElementById("sortType").value;
  const search = document.getElementById("searchBox").value.toLowerCase();

  const sorted = [...goalsList].sort((a, b) => {
    if (sortType === "timeframe") return a.value.timeframe.localeCompare(b.value.timeframe);
    if (sortType === "author") return a.value.author.localeCompare(b.value.author);
    if (sortType === "text") return a.value.text.localeCompare(b.value.text);
    return 0;
  });

  const now = Date.now();
  const recent = sorted.filter(g => now - (g.value.updatedAt || 0) <= 7 * 86400000);
  const notRecent = sorted.filter(g => now - (g.value.updatedAt || 0) > 7 * 86400000);

  const renderList = (target, items) => {
    items.forEach(child => {
      const goal = child.value;
      const key = child.key;
      if (!goal.text.toLowerCase().includes(search)) return;
      const li = document.createElement("li");
      const doneClass = goal.done ? "done" : "";
      li.innerHTML = `
        <div class="goal-content">
          <div class="goal-header">
            <div class="goal-text">
              <input type="checkbox" ${goal.done ? "checked" : ""} onchange="toggleDone('${key}', ${goal.done})" />
              <strong class="${doneClass}">${goal.text}</strong> (${goal.author}, ${goal.timeframe}) ${goal.done ? "✅" : ""}
            </div>
          </div>
          <div class="comment-section">
            <input type="text" placeholder="Kommentar hinzufügen..." onkeypress="if(event.key==='Enter'){ addComment('${key}', this.value); this.value=''; }" />
            <div>
              ${(goal.comments || []).map((c, i) =>
                `💬 <b>${c.author}</b>: ${c.text} <button onclick="deleteComment('${key}', ${i})" class="neutral-button">✖</button>`
              ).join("<br>")}
            </div>
          </div>
          <div class="goal-controls">
            <button class="neutral-button" onclick="deleteGoal('${key}')">🗑️</button>
          </div>
        </div>`;
      target.appendChild(li);
    });
  };

  renderList(recentList, recent);
  renderList(list, notRecent);

  const doneCount = sorted.filter(g => g.value.done).length;
  const totalCount = sorted.length;
  const percent = Math.round((doneCount / (totalCount || 1)) * 100);
  document.getElementById("progressBar").textContent = `Fortschritt: ${percent}%`;
}

goalsRef.on("value", snapshot => {
  goalsList = [];
  snapshot.forEach(child => {
    goalsList.push({ key: child.key, value: child.val() });
  });
  renderGoals();
});
