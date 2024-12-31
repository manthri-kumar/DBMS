const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve all static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Root route to serve login.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1);
  }
  console.log("Connected to the MySQL database.");
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Signup route
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: true, message: "Please provide all fields" });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: true, message: "Invalid email format" });
  }

  connection.query("SELECT * FROM user WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Error checking user existence:", err);
      return res.status(500).json({ error: true, message: "Database error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: true, message: "User already exists" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql_query = "INSERT INTO user (username, email, password) VALUES (?, ?, ?)";
      connection.query(sql_query, [name, email, hashedPassword], (err) => {
        if (err) {
          console.error("Error inserting data:", err);
          return res.status(500).json({ error: true, message: "Database error" });
        }
        res.status(201).json({ message: "User registered successfully!" });
      });
    } catch (error) {
      console.error("Error hashing password:", error);
      res.status(500).json({ error: true, message: "Server error" });
    }
  });
});

// Login route with JWT token
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: true, message: "Please provide both username and password" });
  }

  const loginQuery = "SELECT * FROM user WHERE username = ?";
  connection.query(loginQuery, [username], (err, results) => {
    if (err) {
      console.error("Error querying data:", err);
      return res.status(500).json({ error: true, message: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return res.status(500).json({ error: true, message: "Server error" });
        }

        if (isMatch) {
          const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" } // Token expires in 1 hour
          );
          res.status(200).json({
            message: "Login successful!",
            token,
            user: { username: user.username, email: user.email },
          });
        } else {
          res.status(401).json({ error: true, message: "Invalid username or password" });
        }
      });
    } else {
      res.status(401).json({ error: true, message: "Invalid username or password" });
    }
  });
});

// Middleware to authenticate JWT token
const authenticateJWT = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Get token from "Authorization: Bearer token"

  if (!token) {
    return res.status(403).json({ error: true, message: "Access denied" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: true, message: "Invalid token" });
    }

    req.user = user;
    next();
  });
};

// Cart HTML Route (User must be logged in to view cart)
app.get("/cart", authenticateJWT, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cart.html"));
});

// Add to Cart Route (User must be logged in)
app.post("/cart", authenticateJWT, (req, res) => {
  const { name, price, quantity } = req.body;
  const userId = req.user.userId;

  if (!name || !price || !quantity) {
    return res.status(400).json({ error: true, message: "Please provide product name, price, and quantity" });
  }

  const query = "INSERT INTO cart (user_id, name, price, quantity) VALUES (?, ?, ?, ?)";
  connection.query(query, [userId, name, price, quantity], (err) => {
    if (err) {
      console.error("Error adding to cart:", err);
      return res.status(500).json({ error: true, message: "Failed to add item to cart" });
    }
    res.json({ message: "Item added to cart successfully!" });
  });
});

// Fetch Cart Items Route (User must be logged in)
app.get("/getcartItems", authenticateJWT, (req, res) => {
  const userId = req.user.userId;

  const query = "SELECT * FROM cart WHERE user_id = ?";
  connection.query(query, [userId], (err, rows) => {
    if (err) {
      console.error("Error fetching cart items:", err);
      return res.status(500).json({ error: true, message: "Failed to fetch cart items" });
    }
    res.json(rows);
  });
});

// Update Cart Item Quantity (User must be logged in)
app.put("/cart/:id", authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const userId = req.user.userId;

  if (!quantity) {
    return res.status(400).json({ error: true, message: "Please provide a quantity" });
  }

  const query = "UPDATE cart SET quantity = ? WHERE cart_id = ? AND user_id = ?";
  connection.query(query, [quantity, id, userId], (err) => {
    if (err) {
      console.error("Error updating cart item:", err);
      return res.status(500).json({ error: true, message: "Failed to update cart item" });
    }
    res.json({ message: "Cart item updated successfully!" });
  });
});

// Remove Item from Cart (User must be logged in)
app.delete("/cart/:id", authenticateJWT, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const query = "DELETE FROM cart WHERE cart_id = ? AND user_id = ?";
  connection.query(query, [id, userId], (err) => {
    if (err) {
      console.error("Error deleting cart item:", err);
      return res.status(500).json({ error: true, message: "Failed to delete cart item" });
    }
    res.json({ message: "Cart item deleted successfully!" });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
