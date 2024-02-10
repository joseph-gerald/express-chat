const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const chat = document.getElementById("chat");

function insertDateDisplay() {
    const elm = document.createElement("small");
    const date = new Date();

    const meridiem = date.getHours() > 12 ? "PM" : "AM";
    const hour = date.getHours() % 12 || 12;
    const minute = date.getMinutes();

    elm.innerHTML = `<sb>Today</sb> ${hour}:${minute} ${meridiem}`;
    chat.appendChild(elm);
}

function receiveMessage(emoji, name, message) {
    const elm = document.createElement("div");
    elm.className = "message in";

    const b = document.createElement("b");
    b.innerHTML = emoji;

    const messageContainer = document.createElement("div");
    messageContainer.className = "message-container";

    const username = document.createElement("small");
    username.innerText = name;

    const p = document.createElement("p");
    p.innerText = message;

    messageContainer.appendChild(username);
    messageContainer.appendChild(p);

    elm.appendChild(b);
    elm.appendChild(messageContainer);

    chat.appendChild(elm);
}

function sendMessage(message) {
    const elm = document.createElement("div");
    elm.className = "message out";

    const messageContainer = document.createElement("div");
    messageContainer.className = "message-container";

    const p = document.createElement("p");
    p.innerText = message;

    messageContainer.appendChild(p);

    elm.appendChild(messageContainer);

    chat.appendChild(elm);
}

insertDateDisplay();
receiveMessage("👋", "Bot", "Hello, how can I help you today?");
sendMessage("I need help with my order.");
