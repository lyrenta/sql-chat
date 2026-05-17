const input = document.querySelector("input");
const button = document.querySelector("button");
const messagesDiv = document.querySelector(".messagesFromYou");
const socket = io();

button.addEventListener("click", async () => {

    const message = input.value;

    if (message.trim() === "") return;

    await fetch("/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: "You",
            message: message
        })
    });

    input.value = "";

    loadMessages();
});

async function loadMessages() {

    try {

        const response = await fetch("/messages");

        if (!response.ok) {
            throw new Error("Server error");
        }

        const messages = await response.json();

        messagesDiv.innerHTML = "";

        messages.forEach(msg => {

            const p = document.createElement("p");

            p.textContent = `${msg.username}: ${msg.message}`;

            messagesDiv.appendChild(p);
        });

    } catch (error) {

        console.log("Error loading messages:", error);
    }
}

loadMessages();

setInterval(loadMessages, 1000);

const registerBtn = document.getElementById("registerBtn");

registerBtn.addEventListener("click", async () => {

    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;

    if (username === "" || password === "") {
        alert("Fill all fields");
        return;
    }

    const response = await fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            password
        })
    });

    const text = await response.text();

    alert(text);
});