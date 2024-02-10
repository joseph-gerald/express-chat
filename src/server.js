const emojis = [..."😷🤒🤕🤢🤮🤧😢😭😨🤯🥵🥶🤑😴🥰🤣🤡💀👽👾🤖👶💋❤️💔💙💚💛🧡💜🖤💤💢💣💥💦💨💫👓💍💎👑🎓🧢💄💍💎🐵🦒🐘🐀🍆🍑🍒🍓⚽🎯🔊🔇🔋🔌💻💰💯"];
const emojiPattern = /\p{Emoji}/u;

function getEmojiIndex(string) {
    const index = string.split("").map(x => x.charCodeAt()).reduce((a, b) => a + b);
    return index % emojis.length;
}

let clients = [];
const users = [];

function handleConnection(client, request) {
    const headers = request.headers;
    let user = null;

    clients.push(client);

    function onClose() {
        console.log(`Connection Closed`);
        
        var position = clients.indexOf(client);
        clients.splice(position, 1);
        if (user) {
            var userPosition = users.indexOf(user);
            users.splice(userPosition, 1);
        }
    }

    function onMessage(data) {
        if (data.indexOf("keepalive") == 0) {
            const count = data.split("/")[1];

            if (isNaN(parseInt(count))) throw Error("Invalid Keepalive");
            return;
        }

        const message = data;

        if (!user) {
            const json = JSON.parse(message);
            console.log(json.hash)

            user = {
                emoji: getEmojiIndex(json.hash),
                name: json.name,
                hash: json.hash,
                client: client
            }

            users.push(user);
            return;
        }

        for (const user of users.filter(x => x.client != client)) {
            user.client.send(JSON.stringify({
                type: "message",
                emoji: emojis[user.emoji],
                name: user.name,
                message: message
            }));
        }
    }

    client.on('message', data => {

        client.send(JSON.stringify({ type: "connected" }));
        try {
            onMessage(data.toString())
        } catch (error) {
            client.close();
            console.log(error)
        }
    });

    client.on('close', onClose);
}

module.exports = handleConnection;