// Chat Client
const chat = document.getElementById("chat");
const text = document.getElementById("text");
const version = "1.1.0";
let displayname = localStorage.getItem("displayname");
const isApple = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);

text.value = "";

window.fp = {
    hash: new String(Date.now())
}

let lastMessageTimestamp = Date.now();

if (!displayname) {
    const elm = document.createElement("small");
    elm.innerHTML = "Create a display name to start chatting!";
    elm.style.marginTop = "20px";
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
    const isLocalhost = !window.location.protocol.includes("s");
    const protocol = isLocalhost ? "ws://" : "wss://";

    const socket = new WebSocket(protocol + window.location.host);


    text.addEventListener("paste", e => {
        const reader = new FileReader();
        const fileName = e.clipboardData.files[0].name;

        reader.readAsDataURL(e.clipboardData.files[0])

        reader.addEventListener("load", () => {
            socket.send(JSON.stringify({
                name: fileName,
                type: "img",
                content: reader.result
            }));

            sendMessage(reader.result, true, fileName);
        });
    })


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
            case "disconnect":
                {
                    const elm = document.createElement("small");
                    elm.innerHTML = `${data.name} / ${data.emoji} has disconnected`;
                    chat.appendChild(elm);

                    updateTyping(null, null, "", data.id)
                }
                break;
            case "message":
                receiveMessage(data.emoji, data.name, data.message, data.id);

                lastMessageTimestamp = Date.now();
                chat.scrollTop = chat.scrollHeight;
                break;
            case "img":
                receiveMessage(data.emoji, data.name, data.content, data.id, true, data.file_name);

                lastMessageTimestamp = Date.now();
                chat.scrollTop = chat.scrollHeight;
                break;
            case "type":
                updateTyping(data.emoji, data.name, data.message, data.id);

                lastMessageTimestamp = Date.now();
                chat.scrollTop = chat.scrollHeight;
        }

        updatePadder();
    }

    let typingTimeout = null;
    let lastValue = "";

    text.addEventListener("keyup", event => {
        if (event.key === "Enter" && text.value.length > 0) {
            sendMessage(text.value);
            socket.send(JSON.stringify({
                type: "send",
                content: text.value
            }));
            text.value = "";

            socket.send(JSON.stringify({
                type: "type",
                content: ""
            }));


            lastMessageTimestamp = Date.now();
            chat.scrollTop = chat.scrollHeight;
        } else if (lastValue != text.value) {
            socket.send(JSON.stringify({
                type: "type",
                content: text.value
            }));
        }

        lastValue = text.value

        if (typingTimeout) clearInterval(typingTimeout);

        typingTimeout = setTimeout(() => {
            socket.send(JSON.stringify({
                type: "type",
                content: ""
            }));
        }, 1000)
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
        elm.innerHTML = `Express Chat - ${version}<br/><sb>Today</sb> ${hour}:${minute} ${meridiem}`;
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

    updatePadder();
}

function updateTyping(emoji, name, message, sender_id) {
    const previousMessage = chat.children[chat.children.length - 2];

    for (const previousMessage of chat.children) {
        if (previousMessage && previousMessage.tagName === "DIV" && previousMessage.getAttribute("sender_id") === sender_id && previousMessage.getAttribute("typing")) {
            const p = document.createElement("p");
            p.innerHTML = handleMessageHTML(message);

            if (message == "") {
                setTimeout(() => {
                    previousMessage.animate([
                        {
                        },
                        {
                            opacity: 0,
                            filter: "blur(10px)"
                        },
                        {
                            opacity: 0,
                            filter: "blur(10px)"
                        },
                    ], {
                        duration: 300
                    });
                    setTimeout(() => {
                        previousMessage.remove();
                    }, 200);
                }, 500);

                return
            }

            previousMessage.children[1].children[1].innerText = message;
            typingElm(previousMessage);

            stackMessages([...previousMessage.children[1].children].splice(1), true);
            return
        }
    }

    if (message == "") return;

    const elm = document.createElement("div");
    elm.className = "message in";
    elm.setAttribute("sender_id", sender_id);
    elm.setAttribute("typing", true)
    elm.style.opacity = 0.5;
    elm.title = `A message from ${name}@${sender_id}`;

    const b = document.createElement("b");
    b.innerHTML = emoji;

    const messageContainer = document.createElement("div");
    messageContainer.className = "message-container";

    const username = document.createElement("small");
    username.innerText = name;

    const p = document.createElement("p");
    p.innerHTML = handleMessageHTML(message);

    messageContainer.appendChild(username);
    messageContainer.appendChild(p);

    elm.appendChild(b);
    elm.appendChild(messageContainer);

    addToChat(elm);
}

function receiveMessage(emoji, name, message, sender_id, isImage, fileName) {
    const previousMessage = chat.children[chat.children.length - 2];

    if (message == "") return;

    if (previousMessage && previousMessage.tagName === "DIV" && previousMessage.getAttribute("sender_id") === sender_id) {
        if (!previousMessage.getAttribute("typing")) {
            console.log(previousMessage)

            let p = null;


            if (isImage) {
                if (message.startsWith("data:image")) {
                    p = document.createElement("img");
                    p.src = message;
                } else {
                    const link = document.createElement("a");
                    link.href = message;
                    link.target = "_blank";
                    link.innerText = fileName || "View Image";
                    p = document.createElement("p");
                    p.appendChild(link);
                }
            } else {
                p = document.createElement("p");
                p.innerHTML = handleMessageHTML(message);

                if (p.innerText.replaceAll(" ", "").length != message.replaceAll(" ", "").length) return;
            }

            previousMessage.children[1].appendChild(p);
            flashElm(previousMessage);

            stackMessages([...previousMessage.children[1].children].splice(1), true);
            return
        } else {
            previousMessage.animate([
                {
                    scale: 1
                },
                {
                    scale: 0
                }
            ], {
                duration: 300
            })

            setTimeout(() => {
                previousMessage.remove();
                receiveMessage(emoji, name, message, sender_id, isImage)
            }, 100)

            return;
        }
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

    let p = null;


    if (isImage) {
        if (message.startsWith("data:image")) {
            p = document.createElement("img");
            p.src = message;
        } else {
            const link = document.createElement("a");
            link.href = message;
            link.target = "_blank";
            link.innerText = fileName || "View Image";
            p = document.createElement("p");
            p.appendChild(link);
        }
    } else {
        p = document.createElement("p");
        p.innerHTML = handleMessageHTML(message);

        if (p.innerText.replaceAll(" ", "").length != message.replaceAll(" ", "").length) return;
    }

    messageContainer.appendChild(username);
    messageContainer.appendChild(p);

    elm.appendChild(b);
    elm.appendChild(messageContainer);

    addToChat(elm);
}

function typingElm(elm) {
    elm.animate([
        {
            opacity: 0.4,
            marginLeft: "-1px"
        },
        {
            opacity: 0.5,
            marginLeft: "1px"
        }
    ], {
        duration: 100
    })
}

function flashElm(elm) {
    elm.animate([
        {
            opacity: 0.75,
            scale: 0.99
        },
        {
            opacity: 1
        }
    ], {
        duration: 100
    })
}

function scaleElm(elm) {
    elm.animate([
        {
            scale: 0.8,
            opacity: 0,
            filter: "blur(10px)"
        },
        {
            scale: 1,
            opacity: 1,
            filter: "blur(0px)"
        }
    ], {
        duration: 200
    })
}

function addToChat(elm) {
    scaleElm(elm);

    chat.appendChild(elm);
    updatePadder();
}

function handleMessageHTML(html) {
    for (const part of new Set(html.split(" "))) {
        try {
            const url = new URL(part);

            console.log(url)

            html = html.replaceAll(part, `<a href="${url}" class="link" target="_blank">${url}</a>`)
        } catch {

        }
    }

    return html;
}

function sendMessage(message, isImage, fileName) {
    const previousMessage = chat.children[chat.children.length - 2];

    if (previousMessage && previousMessage.tagName === "DIV" && !previousMessage.getAttribute("sender_id")) {
        console.log(previousMessage)

        let p = null;


        if (isImage) {
            if (message.startsWith("data:image")) {
                p = document.createElement("img");
                p.src = message;
            } else {
                const link = document.createElement("a");
                link.href = message;
                link.target = "_blank";
                link.innerText = fileName || "View Image";
                link.style.color = "white";
                p = document.createElement("p");
                p.appendChild(link);
            }
        } else {
            p = document.createElement("p");
            p.innerHTML = handleMessageHTML(message);
        }

        previousMessage.children[0].appendChild(p);
        flashElm(previousMessage);

        stackMessages([...previousMessage.children[0].children], false);
        return
    }

    const elm = document.createElement("div");
    elm.className = "message out" + (isApple ? " apple" : "");

    const messageContainer = document.createElement("div");
    messageContainer.className = "message-container";

    let p = null;


    if (isImage) {
        if (message.startsWith("data:image")) {
            p = document.createElement("img");
            p.src = message;
        } else {
            const link = document.createElement("a");
            link.href = message;
            link.target = "_blank";
            link.innerText = fileName || "View Image";
            link.style.color = "white";
            p = document.createElement("p");
            p.appendChild(link);
        }
    } else {
        p = document.createElement("p");
        p.innerHTML = handleMessageHTML(message);

        if (p.innerText.replaceAll(" ", "").length != message.replaceAll(" ", "").length) return;
    }

    messageContainer.appendChild(p);

    console.log(message.split(" "))

    elm.appendChild(messageContainer);

    addToChat(elm)
}

window.addEventListener("load", () => {
    setTimeout(() => { text.focus(); console.log("FOCUS") }, 1000);
});
