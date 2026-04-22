import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const sourceJs = resolve(root, "assets", "js");
const targetAssets = resolve(root, "dist", "assets");
const targetJs = resolve(targetAssets, "js");

if (!existsSync(sourceJs)) {
  process.exit(0);
}

if (!existsSync(targetAssets)) {
  mkdirSync(targetAssets, { recursive: true });
}

cpSync(sourceJs, targetJs, { recursive: true, force: true });
