document.addEventListener("DOMContentLoaded", () => {
    const cart = [];
    const searchToggle = document.getElementById("search-toggle");
    const searchBox = document.getElementById("search-box");
    const cartIcon = document.getElementById("cart-icon");
    const sidebar = document.getElementById("sidebar");
    const closeIcon = document.querySelector(".sider-close");
    const cartItems = document.querySelector(".cart-items");
    const cartTotal = document.querySelector(".cart-total");
    const checkoutButton = document.querySelector(".checkout");
    const inputBox = document.getElementById("input-box");
    const resultBox = document.querySelector(".result-box");
    const menuIcon = document.querySelector('.menu-icon');
    const availableKeywords = [
        'Vegetables',
        'Fruits',
        'Milk',
        'Banana',
    ];

    function navigateToLink(keyword) {
        let links = {
            'milk': 'file:///C:/Users/manth/OneDrive/Documents/My%20learning/Project/Daily%20Cart/DailyCart/product.html',
            'vegitables': 'file:///C:/Users/manth/OneDrive/Documents/My%20learning/Project/Daily%20Cart/DailyCart/Vegitable.htmll',
        };
        window.location.href = links[keyword];
      }
      

    if (searchToggle) {
        searchToggle.addEventListener("click", () => {
            searchBox.classList.toggle("active");
        });
    }

    if (cartIcon) {
        cartIcon.addEventListener("click", () => {
            sidebar.style.right = "0";
        });
    }

    if (closeIcon) {
        closeIcon.addEventListener("click", () => {
            sidebar.style.right = "-100%";
        });
    }

    document.addEventListener("DOMContentLoaded", function() {
        const addButtons = document.querySelectorAll(".fa-plus");
        const cartIcon = document.getElementById("cart-icon");
        const sidebar = document.getElementById("sidebar");
        let cartCount = 0;
    
        addButtons.forEach(button => {
            button.addEventListener("click", () => {
                cartCount++;
                updateCart();
            });
        });
    
        cartIcon.addEventListener("click", () => {
            sidebar.style.display = "block";
        });
    
        function updateCart() {
            const quantityElement = document.querySelector("#cart-icon .quantity");
            if (quantityElement) {
                quantityElement.textContent = cartCount;
                if (cartCount > 0) {
                    quantityElement.style.display = "block";
                } else {
                    quantityElement.style.display = "none";
                }
            }
        }
    
        window.closeSidebar = function() {
            sidebar.style.display = "none";
        };
    });
    

    document.querySelectorAll(".add .btn button").forEach(button => {
        button.addEventListener("click", event => {
            const card = event.currentTarget.closest(".card");
            const title = card.querySelector(".card-title").textContent;
            const price = card.querySelector(".card-price span").textContent;
            const item = cart.find(item => item.title === title);

            if (item) {
                item.quantity++;
            } else {
                cart.push({ title, price, quantity: 1 });
            }

            updateCart();
        });
    });

    function updateCart() {
        cartItems.innerHTML = "";
        let total = 0;

        cart.forEach(item => {
            const itemElement = document.createElement("div");
            itemElement.classList.add("cart-item");
            itemElement.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.price} x ${item.quantity}</p>
            `;

            cartItems.appendChild(itemElement);
            total += parseFloat(item.price.slice(1)) * item.quantity;
        });

        cartTotal.textContent = `$${total.toFixed(2)}`;
        document.querySelector(".cart .quantity").textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    }

    if (checkoutButton) {
        checkoutButton.addEventListener("click", () => {
            alert("Checkout not implemented.");
        });
    }


    function toggleMenu() {
        const dropdownMenu = document.getElementById("dropdownMenu");
        dropdownMenu.style.display = (dropdownMenu.style.display === "none" || dropdownMenu.style.display === "") ? "block" : "none";
    }

    if (menuIcon) {
        menuIcon.addEventListener('click', toggleMenu);
    }
});

let cart = []; // Array to store cart items
let totalAmount = 0; // Total amount in the cart

// Function to add items to the cart
function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.name === item.name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    updateCartDisplay();
}

// Function to update the cart display
function updateCartDisplay() {
    const cartItemsContainer = document.querySelector('.cart-items');
    cartItemsContainer.innerHTML = ''; // Clear current items
    totalAmount = 0; // Reset total amount

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.textContent = `${item.name} - $${item.price.toFixed(2)} x ${item.quantity}`;
        cartItemsContainer.appendChild(itemElement);

        totalAmount += item.price * item.quantity;
    });

    document.getElementById('total-amount').textContent = totalAmount.toFixed(2);
    document.querySelector('.quantity').textContent = cart.length;
}

// Function to close the cart sidebar
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.display = 'none';
}

// Function to toggle the cart sidebar
function toggleCart() {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.display = sidebar.style.display === 'block' ? 'none' : 'block';
}

// Attach event listeners to add buttons
document.querySelectorAll('.btn button').forEach((button, index) => {
    button.addEventListener('click', () => {
        const card = button.closest('.card');
        const itemName = card.querySelector('.card-title').textContent;
        const itemPrice = parseFloat(card.querySelector('.card-price span').textContent.replace('$', ''));

        addToCart({ name: itemName, price: itemPrice });
        toggleCart();
    });
});

// Add event listener for the cart icon button
document.getElementById('cart-icon').addEventListener('click', toggleCart)
