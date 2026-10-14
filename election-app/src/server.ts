// src/server.ts
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import morgan from "morgan";
import adminRoutes from "./routes/admin.routes";
import voteRoutes from "./routes/vote.routes";
import electionRoutes from "./routes/election.routes";

// Import Routes

// 1. Initialize Configuration
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware Setup
app.use(cors()); // Allow Cross-Origin requests
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // HTTP request logger

// 3. Health Check Route
app.get("/", (req: Request, res: Response) => {
  res.send({
    status: "OK",
    message: "Election System API is running",
  });
});

// 4. API Routes
app.use("/api/votes", voteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/election", electionRoutes);


// 5. Global Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${err.message}`);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// 6. Start Server
app.listen(PORT, () => {
  console.log(`\nServer is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
