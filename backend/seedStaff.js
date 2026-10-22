require("dotenv").config();

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function seedStaff() {
  try {
    const name = "Admin Staff";
    const email = "staff@example.com";
    const password = process.env.STAFF_PASSWORD;

    if (!password) {
      throw new Error("STAFF_PASSWORD is missing from .env");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
  `INSERT INTO users (name, email, password_hash, role)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (email) DO NOTHING
   RETURNING id, name, email, role`,
  [name, email, passwordHash, "staff"]
);

if (result.rows.length > 0) {
  console.log("Staff account created:", result.rows[0]);
} else {
  console.log("Staff account already exists.");
}
  } catch (error) {
    console.error("Staff seeding failed:", error.message);
    process.exitCode = 1;
  }
  finally {
    await pool.end();
  }
}
seedStaff();