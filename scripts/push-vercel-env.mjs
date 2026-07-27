/**
 * Push required Auth/DB env vars from local .env into the linked Vercel project.
 * AUTH_URL / NEXTAUTH_URL are forced to the production hostname (never localhost).
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");
if (!existsSync(envPath)) {
  console.error("Missing .env");
  process.exit(1);
}

function parseEnv(text) {
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    map[m[1]] = v;
  }
  return map;
}

const local = parseEnv(readFileSync(envPath, "utf8"));
const prodUrl = "https://ai-developer-suite.vercel.app";
const pairs = [
  ["DATABASE_URL", local.DATABASE_URL],
  ["AUTH_SECRET", local.AUTH_SECRET],
  ["NEXTAUTH_SECRET", local.NEXTAUTH_SECRET || local.AUTH_SECRET],
  ["AUTH_URL", prodUrl],
  ["NEXTAUTH_URL", prodUrl],
];

for (const [name, value] of pairs) {
  if (!value) {
    console.error(`Missing local value for ${name}`);
    process.exit(1);
  }
}

const targets = ["production", "preview"];

for (const [name, value] of pairs) {
  for (const target of targets) {
    console.log(`Upserting ${name} -> ${target}`);
    const result = spawnSync(
      "npx",
      ["--yes", "vercel", "env", "add", name, target, "--force"],
      {
        cwd: root,
        input: value,
        encoding: "utf8",
        shell: true,
      },
    );
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0) {
      console.error(`Failed adding ${name} to ${target}`);
      process.exit(result.status ?? 1);
    }
  }
}

console.log("Done.");
