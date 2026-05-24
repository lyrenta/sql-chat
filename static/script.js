const socket = io();

let currentUser = null;
let currentDialog = null;

// AUTH
function register() {
    fetch("/register", {
        method: "POST",
        body: JSON.stringify({
            login: login.value,
            password: password.value
        })
    });
}

function login() {
    fetch("/login", {
        method: "POST",
        body: JSON.stringify({
            login: login.value,
            password: password.value
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.user) {
            currentUser = data.user;
            document.getElementById("auth").style.display = "none";
            document.getElementById("app").style.display = "flex";
            loadUsers();
        }
    });
}

// USERS
function loadUsers() {
    fetch("/users")
        .then(r => r.json())
        .then(users => {
            const box = document.getElementById("users");
            box.innerHTML = "";

            users.forEach(u => {
                if (u.id === currentUser.id) return;

                const div = document.createElement("div");
                div.innerText = u.login;
                div.onclick = () => openDialog(u.id);
                box.appendChild(div);
            });
        });
}

// DIALOG
function openDialog(userId) {
    fetch("/dialog", {
        method: "POST",
        body: JSON.stringify({
            user1: currentUser.id,
            user2: userId
        })
    })
    .then(r => r.json())
    .then(dialog => {
        currentDialog = dialog.id;
        loadMessages();
    });
}

// MESSAGES
function loadMessages() {
    fetch("/messages?dialogId=" + currentDialog)
        .then(r => r.json())
        .then(msgs => {
            const box = document.getElementById("messages");
            box.innerHTML = "";

            msgs.forEach(m => {
                const div = document.createElement("div");
                div.className = "message";
                div.innerText = m.content;
                box.appendChild(div);
            });
        });
}

function sendMessage() {
    const content = msgInput.value;

    socket.emit("sendMessage", {
        content,
        author_id: currentUser.id,
        dialog_id: currentDialog
    });

    msgInput.value = "";
}

// REALTIME
socket.on("newMessage", (msg) => {
    if (msg.dialog_id === currentDialog) {
        const div = document.createElement("div");
        div.className = "message";
        div.innerText = msg.content;
        document.getElementById("messages").appendChild(div);
    }
});