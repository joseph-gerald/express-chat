// Chat Client
const chat = document.getElementById("chat");
const text = document.getElementById("text");
let displayname = localStorage.getItem("displayname");

if (!displayname) {
    const elm = document.createElement("small");
    elm.innerHTML = "Create a display name to start chatting!";
    chat.appendChild(elm);

    receiveMessage("🤖", "Chat Bot", "Choose a display name to start");

    text.addEventListener("keyup", event => {
        if (event.key === "Enter") {
            displayname = text.value;
            localStorage.setItem("displayname", text.value);

            chat.innerHTML = "";
            text.value = "";

            connect();
        }
    });
} else {
    connect();
}

function connect() {
    const isLocalhost = window.location.host.indexOf("localhost") == 0;
    const protocol = isLocalhost ? "ws://" : "wss://";

    const socket = new WebSocket(protocol + window.location.host);

    socket.onclose = () => {
        location.reload();
    }

    socket.onopen = _ => {
        let keepaliveCount = 0;
        setInterval(() => { socket.send("keepalive/" + keepaliveCount++); }, 60 * 1000);

        insertDateDisplay();

        let refreshId = setInterval(() => {
            try {
                if (window.fp == null) return;
                socket.send(JSON.stringify({ ...window.fp, name: displayname }));
                clearInterval(refreshId);
            } catch (ignore) { }
        }, 100);
    }

    socket.onmessage = event => {
        const data = JSON.parse(event.data);
        if (data.type == "message") {
            receiveMessage(data.emoji, data.name, data.message);
        }
    }

    text.addEventListener("keyup", event => {
        if (event.key === "Enter") {
            sendMessage(text.value);
            socket.send(text.value);
            text.value = "";
        }
    });
}

// Front End

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
