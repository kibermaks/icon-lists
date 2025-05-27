import Ajv2020 from "ajv/dist/2020.js";
import { exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import fetch from "node-fetch";
import { promisify } from 'util';

const execAsync = promisify(exec);

const SOURCE = "https://fonts.google.com/metadata/icons";
const DIST_DIR = "dist";

// Ensure dist directory exists
if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
}

// 1. Grab the upstream file and strip the XSSI guard ")]}'"
const raw = await fetch(SOURCE).then((r) => r.text());
const json = JSON.parse(raw.replace(/^[^\n]*\n/, ""));

const ajv = new Ajv2020();
const validate = ajv.compile(JSON.parse(readFileSync("src/material-schema.json", "utf-8")));
if (!validate(json)) {
    console.error(validate.errors);
    throw new Error("Schema validation failed");
}

// 2. Keep ONLY what your consumers need
const icons = json.icons.map((i) => ({
	n: i.name, // 40 % smaller keys
	c: i.codepoint,
	v: i.version,
	t: i.tags,
	s: i.sizes_px,
}));

// 3. Output pretty + minified
writeFileSync(`${DIST_DIR}/material-icons.json`, JSON.stringify({ updated: Date.now(), icons }, null, 2));
writeFileSync(`${DIST_DIR}/material-icons.min.json`, JSON.stringify({ u: Date.now(), i: icons }));

// 4. Brotli at highest level (≈ 80 % smaller than pretty JSON)
await execAsync(`npx brotli-cli compress ${DIST_DIR}/material-icons.min.json -q 11`);
