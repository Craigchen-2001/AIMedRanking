import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authorsRouter from "./routes/authors.ts";
import papersRouter from "./routes/papers.ts";
import authRouter from "./routes/auth.ts";
import favoritesRouter from "./routes/favorites.ts";

const app = express();

const ORIGIN =
  process.env.SITE_ORIGIN ||
  process.env.FRONTEND_ORIGIN ||
  process.env.NEXT_PUBLIC_SITE_ORIGIN ||
  "http://localhost:3000";

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

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

app.use("/papers", papersRouter);
app.use("/api/papers", papersRouter);
app.use("/authors", authorsRouter);
app.use("/api/authors", authorsRouter);
app.use("/auth", authRouter);
app.use("/api/auth", authRouter);
app.use("/favorites", favoritesRouter);
app.use("/api/favorites", favoritesRouter);

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
