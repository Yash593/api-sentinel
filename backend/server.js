const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "API Sentinel",
    status: "running",
    message: "API Sentinel backend is alive"
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "api-sentinel-backend",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`API Sentinel backend running on port ${PORT}`);
});