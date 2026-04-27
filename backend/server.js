import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";

import { createRFQ, getRFQs, getRFQDetails } from "./controllers/rfqController.js";
import { placeBid } from "./controllers/bidController.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pkg;

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

app.post("/rfq/create", createRFQ);

app.post("/rfq/:rfqId/bid", placeBid);

app.get("/rfq", getRFQs);

app.get("/rfq/:rfqId", getRFQDetails);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
