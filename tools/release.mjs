#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();

function read(file) {
  return readFileSync(join(ROOT, file), "utf8");
}

function write(file, content) {
  writeFileSync(join(ROOT, file), content, "utf8");
}

function getCurrentVersion() {
  const app = read("app.js");
  const match = app.match(/const APP_VERSION = "([^"]+)";/);
  if (!match) throw new Error("APP_VERSION bulunamadı.");
  return match[1];
}

function bumpVersion(version, mode) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Semver değil: ${version}`);
  }

  if (mode === "major") return `${parts[0] + 1}.0.0`;
  if (mode === "minor") return `${parts[0]}.${parts[1] + 1}.0`;
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

function copyDirRecursive(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });

  for (const entry of readdirSync(src)) {
    const from = join(src, entry);
    const to = join(dest, entry);

    if (statSync(from).isDirectory()) copyDirRecursive(from, to);
    else copyFileSync(from, to);
  }
}

function arg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

const explicitVersion = arg("--version");
const bumpMode = arg("--bump") || "patch";
const current = getCurrentVersion();
const next = explicitVersion || bumpVersion(current, bumpMode);

const replacements = [
  {
    file: "index.html",
    rules: [
      [/(\.\/style\.css\?v=)[^"]+/g, `$1${next}`],
      [/(\.\/app\.js\?v=)[^"]+/g, `$1${next}`]
    ]
  },
  {
    file: "style.css",
    rules: [[/Version:\s*[\d.]+/g, `Version: ${next}`]]
  },
  {
    file: "app.js",
    rules: [
      [/Version:\s*[\d.]+/g, `Version: ${next}`],
      [/const APP_VERSION = "[^"]+";/g, `const APP_VERSION = "${next}";`]
    ]
  },
  {
    file: "sw.js",
    rules: [
      [/Version:\s*[\d.]+/g, `Version: ${next}`],
      [/const APP_VERSION = "[^"]+";/g, `const APP_VERSION = "${next}";`],
      [/style\.css\?v=[\d.]+/g, `style.css?v=${next}`],
      [/app\.js\?v=[\d.]+/g, `app.js?v=${next}`]
    ]
  },
  {
    file: "README_DEPLOY.md",
    optional: true,
    rules: [[/Sürüm:\s*[\d.]+/g, `Sürüm: ${next}`]]
  },
  {
    file: "PUBLISH_CHECKLIST.md",
    optional: true,
    rules: [[/Sürüm:\s*[\d.]+/g, `Sürüm: ${next}`]]
  }
];

for (const item of replacements) {
  const path = join(ROOT, item.file);
  if (!existsSync(path)) {
    if (item.optional) continue;
    throw new Error(`Dosya bulunamadı: ${item.file}`);
  }

  let content = read(item.file);
  for (const [pattern, replacement] of item.rules) {
    content = content.replace(pattern, replacement);
  }
  write(item.file, content);
}

execFileSync("node", ["--check", "app.js"], { stdio: "inherit" });
execFileSync("node", ["--check", "sw.js"], { stdio: "inherit" });

const dist = join(ROOT, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const file of [
  "index.html",
  "style.css",
  "app.js",
  "sw.js",
  "manifest.json",
  "menu.json",
  "brand.json",
  "README_DEPLOY.md",
  "PUBLISH_CHECKLIST.md",
  "TEST_CHECKLIST.md"
]) {
  const src = join(ROOT, file);
  if (existsSync(src)) copyFileSync(src, join(dist, file));
}

copyDirRecursive(join(ROOT, "assets"), join(dist, "assets"));

console.log(`QUPPA release hazır: ${current} → ${next}`);
console.log("Kontrol: node --check app.js && node --check sw.js");
console.log("Yayın klasörü: ./dist");
