import "dotenv/config";
import express from "express";
import cors from "cors";
import { query } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const prismWeights = { P: 0.25, R: 0.15, I: 0.2, S: 0.25, M: 0.15 };
const specialistPrismWeights = { P: 0.15, R: 0.1, I: 0.35, S: 0.15, M: 0.25 };

app.use(cors());
app.use(express.json());

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
      signal_id uuid references signals(id) on delete set null,
      title text not null,
      vendor_name text,
      stage text not null default 'To Review',
      owner text not null default 'Procurement Owner',
      due text not null default 'This week',
      action text,
      source text not null default 'manual',
      metadata jsonb not null default '{}'::jsonb,
      created_by text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists decisions (
      id uuid primary key default gen_random_uuid(),
      vendor_id uuid references vendors(id) on delete set null,
      action text not null,
      owner text not null default 'Procurement Owner',
      context text,
      status text not null default 'open',
      metadata jsonb not null default '{}'::jsonb,
      created_by text,
      created_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists idx_tasks_vendor_stage on tasks(vendor_id, stage)");
  await query("create index if not exists idx_decisions_vendor_created on decisions(vendor_id, created_at desc)");
}

function signalTemplates() {
  return {
    "vendor-pwc-india": [
      {
        title: "PwC India rate-card variance needs review",
