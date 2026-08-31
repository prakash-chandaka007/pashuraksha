import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ 
  path: path.resolve(__dirname, ".env"),
  override: true 
});

// Import Routers
import authRouter from "./routes/auth";
import uploadRouter from "./routes/upload";
import farmerRouter from "./routes/farmer";
import casesRouter from "./routes/cases";
import vetRouter from "./routes/vet";
import governmentRouter from "./routes/government";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Setup
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-side calls)
      if (!origin) return callback(null, true);
      
      // Check if the request is coming from localhost (any port)
      const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
      if (isLocalhost) {
        return callback(null, true);
      }
      
      return callback(new Error("CORS policy restriction: Origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Route Registrations
app.use("/api/auth", authRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/farmer", farmerRouter);
app.use("/api/cases", casesRouter);
app.use("/api/vet", vetRouter);
app.use("/api/cases", vetRouter); // Mount vet assessments (/api/cases/:id/assessment) on cases route namespace
app.use("/api/government", governmentRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Standalone Express backend server running on http://localhost:${PORT}`);
});
