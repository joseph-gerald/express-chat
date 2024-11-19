const emojis = [..."😷🤒🤕🤢🤮🤧😢😭😨🤯🥵🥶🤑😴🥰🤣🤡💀👽👾🤖👶💋❤️💔💙💚💛🧡💜🖤💤💢💣💥💦💨💫👓💍💎👑🎓🧢💄💍💎🐵🦒🐘🐀🍆🍑🍒🍓⚽🎯🔊🔇🔋🔌💻💰💯"];

function getEmojiIndex(string) {
    const index = string.split("").map(x => x.charCodeAt()).reduce((a, b) => a + b);
    return index % emojis.length;
}

let clients = [];
const users = [];

function handleConnection(client, request) {
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

        users.forEach(x => {
            x.client.send(JSON.stringify({
                type: "disconnect",
                name: user.name,
                emoji: user.emoji,
                id: user.id
            }));
        });
    }

    function onMessage(data) {
        if (data.indexOf("keepalive") == 0) {
            const count = data.split("/")[1];

            if (isNaN(parseInt(count))) throw Error("Invalid Keepalive");
            return;
        }

        const message = data;
        const json = JSON.parse(message);

        if (!user) {
            const id = json.hash.substring(0, 8) + Math.random().toString(36).substring(4);
            console.log(json.hash)

            user = {
                emoji: emojis[getEmojiIndex(json.hash)],
                name: json.name,
                hash: json.hash,
                client: client,
                id
            }

            users.push(user);

            users.forEach(x => {
                x.client.send(JSON.stringify({
                    type: "system",
                    content: `${user.name} / ${user.emoji} has connected`
                }));
            });
            return;
        }

        const displayname = user.name;
        const emoji = user.emoji;
        const id = user.id;

        switch (json.type) {
            case "send":
                for (const user of users.filter(x => x.client != client)) {
                    user.client.send(JSON.stringify({
                        type: "message",
                        emoji: emoji,
                        name: displayname,
                        message: json.content,
                        id
                    }));
                }
                break;
            case "type":
                for (const user of users.filter(x => x.client != client)) {
                    user.client.send(JSON.stringify({
                        type: "type",
                        emoji: emoji,
                        name: displayname,
                        message: json.content,
                        id
                    }));
                }
                break;
        }
    }

    client.on('message', data => {
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