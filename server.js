require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 3000;

// ================= MIDDLEWARE =================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ================= DEBUG ENV =================
console.log("🔐 Twilio SID:", process.env.TWILIO_ACCOUNT_SID ? "Loaded" : "Missing");
console.log("🔐 Twilio TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "Loaded" : "Missing");

// ================= LOAD INTENTS =================
const data = JSON.parse(fs.readFileSync("intents.json", "utf-8"));

// ================= GLOBAL DATA =================
let users = [];
let latestLocation = { lat: null, lon: null };

// ================= TWILIO CLIENT =================
let client = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = new twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
} else {
    console.log("⚠️ Twilio not configured properly");
}

// ================= CHATBOT =================
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

// ================= SAFETY CHECK =================
function getSafetyStatus() {
    let temp = Math.floor(Math.random() * 50);

    let status, voice;

    if (temp < 35) {
        status = "✅ Everything is safe";
        voice = "Everything is safe";
    } else if (temp < 45) {
        status = "⚠️ Warning: High temperature";
        voice = "Warning. Temperature is high";
    } else {
        status = "🚨 Danger! Very high temperature";
        voice = "Danger. Temperature is very high. Please take action";
    }

    return { temp, status, voice };
}

// ================= REGISTER USERS =================
app.get("/register", (req, res) => {
    let id = "helmet_" + (users.length + 1);
    users.push(id);
    console.log("🪖", id, "connected");
    res.send(id + " connected");
});

// ================= EMERGENCY =================
app.post("/emergency", (req, res) => {

    let { lat, lon } = req.body;

    let locationLink = lat && lon
        ? `https://www.google.com/maps?q=${lat},${lon}`
        : "Location not available";

    console.log("🚨 EMERGENCY TRIGGERED!");

    // Simulate broadcast
    users.forEach(user => {
        console.log(`📢 Alert sent to ${user}`);
    });

    // Send SMS
    sendMobileAlert(locationLink);

    res.json({
        msg: "🚨 Emergency alert sent with location!"
    });
});

// ================= TRACK LOCATION =================
app.post("/track", (req, res) => {
    let { lat, lon } = req.body;

    if (lat && lon) {
        latestLocation = { lat, lon };
        console.log("📍 Live Location:", lat, lon);
    }

    res.sendStatus(200);
});

// ================= GET LOCATION =================
app.get("/location", (req, res) => {
    res.json(latestLocation);
});

// ================= SMS ALERT =================
function sendMobileAlert(locationLink) {

    if (!client) {
        console.log("❌ Twilio client not initialized");
        return;
    }

    client.messages.create({
        body: `🚨 EMERGENCY! Worker needs help!\n📍 ${locationLink}`,
        from: process.env.TWILIO_PHONE,
        to: process.env.MY_PHONE
    })
    .then(msg => console.log("✅ SMS sent:", msg.sid))
    .catch(err => console.log("❌ Twilio Error:", err.message));
}

// ================= CHAT =================
app.post("/get", (req, res) => {
    let userMsg = req.body.msg;

    let response = getResponse(userMsg);

    res.json({ reply: response });
});

// ================= SAFETY API =================
app.get("/safety", (req, res) => {
    let result = getSafetyStatus();
    res.json(result);
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});