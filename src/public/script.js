const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const chat = document.getElementById("chat");

function insertDateDisplay() {
    const elm = document.createElement("small");
    const date = new Date();
    const day = date.getDay();
    const month = date.getMonth();
    const year = date.getFullYear();

    elm.innerHTML = `${days[day]}, ${date.getDate()} ${months[month]} ${year}`;

}