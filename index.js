const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const JWT_SECRET = process.env.JWT_SECRET || "bunny-secret";

app.get("/", (req, res) => {
  res.json({
    name: "Bunny Pages API",
    status: "online"
  });
});

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users(username,email,password_hash)
       VALUES($1,$2,$3)
       RETURNING id,username,email`,
      [username, email, hash]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!user.rows.length) {
      return res.status(401).json({
        error: "Invalid login"
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!valid) {
      return res.status(401).json({
        error: "Invalid login"
      });
    }

    const token = jwt.sign(
      { id: user.rows[0].id },
      JWT_SECRET
    );

    res.json({
      token,
      username: user.rows[0].username
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM posts ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Bunny Pages API running");
});
