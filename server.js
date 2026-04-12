require("dotenv").config(); // 👈 Load env variables

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const data = JSON.parse(fs.readFileSync("intents.json", "utf-8"));

let users = [];

let latestLocation = { lat: null, lon: null };

// 🔐 Use env variables instead of hardcoding
const client = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

function getResponse(userInput) {
    userInput = userInput.toLowerCase();

    for (let intent of data.intents) {
        for (let pattern of intent.patterns) {
            if (userInput.includes(pattern.toLowerCase())) {
                return intent.responses[Math.floor(Math.random() * intent.responses.length)];
            }
        }
    }

    return "I didn't understand. Please stay safe.";
}

function checkEmergency() {
    const alerts = [
        "All safe",
        "Gas detected",
        "High temperature",
        "Worker fall detected"
    ];
    return alerts[Math.floor(Math.random() * alerts.length)];
}

app.get("/register", (req, res) => {
    let id = "helmet_" + (users.length + 1);
    users.push(id);
    console.log(id + " connected");
    res.send(id + " connected");
});

app.post("/emergency", (req, res) => {

    console.log("🚨 EMERGENCY BUTTON PRESSED!");

    let lat = req.body.lat;
    let lon = req.body.lon;

    let locationLink = "Location not available";

    if (lat && lon) {
        locationLink = `https://www.google.com/maps?q=${lat},${lon}`;
    }

    users.forEach(user => {
        console.log(`🚨 Alert sent to ${user}`);
    });

    sendMobileAlert(locationLink);

    res.json({ status: "Emergency sent with GPS location" });
});

// 📍 TRACK
app.post("/track", (req, res) => {
    let lat = req.body.lat;
    let lon = req.body.lon;

    if (lat && lon) {
        latestLocation = { lat, lon };
        console.log("📍 Live Location:", lat, lon);
    }

    res.sendStatus(200);
});

// 📍 GET LOCATION
app.get("/location", (req, res) => {
    res.json(latestLocation);
});

// 📱 SMS ALERT
function sendMobileAlert(locationLink) {
    client.messages.create({
        body: `🚨 EMERGENCY! Worker needs help immediately!
📍 Location: ${locationLink}`,
        from: process.env.TWILIO_PHONE,
        to: process.env.MY_PHONE
    })
    .then(msg => console.log("📱 SMS sent:", msg.sid))
    .catch(err => console.log(err));
}

// 💬 CHAT
app.post("/get", (req, res) => {
    let userMsg = req.body.msg;

    let response = getResponse(userMsg);
    let sensor = checkEmergency();

    if (sensor !== "All safe") {
        response += `<br><br>🚨 SYSTEM ALERT: ${sensor}!`;
    }

    res.json({ reply: response });
});

// 🚀 START
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});