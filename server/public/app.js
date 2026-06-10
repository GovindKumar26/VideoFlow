const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const bellBtn = document.getElementById("bellBtn");
const dropdown = document.getElementById("dropdown");
const notificationList = document.getElementById("notificationList");
const unreadBadge = document.getElementById("unreadBadge");
const userLabel = document.getElementById("userLabel");
const connectionState = document.getElementById("connectionState");
const connectionDot = document.getElementById("connectionDot");
const markAllReadBtn = document.getElementById("markAllReadBtn");

let socket = null;
let notifications = [];

const API_BASE = "";

const getToken = () => localStorage.getItem("token") || "";
const setToken = (token) => {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
};

const escapeHtml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const timeAgo = (value) => {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(delta / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const setConnected = (connected) => {
  connectionState.textContent = connected ? "Connected" : "Disconnected";
  connectionDot.classList.toggle("online", connected);
};

const updateUnreadBadge = () => {
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  unreadBadge.textContent = String(unreadCount);
};

const renderNotifications = () => {
  if (!notifications.length) {
    notificationList.innerHTML = '<div class="notification-item"><div class="notification-message">No notifications yet.</div></div>';
    updateUnreadBadge();
    return;
  }

  notificationList.innerHTML = notifications.map((notification) => `
    <div class="notification-item ${notification.isRead ? '' : 'unread'}">
      <div class="notification-title">${escapeHtml(notification.title)}</div>
      <div class="notification-message">${escapeHtml(notification.message)}</div>
      <div class="notification-time">${timeAgo(notification.createdAt)}</div>
    </div>
  `).join("");
  updateUnreadBadge();
};

const fetchNotifications = async () => {
  const response = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  if (!response.ok) {
    if (response.status === 401) {
      notifications = [];
      renderNotifications();
    }
    return;
  }

  const data = await response.json();
  notifications = data.notifications || [];
  renderNotifications();
};

const connectSocket = () => {
  const token = getToken();
  if (!token) {
    setConnected(false);
    return;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io({ auth: { token } });

  socket.on("connect", () => setConnected(true));
  socket.on("disconnect", () => setConnected(false));
  socket.on("connect_error", () => setConnected(false));
  socket.on("notification:new", (notification) => {
    notifications = [notification, ...notifications.filter((item) => item.id !== notification.id)];
    renderNotifications();
  });
};

const loadSession = () => {
  const token = getToken();
  const email = localStorage.getItem("email") || "";
  if (email) {
    userLabel.textContent = `Signed in as ${email}`;
  }
  if (token) {
    connectSocket();
    fetchNotifications();
  }
};

const authRequest = async (path) => {
  const response = await fetch(`${API_BASE}/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value })
  });

  const data = await response.json();
  if (!response.ok) {
    alert(data.message || "Request failed");
    return;
  }

  setToken(data.token);
  localStorage.setItem("email", data.user.email);
  userLabel.textContent = `Signed in as ${data.user.email}`;
  connectSocket();
  await fetchNotifications();
};

registerBtn.addEventListener("click", () => authRequest("register"));
loginBtn.addEventListener("click", () => authRequest("login"));

logoutBtn.addEventListener("click", () => {
  setToken("");
  localStorage.removeItem("email");
  userLabel.textContent = "No user signed in";
  notifications = [];
  renderNotifications();
  if (socket) socket.disconnect();
  setConnected(false);
});

refreshBtn.addEventListener("click", fetchNotifications);

bellBtn.addEventListener("click", () => {
  const isHidden = dropdown.classList.toggle("hidden");
  bellBtn.setAttribute("aria-expanded", String(!isHidden));
});

markAllReadBtn.addEventListener("click", async () => {
  if (!getToken()) return;
  await fetch(`${API_BASE}/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  notifications = notifications.map((item) => ({ ...item, isRead: true }));
  renderNotifications();
});

document.addEventListener("click", (event) => {
  if (!dropdown.contains(event.target) && !bellBtn.contains(event.target)) {
    dropdown.classList.add("hidden");
    bellBtn.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("load", () => {
  renderNotifications();
  loadSession();
});
