const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcrypt");

async function initializeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      "mongodb+srv://kamel:kamel@cluster0.wejj0ir.mongodb.net/trading"
    );
    console.log("Connected to MongoDB");

    // Check if admin user exists
    const adminExists = await User.findOne({ username: "admin" });

    if (!adminExists) {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin", 10);
      const adminUser = new User({
        username: "admin",
        password: hashedPassword,
        balance: 100000,
        accountCurrency: "USD",
        isAdmin: true,
      });

      await adminUser.save();
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }

    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error initializing admin user:", error);
    process.exit(1);
  }
}

// Run the initialization
initializeAdmin();

module.exports = { initializeAdmin };
