import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authorsRouter from "./routes/authors";
import papersRouter from "./routes/papers";
import authRouter from "./routes/auth";
import favoritesRouter from "./routes/favorites";
import "dotenv/config";

const app = express();

app.use(
  cors({
    origin: "https://aimedrank.aimedlab.net",   // ← 唯一正確的 domain
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
  });
});

app.get("/__ping", (_req, res) => res.send("ok"));

app.use("/api/papers", papersRouter);
app.use("/api/authors", authorsRouter);
app.use("/api/auth", authRouter);
app.use("/api/favorites", favoritesRouter);

const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
