///Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/src/index.ts
import express from "express";
import cors from "cors";
import authorsRouter from "./routes/authors.js";
import papersRouter from "./routes/papers.js";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use("/authors", authorsRouter);
app.use("/api/papers", papersRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
