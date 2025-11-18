import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authorsRouter from "./routes/authors.js";
import papersRouter from "./routes/papers.js";
import authRouter from "./routes/auth.js";
import favoritesRouter from "./routes/favorites.js";

const app = express();
const port = 3001;

app.use(
  cors({
    origin: [
      "https://aimedrank.aimedlab.net",
      "http://localhost:3000"
    ],
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/authors", authorsRouter);
app.use("/api/papers", papersRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
