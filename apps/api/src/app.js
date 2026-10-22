import express from "express";
import cors from "cors";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import routes from "./routes.js";
import { errorHandler } from "./middleware.js";

const rootEnv = resolve(fileURLToPath(new URL("../../..", import.meta.url)), ".env");
dotenv.config({ path: rootEnv });

export const app = express();

app.disable("x-powered-by");
app.use(cors({
  origin: process.env.WEB_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/v1", routes);
app.use((req, res) => res.status(404).json({
  error: { code: "NOT_FOUND", message: "Route not found." },
}));
app.use(errorHandler);
