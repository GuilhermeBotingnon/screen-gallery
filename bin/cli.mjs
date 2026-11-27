#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, "../templates");

function printHelp() {
  console.log(`screen-gallery — Zero-config full-page dev gallery for Vite + React

Usage:
  screen-gallery init [options]

Options:
  --dir <path>   Target web app root (defaults to current directory)
  --force        Overwrite existing gallery files
  -h, --help     Show this help message
`);
}

function copyTemplates(targetDir, force) {
  const files = [
    ["gallery.html", "gallery.html"],
    ["src/gallery/main.tsx", "src/gallery/main.tsx"],
    ["src/gallery/Gallery.tsx", "src/gallery/Gallery.tsx"],
    ["src/gallery/stage.tsx", "src/gallery/stage.tsx"],
    ["src/gallery/catalog.ts", "src/gallery/catalog.ts"],
    ["src/gallery/catalog.test.ts", "src/gallery/catalog.test.ts"],
  ];

  let created = 0;
  let skipped = 0;

  for (const [srcRel, destRel] of files) {
    const src = path.join(templatesDir, srcRel);
    const dest = path.join(targetDir, destRel);
    if (fs.existsSync(dest) && !force) {
      console.log(`  skip  ${destRel} (already exists; use --force to overwrite)`);
      skipped++;
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`  write ${destRel}`);
    created++;
  }

  console.log(`\nDone: ${created} written, ${skipped} skipped.`);
  console.log("Start Vite and open: http://localhost:5173/gallery.html");
}

const args = process.argv.slice(2);
const cmd = args.find((a) => !a.startsWith("-"));

if (args.includes("-h") || args.includes("--help") || !cmd) {
  printHelp();
  process.exit(cmd ? 0 : 1);
}

if (cmd !== "init") {
  console.error(`Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}

const dirIdx = args.indexOf("--dir");
const targetDir = path.resolve(dirIdx !== -1 && args[dirIdx + 1] ? args[dirIdx + 1] : process.cwd());
const force = args.includes("--force");

copyTemplates(targetDir, force);
