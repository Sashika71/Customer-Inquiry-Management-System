
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


app.locals.pool = pool;


app.get("/", (req, res) => {
  res.send("Customer Inquiry Management System API is running!");
});


const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const inquiryRoutes = require("./routes/inquiryRoutes");
app.use("/api/inquiries", inquiryRoutes);




app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Neon database connected successfully!");
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
});
