import { exec } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { promisify } from 'util';

export const execAsync = promisify(exec);

export const DIST_DIR = "dist";
export const FULL_SUFFIX = "-full";
export const ALPHABETICAL_SUFFIX = "-a";
export const FORMAT_JSON = ".json";
export const FORMAT_JSON_MINIFIED = ".min.json";

export const BROTLI_COMMAND = "npx brotli-cli compress $1 -q 11";

export function ensureDistDir() {
    if (!existsSync(DIST_DIR)) {
        mkdirSync(DIST_DIR, { recursive: true });
    }
}

export async function saveToFiles(destination, fileName, fullObject, minifiedObject) {
    const prettyJsonPath = `${destination}/${fileName}${FORMAT_JSON}`;
    const minifiedJsonPath = `${destination}/${fileName}${FORMAT_JSON_MINIFIED}`;

    writeFileSync(prettyJsonPath, JSON.stringify(fullObject, null, 2));
    writeFileSync(minifiedJsonPath, JSON.stringify(minifiedObject));

    // Brotli at highest level (≈ 80 % smaller than pretty JSON)
    await execAsync(BROTLI_COMMAND.replace("$1", minifiedJsonPath));
} 