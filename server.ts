import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware with high body limit to accommodate full-state sync
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Global server-side in-memory shared database state
  let sharedState: any = null;

  // Sync API endpoints
  app.get("/api/sync", (req, res) => {
    res.json(sharedState);
  });

  app.post("/api/sync", (req, res) => {
    sharedState = req.body;
    res.json({ success: true });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", synced: !!sharedState });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
