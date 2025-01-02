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
app.use(express.static(path.join(__dirname, "public")));

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

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

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

// Login route
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
            { expiresIn: "1h" }
          );

          // Set the JWT as a cookie
          res.cookie("auth_token", token);

          res.status(200).json({
            message: "Login successful!",
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
  const token = req.headers.cookie.split("=")[1];
  console.log(req.headers)
  console.log(token)
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

app.post("/api/placeorder", authenticateJWT, (req, res) => {
  const { cart, totalAmount } = req.body;

  if (!cart || !totalAmount || cart.length === 0) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  const userId = req.user.id; // Assuming `authenticateJWT` middleware adds `user` to the request
  const orderId = `ORD-${Date.now()}`; // Generate a unique order ID
  const orderDate = new Date().toISOString().split("T")[0]; // Today's date
  const deliveryDate = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ) // Delivery date: 7 days later
    .toISOString()
    .split("T")[0];
  const itemsJson = JSON.stringify(cart); // Convert cart to JSON string

  const query = `
    INSERT INTO orders (order_id, order_date, delivery_date, total_payment, items)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [orderId, orderDate, deliveryDate, totalAmount, itemsJson],
    (err) => {
      if (err) {
        console.error("Error inserting order:", err);
        return res.status(500).json({ message: "Failed to place order" });
      }

      res.status(200).json({
        message: "Order placed successfully!",
        orderId,
      });
    }
  );
});



app.get("/order.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "order.html"));
});

app.post("/place-order", authenticateJWT, (req, res) => {
  const { cart, totalAmount } = req.body;

  console.log("Cart received:", cart);
  console.log("Total Amount received:", totalAmount);

  if (!cart || cart.length === 0 || !totalAmount) {
      return res.status(400).json({ error: true, message: "Invalid order data" });
  }

  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const currentDate = new Date().toISOString().split("T")[0];
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const deliveryDateFormatted = deliveryDate.toISOString().split("T")[0];

  const itemsJSON = JSON.stringify(cart);

  console.log("Inserting into orders table:", {
      orderId,
      currentDate,
      deliveryDateFormatted,
      totalAmount,
      itemsJSON,
  });

  const orderQuery =
    "INSERT INTO orders (order_id, order_date, delivery_date, total_payment, items) VALUES (?, ?, ?, ?, ?)";
  connection.query(
      orderQuery,
      [orderId, currentDate, deliveryDateFormatted, totalAmount, itemsJSON],
      (err) => {
          if (err) {
              console.error("Error saving order:", err);
              return res.status(500).json({ error: true, message: "Failed to save order" });
          }

          console.log("Order successfully inserted.");
          res.status(200).json({
              message: "Order placed successfully!",
              orderId,
              orderDate: currentDate,
              deliveryDate: deliveryDateFormatted,
          });
      }
  );
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
