#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();

function read(file) { return readFileSync(join(ROOT, file), "utf8"); }
function write(file, content) { writeFileSync(join(ROOT, file), content, "utf8"); }
function getCurrentVersion() {
  const match = read("app.js").match(/const APP_VERSION = "([^"]+)";/);
  if (!match) throw new Error("APP_VERSION bulunamadı.");
  return match[1];
}
function bumpVersion(version, mode) {
  const p = version.split(".").map(Number);
  if (mode === "major") return `${p[0] + 1}.0.0`;
  if (mode === "minor") return `${p[0]}.${p[1] + 1}.0`;
  return `${p[0]}.${p[1]}.${p[2] + 1}`;
}
function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
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

const current = getCurrentVersion();
const next = arg("--version") || bumpVersion(current, arg("--bump") || "patch");

const files = [
  ["index.html", [
    [/(\.\/style\.css\?v=)[^"]+/g, `$1${next}`],
    [/(\.\/app\.js\?v=)[^"]+/g, `$1${next}`],
    [/(\.\/admin\.css\?v=)[^"]+/g, `$1${next}`],
    [/(\.\/admin\.js\?v=)[^"]+/g, `$1${next}`]
  ]],
  ["admin.html", [
    [/(\.\/admin\.css\?v=)[^"]+/g, `$1${next}`],
    [/(\.\/admin\.js\?v=)[^"]+/g, `$1${next}`]
  ]],
  ["style.css", [[/Version:\s*[\d.]+/g, `Version: ${next}`]]],
  ["app.js", [[/Version:\s*[\d.]+/g, `Version: ${next}`], [/const APP_VERSION = "[^"]+";/g, `const APP_VERSION = "${next}";`]]],
  ["sw.js", [[/Version:\s*[\d.]+/g, `Version: ${next}`], [/const APP_VERSION = "[^"]+";/g, `const APP_VERSION = "${next}";`], [/style\.css\?v=[\d.]+/g, `style.css?v=${next}`], [/app\.js\?v=[\d.]+/g, `app.js?v=${next}`], [/admin\.css\?v=[\d.]+/g, `admin.css?v=${next}`], [/admin\.js\?v=[\d.]+/g, `admin.js?v=${next}`]]],
  ["README_DEPLOY.md", [[/Sürüm:\s*[\d.]+/g, `Sürüm: ${next}`]]],
  ["PUBLISH_CHECKLIST.md", [[/Sürüm:\s*[\d.]+/g, `Sürüm: ${next}`]]],
  ["ADMIN_GUIDE.md", [[/Sürüm:\s*[\d.]+/g, `Sürüm: ${next}`]]]
];

for (const [file, rules] of files) {
  const path = join(ROOT, file);
  if (!existsSync(path)) continue;
  let content = read(file);
  for (const [pattern, replacement] of rules) content = content.replace(pattern, replacement);
  write(file, content);
}

execFileSync("node", ["--check", "app.js"], { stdio: "inherit" });
execFileSync("node", ["--check", "sw.js"], { stdio: "inherit" });
execFileSync("node", ["--check", "admin.js"], { stdio: "inherit" });

const dist = join(ROOT, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const file of ["index.html","style.css","app.js","sw.js","manifest.json","menu.json","brand.json","admin.html","admin.css","admin.js","README_DEPLOY.md","PUBLISH_CHECKLIST.md","TEST_CHECKLIST.md","RELEASE_GUIDE.md","MENU_JSON_GUIDE.md","BRAND_JSON_GUIDE.md","IMAGE_ASSET_GUIDE.md","ADMIN_GUIDE.md"]) {
  const src = join(ROOT, file);
  if (existsSync(src)) copyFileSync(src, join(dist, file));
}
copyDirRecursive(join(ROOT, "assets"), join(dist, "assets"));
console.log(`QUPPA release hazır: ${current} → ${next}`);
console.log("Yayın klasörü: ./dist");
