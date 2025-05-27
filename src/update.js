import Ajv2020 from "ajv/dist/2020.js";
import { exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import fetch from "node-fetch";
import { promisify } from 'util';

const execAsync = promisify(exec);

const DIST_DIR = "dist";
const FULL_SUFFIX = "-full";
const ALPHABETICAL_SUFFIX = "-a";
const FORMAT_JSON = ".json";
const FORMAT_JSON_MINIFIED = ".min.json";
// const FORMAT_BROTLI = "min.json.br";

const BROTLI_COMMAND = "npx brotli-cli compress $1 -q 11";

const SOURCE_MATERIAL = "https://fonts.google.com/metadata/icons?&key=material_symbols&incomplete=true";
const SOURCE_MATERIAL_SCHEMA = "src/material-schema.json";

const OUTPUT_NAME_MATERIAL_ICONS = "material-icons";
const OUTPUT_NAME_MATERIAL_SYMBOLS = "material-symbols";

const CATEGORIES_MAPPING_MATERIAL_ICONS = {
    "action": "Action",
    "alert": "Alert",
    "av": "Audio & Video",
    "communication": "Communication",
    "content": "Content",
    "device": "Device",
    "editor": "Editor",
    "file": "File",
    "hardware": "Hardware",
    "home": "Home",
    "image": "Image",
    "maps": "Maps",
    "navigation": "Navigation",
    "notification": "Notification",
    "places": "Places",
    "search": "Search",
    "social": "Social",
    "toggle": "Toggle",
};

const CATEGORIES_MAPPING_MATERIAL_SYMBOLS = {
    "Actions": "Actions",
    "Activities": "Activities",
    "Android": "Android",
    "Audio&Video": "Audio & Video",
    "Business": "Business",
    "Communicate": "Communicate",
    "Hardware": "Hardware",
    "Home": "Home",
    "Household": "Household",
    "Images": "Images",
    "Maps": "Maps",
    "Privacy": "Privacy",
    "Social": "Social",
    "Text": "Text",
    "Transit": "Transit",
    "Travel": "Travel",
    "UI actions": "UI actions",
};

// Ensure dist directory exists
if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
}

// 1. Grab the upstream file and strip the XSSI guard ")]}'"
const raw = await fetch(SOURCE_MATERIAL).then((r) => r.text());
const json = JSON.parse(raw.replace(/^[^\n]*\n/, ""));

const ajv = new Ajv2020();
const validate = ajv.compile(JSON.parse(readFileSync(SOURCE_MATERIAL_SCHEMA, "utf-8")));
if (!validate(json)) {
    console.error(validate.errors);
    throw new Error("Schema validation failed");
}

const allIconsLength = json.icons.length;
const iconsArray = json.icons.filter((i) => i.unsupported_families.length === 3);
const symbolsArray = json.icons.filter((i) => i.unsupported_families.length === 5);

console.log(`Total icons count: ${allIconsLength}`);
console.log(`Icons not supporting some families: ${allIconsLength - iconsArray.length - symbolsArray.length}`);

await layoutAndSaveIconsInSuitableFormats(iconsArray, OUTPUT_NAME_MATERIAL_ICONS, CATEGORIES_MAPPING_MATERIAL_ICONS);
await layoutAndSaveIconsInSuitableFormats(symbolsArray, OUTPUT_NAME_MATERIAL_SYMBOLS, CATEGORIES_MAPPING_MATERIAL_SYMBOLS);

async function layoutAndSaveIconsInSuitableFormats(icons, fileName, categoriesMapping) {
    console.log(`Processing ${icons.length} icons to ${fileName}...`);

    const iconsObject = icons.map((i) => {
        const name = i.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Prepare name for display
        const category = i.categories[0];
        const categoryName = categoriesMapping[category] || category;
        return {
            n: name,
            p: i.popularity,
            c: categoryName,
            t: i.tags,
        }
    });

    let countOfTags = 0;
    const countByCategories = iconsObject.reduce((acc, i) => {
        acc[i.c] = (acc[i.c] || 0) + 1;
        countOfTags += i.t.length;
        return acc;
    }, {});

    const categories = Object.entries(countByCategories).map(([category, count]) => ({
        n: category,
        c: count,
    })).sort((a, b) => a.n.localeCompare(b.n));

    const fullOutput = {
        countOfIcons: icons.length,
        countOfCategories: Object.keys(countByCategories).length,
        countOfTags,
        categories,
        icons: iconsObject,
    }
    const normalOutput = iconsObject.map((i) => (i.n));   

    const iconsByPopularity = [...iconsObject].sort((a, b) => b.p - a.p);
    const popularityOutput = iconsByPopularity.map((i) => (i.n));

    await Promise.all([
        saveToFiles(DIST_DIR, fileName + FULL_SUFFIX, fullOutput, fullOutput),
        saveToFiles(DIST_DIR, fileName, popularityOutput, popularityOutput),
        saveToFiles(DIST_DIR, fileName + ALPHABETICAL_SUFFIX, normalOutput, normalOutput)
    ]);

	// Output pretty + minified + brotli
	async function saveToFiles(destination, fileName, fullObject, minifiedObject) {
		writeFileSync(`${destination}/${fileName}${FORMAT_JSON}`, JSON.stringify(fullObject, null, 2));
		writeFileSync(`${destination}/${fileName}${FORMAT_JSON_MINIFIED}`, JSON.stringify(minifiedObject));

		// Brotli at highest level (≈ 80 % smaller than pretty JSON)
		await execAsync(BROTLI_COMMAND.replace("$1", `${destination}/${fileName}${FORMAT_JSON_MINIFIED}`));
	}
}
