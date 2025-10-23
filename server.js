require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(express.static("public"));

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_SECRET = process.env.API_SECRET || "";
const RATE_LIMIT_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_MIN || "30", 10);
const rateMap = new Map();

function checkRate(ip) {
  const now = Date.now();
  const windowMs = 60000;
  const entry = rateMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count++;
  rateMap.set(ip, entry);
  return entry.count <= RATE_LIMIT_PER_MIN;
}

app.post("/api/send", async (req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";
  if (!checkRate(ip)) return res.status(429).json({ error: "Too many requests" });

  if (API_SECRET) {
    const provided = req.headers["x-api-secret"] || req.query.secret || "";
    if (provided !== API_SECRET) return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, message } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim())
    return res.status(400).json({ error: "Message required" });

  const safeName = name?.trim()?.slice(0, 100) || "Anonymous";
  const safeMsg = message.trim().slice(0, 4000);

  const text = `📩 New Message\nFrom: ${safeName}\nIP: ${ip}\n\n${safeMsg}`;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });
    const j = await resp.json();
    if (!resp.ok || j.ok === false) return res.status(502).json({ error: "Telegram send failed" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/health", (req, res) => res.send("ok"));
app.listen(process.env.PORT || 3000, () =>
  console.log(`Running on port ${process.env.PORT || 3000}`)
);
