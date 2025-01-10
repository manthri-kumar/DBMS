# E-Commerce Website Repository
Welcome to the E-Commerce Website project repository! This application is a robust, user-friendly platform designed for online shopping, enabling customers to browse products, manage their cart, and place orders seamlessly. Built using modern web technologies, the project emphasizes scalability, responsiveness, and secure interactions.

## 🚀 Features
### User-Centric
-**User Authentication**: Secure login and registration system.

-**Shopping Cart**: Effortlessly add, update, and remove items.

-**Order Processing**: Track orders with detailed summaries.
### Product Management
-**Dynamic Catalog**: CRUD operations for products and categories.

-**Seller Dashboard**: Sellers can add and manage their products.

### Advanced Functionalities
-**Search & Filters**: Find products by name, category, or price range.

-**Responsive Design**: Fully optimized for mobile, tablet, and desktop.

### 🛠️ Tech Stack
-**Frontend**:HTML5, CSS3, JavaScript: Core for structure and styling.

-**React**: Dynamic and responsive user interface.

-**Backend**:Node.js with backend services and API endpoints.

-**SQL Database**: Efficient data management for users, products, orders, and categories.
### 📂 Database Schema
#### Key Tables:
-**user**: Stores user credentials and account details.

-**categories**: Manages product categories.

-**products**: Includes product details like name, price, and images.

-**orders**: Tracks customer orders and their statuses.

-**order_items**: Stores individual items within an order.

-**seller_products**: Associates sellers with their products.
## Sample SQL Data
### The database.sql file contains:
-**Predefined categories**: 

Fruits, Vegetables, and Dairy Products.

Sample products, including prices and images.

Example user, order, and seller product data to get you started.
## 🧑‍💻 Usage
-**Browse the Product Catalog**: Explore categories like Fruits, Vegetables, and Dairy Products.

-**Manage Cart**: Add, update, or remove items from your shopping cart.

-**Place Orders**: View order summaries and manage transactions.

-**Admin Features**: Manage products and categories with CRUD operations.
## 🛡️ Security Highlights
-**Password Security**: Passwords are hashed using bcrypt for secure storage.

-**Authentication**: Handled with JWT (JSON Web Tokens) for secure sessions.

-**Database Security**: Parameterized queries prevent SQL injection attacks.
## Example Code Snippet (Database Query)
-- Retrieve all products and their associated categories

SELECT p.product_name, c.category_name, p.price, p.image_path

FROM products p

JOIN categories c ON p.category_id = c.category_id;

Thank you for exploring this project! Happy shopping and coding! 🎉
