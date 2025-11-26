DROP DATABASE IF EXISTS coffee_shop;
CREATE DATABASE coffee_shop;
USE coffee_shop;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user'
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category ENUM('coffee', 'tea', 'juice') NOT NULL,
    image VARCHAR(255),
    description TEXT
);

CREATE TABLE carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL, 
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- REVIEWS
CREATE TABLE reviews(
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    product_id BIGINT REFERENCES products(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    reply TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO products (name, price, category, image, description) VALUES
('Black Coffee', 2.90, 'coffee', 'images/drink-1.jpg', 'Traditional Vietnamese black coffee'),
('Milk Coffee', 3.50, 'coffee', 'images/drink-2.jpg', 'Vietnamese coffee with condensed milk'),
('Green Tea', 2.50, 'tea', 'images/drink-4.jpg', 'Fresh brewed green tea'),
('Orange Juice', 3.50, 'juice', 'images/drink-7.jpg', 'Fresh squeezed orange juice');

CREATE USER 'yourusername'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON *.* TO 'yourusername'@'localhost';
FLUSH PRIVILEGES;