const express = require("express");
const mongoose = require("mongoose");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./authentication/models/User");
const authRoutes = require("./authentication/routes/authRoutes");
const accountRoutes = require("./authentication/routes/accountRoutes");
const botRoutes = require("./authentication/routes/botRoutes");
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize admin user function
async function initializeAdmin() {
  try {
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
  } catch (error) {
    console.error("Error initializing admin user:", error);
  }
}

// MongoDB connection
mongoose
  .connect("mongodb+srv://kamel:kamel@cluster0.wejj0ir.mongodb.net/trading")
  .then(async () => {
    console.log("MongoDB connected");
    // Initialize admin user after successful database connection
    await initializeAdmin();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Forex Trading Bot API",
      version: "1.0.0",
      description: "API documentation for Forex Trading Bot",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./authentication/routes/*.js"], // Path to the API routes
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Use authentication routes
app.use("/auth", authRoutes);

// Use account routes
app.use("/account", accountRoutes);

// Use bot routes
app.use("/bot", botRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
