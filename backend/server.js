import "dotenv/config";
import express from "express";
import cors from "cors";
import { query } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const prismWeights = { P: 0.25, R: 0.15, I: 0.2, S: 0.25, M: 0.15 };
const specialistPrismWeights = { P: 0.15, R: 0.1, I: 0.35, S: 0.15, M: 0.25 };

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const evidenceMaxBytes = 3 * 1024 * 1024;
const evidenceExtensions = new Set(["pdf", "docx", "xlsx", "csv", "pptx", "txt", "png", "jpg", "jpeg", "webp"]);

function prepareEvidenceAttachment(attachment) {
  if (!attachment) return null;
  const fileName = String(attachment.fileName || "").split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
  const extension = fileName.split(".").pop().toLowerCase();
  if (!fileName || !evidenceExtensions.has(extension)) {
    const error = new Error("Unsupported evidence document type");
    error.statusCode = 400;
    throw error;
  }
  const match = String(attachment.dataUrl || "").match(/^data:([^;]+);base64,([a-zA-Z0-9+/=\r\n]+)$/);
  if (!match) {
    const error = new Error("Evidence document content is missing or invalid");
    error.statusCode = 400;
    throw error;
  }
  const fileData = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!fileData.length || fileData.length > evidenceMaxBytes) {
    const error = new Error("Evidence documents must be between 1 byte and 3 MB");
    error.statusCode = 400;
    throw error;
  }
  return {
    fileName,
    mimeType: String(attachment.mimeType || match[1] || "application/octet-stream").slice(0, 120),
    sizeBytes: fileData.length,
    category: String(attachment.category || "Supporting evidence").slice(0, 120),
    confidentiality: String(attachment.confidentiality || "Internal").slice(0, 40),
    owner: String(attachment.owner || "").slice(0, 160),
    expiryDate: attachment.expiryDate || null,
    fileData
  };
}

app.get("/api/render-health", (_req, res) => {
  res.json({
    ok: true,
    service: "GSIL Backend",
    mode: "render-startup",
    time: new Date().toISOString()
  });
});

function clampScore(value) {
  return Math.max(1, Math.min(10, Number(value)));
}

function calculatePrismScore(dimensions, specialist = false) {
  const weights = specialist ? specialistPrismWeights : prismWeights;
  return Object.entries(weights).reduce((sum, [dimension, weight]) => {
    return sum + Number(dimensions[dimension] || 0) * weight;
  }, 0);
}

function statusFromScore(score) {
  if (score >= 7.5) return "green";
  if (score >= 6.7) return "amber";
  return "red";
}

function confidenceToTrustScore(confidence) {
  if (confidence === "High") return 88;
  if (confidence === "Low") return 46;
  return 70;
}

function trustScoreToConfidence(score) {
  if (score >= 80) return "High";
  if (score < 60) return "Low";
  return "Medium";
}

function clampTrustScore(value) {
  return Math.max(20, Math.min(98, Number(value)));
}

function actorFromRequest(req, fallback = "Backend Demo Reviewer") {
  return req.headers["x-gsil-user"] || req.body?.reviewer || fallback;
}

async function ensureOperationalTables() {
  await query(`
    create table if not exists tasks (
      id uuid primary key default gen_random_uuid(),
      vendor_id uuid references vendors(id) on delete set null,
