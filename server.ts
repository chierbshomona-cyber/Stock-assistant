import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import cron from "node-cron";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple file-based storage for stocks
  const STOCKS_FILE = path.join(process.cwd(), "stocks.json");
  const REPORTS_FILE = path.join(process.cwd(), "reports.json");

  if (!fs.existsSync(STOCKS_FILE)) {
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(["AAPL", "TSLA", "NVDA"]));
  }
  if (!fs.existsSync(REPORTS_FILE)) {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify([]));
  }

  // API Routes
  app.get("/api/stocks", (req, res) => {
    const stocks = JSON.parse(fs.readFileSync(STOCKS_FILE, "utf-8"));
    res.json(stocks);
  });

  app.post("/api/stocks", (req, res) => {
    const { stocks } = req.body;
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(stocks));
    res.json({ success: true });
  });

  app.get("/api/reports", (req, res) => {
    const reports = JSON.parse(fs.readFileSync(REPORTS_FILE, "utf-8"));
    res.json(reports);
  });

  // Placeholder for the AI calculation logic
  // In a real app, this would call the Gemini service
  const runDailyAnalysis = async () => {
    console.log("Running daily analysis at 9:00 AM...");
    // This will be triggered by the frontend or cron
  };

  // Schedule task at 9:00 AM daily
  cron.schedule("0 9 * * *", () => {
    runDailyAnalysis();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
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

startServer();
