// Chat Client
const chat = document.getElementById("chat");
const text = document.getElementById("text");
let displayname = localStorage.getItem("displayname");
const isApple = !/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

let lastMessageTimestamp = Date.now();

if (!displayname) {
    const elm = document.createElement("small");
    elm.innerHTML = "Create a display name to start chatting!";
    chat.appendChild(elm);

    receiveMessage("🤖", "System", "Choose a display name to start");

    text.addEventListener("keyup", event => {
        if (event.key === "Enter" && text.value.length > 0) {
            displayname = text.value;
            localStorage.setItem("displayname", text.value);

            chat.innerHTML = "";
            text.value = "";

            location.reload();
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

        insertDateDisplay(true);

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
        
        if (Date.now() - lastMessageTimestamp > 1000 * 60) {
            insertDateDisplay();
        }

        switch (data.type) {
            case "system":
                const elm = document.createElement("small");
                elm.innerHTML = data.content;
                chat.appendChild(elm);
                break;
            case "message":    
                receiveMessage(data.emoji, data.name, data.message, data.id);
    
                lastMessageTimestamp = Date.now();
                chat.scrollTop = chat.scrollHeight;
        }

        updatePadder();
    }

    text.addEventListener("keyup", event => {
        if (event.key === "Enter" && text.value.length > 0) {
            sendMessage(text.value);
            socket.send(text.value);
            text.value = "";

            lastMessageTimestamp = Date.now();
            chat.scrollTop = chat.scrollHeight;
        }
    });
}

// Front End

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function updatePadder() {   
    const oldPadder = padder;
    padder.remove();
    chat.appendChild(oldPadder);
}

function insertDateDisplay(init = false) {
    const elm = document.createElement("small");
    const date = new Date();

    const meridiem = date.getHours() > 12 ? "PM" : "AM";
    const hour = date.getHours() % 12 || 12;
    const minute = date.getMinutes();

    if (init) {
        elm.innerHTML = `Express Chat<br/><sb>Today</sb> ${hour}:${minute} ${meridiem}`;
        elm.style.marginTop = "20px";
    } else {
        elm.innerHTML = `<sb>Today</sb> ${hour}:${minute} ${meridiem}`;
    }
    chat.appendChild(elm);
}

function stackMessages(texts, incoming) {
    let index = 0;

    for (const text of texts) {
        switch (index++) {
            case 0:
                text.style[incoming ? "borderBottomLeftRadius" : "borderBottomRightRadius"] = "5px";
                break;
            case texts.length - 1:
                text.style[incoming ? "borderTopLeftRadius" : "borderTopRightRadius"] = "5px";
                text.style.marginTop = "1px";
                break;
            default:
                text.style.margin = "1px 0";
                text.style.marginRight = incoming ? "0" : "5px";
                text.style.borderRadius = incoming ? "5px 15px 15px 5px" : "15px 5px 5px 15px";
        }
    }
}

function receiveMessage(emoji, name, message, sender_id) {
    const previousMessage = chat.children[chat.children.length - 2];

    if (previousMessage && previousMessage.tagName === "DIV" && previousMessage.getAttribute("sender_id") === sender_id) {
        console.log(previousMessage)
        previousMessage.children[1].appendChild(document.createElement("p")).innerText = message;

        stackMessages([...previousMessage.children[1].children].splice(1), true);
        return
    }

    const elm = document.createElement("div");
    elm.className = "message in";
    elm.setAttribute("sender_id", sender_id);
    elm.title = `A message from ${name}@${sender_id}`;

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
    updatePadder();
}

function sendMessage(message) {
    const previousMessage = chat.children[chat.children.length - 2];

    if (previousMessage && previousMessage.tagName === "DIV" && !previousMessage.getAttribute("sender_id")) {
        console.log(previousMessage)
        previousMessage.children[0].appendChild(document.createElement("p")).innerText = message;

        stackMessages([...previousMessage.children[0].children], false);
        return
    }

    const elm = document.createElement("div");
    elm.className = "message out" + (isApple ? " apple" : "");

    const messageContainer = document.createElement("div");
    messageContainer.className = "message-container";

    const p = document.createElement("p");
    p.innerText = message;

    messageContainer.appendChild(p);

    elm.appendChild(messageContainer);

    chat.appendChild(elm);
    updatePadder();
}

window.addEventListener("load", () => { 
    setTimeout(() => { text.focus(); console.log("FOCUS") }, 1000);
});
