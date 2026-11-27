#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, "../templates");

function printHelp() {
  console.log(`screen-gallery — Zero-config full-page dev gallery for Vite & Next.js

Usage:
  screen-gallery init [--framework vite|next] [--dir <path>] [--force]
  screen-gallery install-skill [--agent all|antigravity|claude|codex|cursor] [--dir <path>]
  screen-gallery add-screen <name> [--group <group>] [--path <route>] [--auth] [--dir <path>]
  screen-gallery add-component <name> [--group <group>] [--dir <path>]
  screen-gallery check [--dir <path>]

Commands:
  init            Scaffold gallery files (auto-detects Vite vs Next.js unless --framework is passed)
  install-skill   Install skill/rules into .agents, .claude, .codex, and/or .cursor in target project
  add-screen      Print a ready-to-paste screen entry for src/gallery/catalog.ts
  add-component   Print a ready-to-paste isolated component entry for src/gallery/catalog.ts
  check           Verify required gallery files exist in the target directory
`);
}

function getFlag(args, flag, fallback = undefined) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith("-") ? args[idx + 1] : fallback;
}

function detectFramework(targetDir) {
  const files = fs.existsSync(targetDir) ? fs.readdirSync(targetDir) : [];
  if (files.some((f) => /^next\.config\./.test(f))) return "next";
  return "vite";
}

function copyTemplates(targetDir, framework, force) {
  const common = [
    ["src/gallery/Gallery.tsx", "src/gallery/Gallery.tsx"],
    ["src/gallery/stage.tsx", "src/gallery/stage.tsx"],
    ["src/gallery/catalog.ts", "src/gallery/catalog.ts"],
    ["src/gallery/catalog.test.ts", "src/gallery/catalog.test.ts"],
  ];

  const viteFiles = [
    ["gallery.html", "gallery.html"],
    ["src/gallery/main.tsx", "src/gallery/main.tsx"],
  ];

  const hasSrcApp = fs.existsSync(path.join(targetDir, "src/app"));
  const nextAppBase = hasSrcApp ? "src/app/gallery/page.tsx" : "app/gallery/page.tsx";
  const nextFiles = [
    ["next/app/gallery/page.tsx", nextAppBase],
    ["next/NextGalleryApp.tsx", "src/gallery/NextGalleryApp.tsx"],
  ];

  const files = [...common, ...(framework === "next" ? nextFiles : viteFiles)];

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
    if (framework === "next" && srcRel === "src/gallery/stage.tsx") {
      const content = fs
        .readFileSync(src, "utf8")
        .replace('import App from "../App";', 'import App from "./NextGalleryApp";');
      fs.writeFileSync(dest, content);
    } else if (framework === "next" && srcRel === "next/app/gallery/page.tsx" && hasSrcApp) {
      const content = fs
        .readFileSync(src, "utf8")
        .replaceAll("../../src/gallery/", "../../gallery/");
      fs.writeFileSync(dest, content);
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`  write ${destRel}`);
    created++;
  }

  console.log(`\nDone (${framework}): ${created} written, ${skipped} skipped.`);
  if (framework === "next") {
    console.log("Start Next.js dev server and open: http://localhost:3000/gallery");
  } else {
    console.log("Start Vite and open: http://localhost:5173/gallery.html");
  }
}

function cmdAddScreen(args) {
  const name = args.filter((a) => !a.startsWith("-"))[1];
  if (!name) {
    console.error("Missing screen name. Example: screen-gallery add-screen Billing --path /billing --auth");
    process.exit(1);
  }
  const group = getFlag(args, "--group", args.includes("--auth") ? "Authenticated" : "Visitor");
  const route = getFlag(args, "--path", `/${name.toLowerCase().replace(/\s+/g, "-")}`);
  const isAuth = args.includes("--auth");

  const authApi = isAuth
    ? `        "GET /api/me": { body: { id: "user-1", name: "Alex Silva", email: "alex.silva@example.test", role: "member" } },`
    : `        "GET /api/me": { status: 401, body: { error: "unauthorized" } },`;

  console.log(`// Add inside group "${group}" in src/gallery/catalog.ts:
{
  name: "${name}",
  description: "${name} screen.",
  path: "${route}",
  api: {
${authApi}
  },
  states: [
    {
      name: "loading",
      description: "Pending data state.",
      api: { "GET /api/me": { pending: true } },
    },
    {
      name: "offline",
      description: "Network error state.",
      api: { "GET /api/me": { networkError: true } },
    },
  ],
},`);
}

function cmdAddComponent(args) {
  const name = args.filter((a) => !a.startsWith("-"))[1];
  if (!name) {
    console.error("Missing component name. Example: screen-gallery add-component PricingCard");
    process.exit(1);
  }
  const group = getFlag(args, "--group", "Components");

  console.log(`// Add inside group "${group}" in src/gallery/catalog.ts:
{
  name: "${name}",
  description: "Isolated ${name} component preview.",
  component: async () => (await import("../components/${name}")).${name},
},`);
}

function cmdCheck(targetDir) {
  const framework = detectFramework(targetDir);
  const hasSrcApp = fs.existsSync(path.join(targetDir, "src/app"));
  const required = [
    "src/gallery/Gallery.tsx",
    "src/gallery/stage.tsx",
    "src/gallery/catalog.ts",
    "src/gallery/catalog.test.ts",
    ...(framework === "next"
      ? [hasSrcApp ? "src/app/gallery/page.tsx" : "app/gallery/page.tsx", "src/gallery/NextGalleryApp.tsx"]
      : ["gallery.html", "src/gallery/main.tsx"]),
  ];
  let missing = 0;
  for (const rel of required) {
    const ok = fs.existsSync(path.join(targetDir, rel));
    console.log(`  ${ok ? "ok   " : "miss "} ${rel}`);
    if (!ok) missing++;
  }
  if (missing > 0) process.exit(1);
}

function cmdInstallSkill(targetDir, agent) {
  const repoRoot = path.resolve(__dirname, "..");
  const targets = agent === "all" ? ["antigravity", "claude", "codex", "cursor"] : [agent];
  const copySkill = (dest) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of ["SKILL.md", "AGENTS.md", "CLAUDE.md", "bin", "templates"]) {
      fs.cpSync(path.join(repoRoot, item), path.join(dest, item), { recursive: true });
    }
    console.log(`  install ${path.relative(targetDir, dest)}`);
  };

  for (const t of targets) {
    if (t === "antigravity") copySkill(path.join(targetDir, ".agents/skills/screen-gallery"));
    else if (t === "claude") copySkill(path.join(targetDir, ".claude/skills/screen-gallery"));
    else if (t === "codex") copySkill(path.join(targetDir, ".codex/skills/screen-gallery"));
    else if (t === "cursor") {
      const dest = path.join(targetDir, ".cursor/rules/screen-gallery.mdc");
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(repoRoot, ".cursor/rules/screen-gallery.mdc"), dest);
      console.log(`  install ${path.relative(targetDir, dest)}`);
    } else {
      console.error(`Unknown agent: ${t}. Use all, antigravity, claude, codex, or cursor.`);
      process.exit(1);
    }
  }
}

const args = process.argv.slice(2);
const cmd = args.find((a) => !a.startsWith("-"));

if (args.includes("-h") || args.includes("--help") || !cmd) {
  printHelp();
  process.exit(cmd ? 0 : 1);
}

const targetDir = path.resolve(getFlag(args, "--dir", process.cwd()));
const framework = getFlag(args, "--framework", detectFramework(targetDir));

if (cmd === "init") copyTemplates(targetDir, framework, args.includes("--force"));
else if (cmd === "install-skill") cmdInstallSkill(targetDir, getFlag(args, "--agent", "all"));
else if (cmd === "add-screen") cmdAddScreen(args);
else if (cmd === "add-component") cmdAddComponent(args);
else if (cmd === "check") cmdCheck(targetDir);
else {
  console.error(`Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}
