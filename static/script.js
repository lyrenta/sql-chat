const socket = io();

let currentUser = null;
let currentDialog = null;

function login() {
    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            login: document.getElementById("login").value,
            password: document.getElementById("password").value
        })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.user) return alert("Login failed");

        currentUser = data.user;

        document.getElementById("auth").style.display = "none";
        document.getElementById("app").style.display = "flex";

        loadUsers();
    });
}

function register() {
    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            login: document.getElementById("login").value,
            password: document.getElementById("password").value
        })
    }).then(() => login());
}

function loadUsers() {
    fetch("/users")
        .then(r => r.json())
        .then(users => {
            const box = document.getElementById("sidebar");
            box.innerHTML = "";

            users.forEach(u => {
                if (u.id === currentUser.id) return;

                const div = document.createElement("div");
                div.className = "user";
                div.innerText = u.login;

                div.onclick = () => openChat(u);

                box.appendChild(div);
            });
        });
}

function openChat(user) {
    fetch("/dialog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user1: currentUser.id,
            user2: user.id
        })
    })
    .then(r => r.json())
    .then(dialog => {
        currentDialog = dialog.id;

        document.getElementById("chatTitle").innerText = user.login;

        loadMessages();
    });
}

function loadMessages() {
    fetch("/messages?dialogId=" + currentDialog)
        .then(r => r.json())
        .then(msgs => {
            const box = document.getElementById("messages");
            box.innerHTML = "";

            msgs.forEach(m => {
                const div = document.createElement("div");

                const isMe = m.author_id === currentUser.id;

                div.className = isMe ? "msg me" : "msg other";

                div.innerText = m.content;

                box.appendChild(div);
            });

            box.scrollTop = box.scrollHeight;
        });
}

function sendMessage() {
    const input = document.getElementById("msgInput");

    socket.emit("sendMessage", {
        content: input.value,
        author_id: currentUser.id,
        dialog_id: currentDialog
    });

    input.value = "";
}

socket.on("newMessage", (msg) => {
    if (msg.dialog_id !== currentDialog) return;

    const box = document.getElementById("messages");

    const div = document.createElement("div");

    const isMe = msg.author_id === currentUser.id;

    div.className = isMe ? "msg me" : "msg other";
    div.innerText = msg.content;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
});