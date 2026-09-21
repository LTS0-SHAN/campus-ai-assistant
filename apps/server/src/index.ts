import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat";

const app = express();
app.use(cors());
app.use(express.json());
app.use(chatRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server running on :${PORT}`));
