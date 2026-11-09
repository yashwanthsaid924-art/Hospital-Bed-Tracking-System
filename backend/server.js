// ===== IMPORTS =====
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP + Socket.IO
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Model
const Hospital = require('./models/Hospital');

// ===== MONGODB + AUTO UPDATE =====
mongoose.connect('mongodb://127.0.0.1:27017/hospitalDB')
.then(() => {
  console.log("MongoDB Connected");

  // 🔥 AUTO UPDATE EVERY 5 SECONDS
  setInterval(async () => {
    try {
      const hospitals = await Hospital.find();

      if (hospitals.length === 0) {
        console.log("⚠ No hospitals found");
        return;
      }

      for (let h of hospitals) {
        h.icu_available = Math.floor(Math.random() * h.icu_total);
        h.oxygen_available = Math.floor(Math.random() * h.oxygen_total);
        h.general_available = Math.floor(Math.random() * h.general_total);

        await h.save();

        // Emit real-time update
        io.emit("bedUpdate", h);
      }

      console.log("🔥 Auto updating...");
    } catch (err) {
      console.log("❌ Auto update error:", err);
    }
  }, 5000);

})
.catch(err => console.log(err));

// ===== SOCKET CONNECTION =====
io.on('connection', (socket) => {
  console.log("🔥 Client connected");
});

// ===== ROUTES =====

// Test route
app.get('/', (req, res) => {
  res.send("Server is working");
});

// ===== UPDATE API (SINGLE + BULK) =====
app.post('/updateBeds', async (req, res) => {
  try {
    const data = req.body;

    // BULK INSERT
    if (Array.isArray(data)) {
      for (let item of data) {
        await Hospital.findOneAndUpdate(
          { name: item.name },
          { ...item, last_updated: new Date() },
          { upsert: true }
        );

        io.emit("bedUpdate", item);
      }

      return res.json({ message: "Bulk update successful" });
    }

    // SINGLE INSERT
    const hospital = await Hospital.findOneAndUpdate(
      { name: data.name },
      { ...data, last_updated: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    io.emit("bedUpdate", hospital);

    res.json({ message: "Updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== AGGREGATE API =====
app.get('/aggregate', async (req, res) => {
  const hospitals = await Hospital.find();

  let totals = {
    icu: 0,
    oxygen: 0,
    general: 0
  };

  hospitals.forEach(h => {
    totals.icu += h.icu_available || 0;
    totals.oxygen += h.oxygen_available || 0;
    totals.general += h.general_available || 0;
  });

  res.json(totals);
});

// ===== GET ALL HOSPITALS =====
app.get('/getBeds', async (req, res) => {
  const hospitals = await Hospital.find();
  res.json(hospitals);
});

// ===== SERVER START =====
http.listen(5000, () => {
  console.log("Server running on port 5000");
});