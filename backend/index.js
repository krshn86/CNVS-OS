import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 8787;
app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);
app.listen(PORT, () => console.log(`CNVS OS audit-merged backend running on http://localhost:${PORT}`));
