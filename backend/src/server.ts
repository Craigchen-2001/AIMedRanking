import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authorsRouter from "./routes/authors";
import papersRouter from "./routes/papers";
import authRouter from "./routes/auth";
import favoritesRouter from "./routes/favorites";
import "dotenv/config";

const app = express();

// CORS – 必須明確列出正式 domain + 啟用 credentials
app.use(cors({
  origin: [
    "https://aimedrank.aimedlab.net",
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Root route
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
    routes: [
      "/__ping",
      "/api/papers",
      "/api/papers/:id",
      "/papers",
      "/papers/:id",
      "/api/authors",
      "/authors",
      "/api/auth",
      "/auth",
      "/api/favorites",
      "/favorites"
    ]
  });
});

app.get("/__ping", (_req, res) => res.send("ok"));

// All routes
app.use("/papers", papersRouter);
app.use("/api/papers", papersRouter);
app.use("/authors", authorsRouter);
app.use("/api/authors", authorsRouter);
app.use("/auth", authRouter);
app.use("/api/auth", authRouter);
app.use("/favorites", favoritesRouter);
app.use("/api/favorites", favoritesRouter);

// Start server
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
