
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Handle staff login requests.
async function login(req, res) {
  try {
    // Get the email and password sent by the frontend.
    const { email, password } = req.body;

    // Check whether both email and password are provided.
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find the user account using the provided email.
    
    const result = await req.app.locals.pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [email]
    );

    // Return an error if no account matches the email.
    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Get the user details returned by the database.
    const user = result.rows[0];

    // Compare the entered password with the hashed password
    
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    // Reject the login if the password is incorrect.
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check whether the JWT secret is configured on the server.
    
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    // Create a JSON Web Token containing the user's ID and role.
    // The token expires after one hour.
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return the token and basic user details after successful login.
    
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Log the error on the server for debugging.
    console.error("Login failed:", error.message);

    // Return a generic error message to the client.
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}


module.exports = { login };
