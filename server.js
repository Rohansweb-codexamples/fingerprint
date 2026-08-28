const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      event_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "offline"
    });
  }
});

app.get("/api/visitors", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        visitor_id,
        event_id,
        created_at
      FROM visitors
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to load visitors"
    });
  }
});

app.post("/api/visitors", async (req, res) => {
  try {
    const {
      name,
      visitorId,
      eventId
    } = req.body;

    if (!name || !visitorId) {
      return res.status(400).json({
        error: "Name and visitor ID are required"
      });
    }

    const result = await pool.query(`
      INSERT INTO visitors
      (name, visitor_id, event_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [
      name.trim(),
      visitorId,
      eventId || null
    ]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to save visitor"
    });
  }
});

app.delete("/api/visitors/:id", async (req, res) => {
  try {

    await pool.query(
      "DELETE FROM visitors WHERE id = $1",
      [req.params.id]
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Unable to delete visitor"
    });
  }
});

app.delete("/api/visitors", async (req, res) => {
  try {

    await pool.query("DELETE FROM visitors");

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Unable to delete visitors"
    });
  }
});

const PORT = process.env.PORT || 10000;

setupDatabase()
  .then(() => {

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

  })
  .catch(error => {

    console.error(
      "Database setup failed:",
      error
    );

    process.exit(1);
  });
