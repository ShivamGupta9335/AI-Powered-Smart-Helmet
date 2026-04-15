function sendMessage() {
    let input = document.getElementById("userInput").value;
    if (!input) return;

    let chatbox = document.getElementById("chatbox");

    chatbox.innerHTML += `<p class="user">You: ${input}</p>`;

    fetch("/get", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: "msg=" + encodeURIComponent(input)
    })
    .then(res => res.json())
    .then(data => {
        chatbox.innerHTML += `<p class="bot">Bot: ${data.reply}</p>`;
        speak(data.reply);
        chatbox.scrollTop = chatbox.scrollHeight;
    });

    document.getElementById("userInput").value = "";
}

// 🔊 Voice
function speak(text) {
    let speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
}

// 🌡️ Safety
function checkSafety() {
    fetch("/safety")
    .then(res => res.json())
    .then(data => {
        let chatbox = document.getElementById("chatbox");

        chatbox.innerHTML += `<p class="bot">🌡️ Temp: ${data.temp}°C</p>`;
        chatbox.innerHTML += `<p class="bot">${data.status}</p>`;

        speak(data.voice);
    });
}

// 🚨 Emergency
function sendEmergency() {

    navigator.geolocation.getCurrentPosition(pos => {

        fetch("/emergency", {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: `lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        })
        .then(res => res.json())
        .then(data => {
            let chatbox = document.getElementById("chatbox");

            chatbox.innerHTML += `<p class="alert">${data.msg}</p>`;
            speak("Emergency alert sent");
        });

    });
}