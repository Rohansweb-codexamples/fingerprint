const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        server: "Fingerprint Manager",
        time: new Date().toISOString()
    });
});

app.get("/api", (req, res) => {
    res.json({
        message: "Fingerprint Manager API",
        status: "online"
    });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
