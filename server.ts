import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard middleware
  app.use(express.json());
  app.use(cors());

  // Serve static files from the uploads directory for document views/downloads
  const uploadsPath = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath));

  // Import routers dynamically to ensure clean TypeScript/CJS imports
  const userRoutes = (await import("./server/routes/userRoutes")).default;
  const adminRoutes = (await import("./server/routes/adminRoutes")).default;
  const doctorRoutes = (await import("./server/routes/doctorRoutes")).default;

  // Mount API endpoints
  app.use("/api/user", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/doctor", doctorRoutes);

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Medicare Book API is active" });
  });

  // Centralized Error Handling Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Server Error:", err);
    res.status(500).json({
      message: "Something went wrong on the server",
      success: false,
    });
  });

  // Serve frontend files (SPA) using Vite middleware or Static files
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
