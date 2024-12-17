const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs");
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

// Signup route
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zAZ0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Check if user already exists
  connection.query("SELECT * FROM user WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Error checking user existence:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql_query = "INSERT INTO user (username, email, password) VALUES (?, ?, ?)";
      connection.query(sql_query, [name, email, hashedPassword], (err) => {
        if (err) {
          console.error("Error inserting data:", err);
          return res.status(500).json({ message: "Database error" });
        }
        res.status(201).json({ message: "User registered successfully!" });
      });
    } catch (error) {
      console.error("Error hashing password:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// Login route
app.post("/login", (req, res) => {
  const { firstName, password } = req.body;

  if (!firstName || !password) {
    return res.status(400).json({ message: "Please provide both username and password" });
  }

  const loginQuery = "SELECT * FROM user WHERE username = ?";
  connection.query(loginQuery, [firstName], (err, results) => {
    if (err) {
      console.error("Error querying data:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return res.status(500).json({ message: "Server error" });
        }

        if (isMatch) {
          res.status(200).json({
            message: "Login successful!",
            user: { username: user.username, email: user.email },
          });
        } else {
          res.status(401).json({ message: "Invalid username or password" });
        }
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  });
});

// Cart HTML Route
app.get("/cart", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cart.html"));
});

// Add to Cart Route
app.post("/cart", (req, res) => {
  const { name, price, quantity } = req.body;

  if (!name || !price || !quantity) {
    return res.status(400).json({ message: "Please provide product name, price, and quantity" });
  }

  const query = "INSERT INTO cart (name, price, quantity) VALUES (?, ?, ?)";
  connection.query(query, [name, price, quantity], (err, result) => {
    if (err) {
      console.error("Error adding to cart:", err);
      return res.status(500).json({ message: "Failed to add item to cart" });
    }
    res.json({ message: "Item added to cart successfully!" });
  });
});

// Fetch Cart Items Route
app.get("/getcartItems", (req, res) => {
  const query = "SELECT * FROM cart";

  connection.query(query, (err, rows) => {
    if (err) {
      console.error("Error fetching cart items:", err);
      return res.status(500).json({ message: "Failed to fetch cart items" });
    }
    res.json(rows);
  });
});

// Update Cart Item Quantity
app.put("/cart/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity) {
    return res.status(400).json({ message: "Please provide a quantity" });
  }

  const query = "UPDATE cart SET quantity = ? WHERE cart_id = ?";
  connection.query(query, [quantity, id], (err, result) => {
    if (err) {
      console.error("Error updating cart item:", err);
      return res.status(500).json({ message: "Failed to update cart item" });
    }
    res.json({ message: "Cart item updated successfully!" });
  });
});

// Remove Item from Cart
app.delete("/cart/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM cart WHERE cart_id = ?";
  
  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting cart item:", err);
      return res.status(500).json({ message: "Failed to delete cart item" });
    }
    res.json({ message: "Cart item deleted successfully!" });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
