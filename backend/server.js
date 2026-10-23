
require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    const result = await app.locals.pool.query("SELECT NOW()");
    console.log("Neon database connected successfully!");
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
});
