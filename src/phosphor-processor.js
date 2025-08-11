// Dynamic Icon Lists. Copyright (C) 2025 Maksym Grigorash (@kibermaks).
// Licensed under the GNU GPL, Version 3 or later. See LICENSE file in root.

import { readFileSync } from "fs";
import { SetProcessor } from "./set-processor.js";

const PHOSPHOR_DATA_URL = "https://cdn.jsdelivr.net/gh/phosphor-icons/core@main/src/icons.ts";
const MATERIAL_DATA_PATH = "dist/material-combined-full.min.json";
const OUTPUT_NAME_PHOSPHOR_ICONS = "phosphor-icons";

const ICON_CATEGORY_MAPPING = {
  ARROWS: "Arrows",
  BRAND: "Brands",
  COMMERCE: "Commerce",
  COMMUNICATION: "Communication",
  DESIGN: "Design",
  DEVELOPMENT: "Technology & Development",
  EDITOR: "Editor",
  FINANCE: "Finances",
  GAMES: "Games",
  HEALTH: "Health & Wellness",
  MAP: "Maps & Travel",
  MEDIA: "Media",
  NATURE: "Nature",
  OBJECTS: "Objects",
  OFFICE: "Office",
  PEOPLE: "People",
  SYSTEM: "System",
  WEATHER: "Weather",
};

export class PhosphorProcessor extends SetProcessor {
    constructor() {
        super();
        this.materialPopularity = {};
    }

    async _fetchData() {
        let phosphorRawData;
        try {
            const response = await fetch(PHOSPHOR_DATA_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const fileContent = await response.text();
            const definitionStartMarker = "export const icons = (";
            const definitionEndMarker = ") satisfies readonly IconEntry[];";
            const defStartIndex = fileContent.indexOf(definitionStartMarker);
            if (defStartIndex === -1) throw new Error(`Could not find start: '${definitionStartMarker}'`);
            const defEndIndex = fileContent.lastIndexOf(definitionEndMarker);
            if (defEndIndex === -1 || defEndIndex <= defStartIndex) throw new Error(`Could not find end: '${definitionEndMarker}'`);
            let fullArrayContentString = fileContent.substring(defStartIndex + definitionStartMarker.length, defEndIndex);
            fullArrayContentString = fullArrayContentString.trim();
            let arrayString = fullArrayContentString;
            if (arrayString.startsWith("(") && arrayString.endsWith(")")) {
                arrayString = arrayString.substring(1, arrayString.length - 1).trim();
            }
            if (arrayString.toLowerCase().startsWith("<const>")) {
                arrayString = arrayString.substring("<const>".length).trim();
            }
            if (!arrayString.startsWith("[") || !arrayString.endsWith("]")) {
                console.error("Extracted string does not look like an array. First 100: " + arrayString.substring(0, 100));
                throw new Error("Extracted content does not form a valid array structure.");
            }

            // 1. Enum replacements
            arrayString = arrayString.replace(/IconCategory\.([A-Z_]+)/g, '"$1"');
            arrayString = arrayString.replace(/FigmaCategory\.([A-Z_]+)/g, '"$1"');

            // // 2. Basic comma cleanup (applied before key quoting)
            arrayString = arrayString.replace(/,{2,}/g, ','); // Consolidate multiple commas (e.g. ,, -> ,)
            arrayString = arrayString.replace(/([{[])\s*,+/g, '$1'); // Remove leading commas after { or [ (e.g. {,key -> {key)

            // 3. Quote all unquoted keys
            arrayString = arrayString.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":');

            // // 4. Final trailing comma cleanup (essential after quoting, for JSON.parse)
            arrayString = arrayString.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas (e.g. key:value,} -> key:value})
            try {
                phosphorRawData = JSON.parse(arrayString);
            } catch (parseError) {
                console.error("PhosphorProcessor: Failed to parse the extracted arrayString.", parseError);
                console.error("Problematic arrayString (first 500 chars):", arrayString.substring(0, 500));
                console.error("Problematic arrayString (last 500 chars):", arrayString.substring(Math.max(0, arrayString.length - 500)));
                throw new Error("Failed to parse extracted Phosphor icon data as JSON.");
            }

        } catch (error) {
            console.error(`PhosphorProcessor: Error fetching or parsing Phosphor icon data from ${PHOSPHOR_DATA_URL}:`, error);
            throw error; 
        }

        try {
            const materialFileContent = readFileSync(MATERIAL_DATA_PATH, "utf-8");
            const materialJson = JSON.parse(materialFileContent);
            this.materialPopularity = materialJson.icons.sort((a, b) => b.p - a.p).reduce((acc, i) => {
                i.t.forEach(t => { if (!acc[t]) { acc[t] = i.p; } });
                return acc;
            }, {});
        } catch (error) {
            console.error(`PhosphorProcessor: Error reading or parsing ${MATERIAL_DATA_PATH}:`, error);
            this.materialPopularity = {};
        }
        return phosphorRawData;
    }

    _validateData(data) {
        if (!Array.isArray(data)) {
            return "Data is not an array.";
        }
        if (data.length === 0) {
            return "Data array is empty.";
        }
        return null;
    }

    _transformData(data) {
        console.log(`Phosphor: Total icons count from _fetchData: ${data ? data.length : 0}`);
        let skippedCount = 0;

        const icons = data.reduce((acc, i) => {
            if (!i || !i.name || !i.pascal_name) {
                skippedCount++;
                return acc;
            }

            const friendlyName = i.name.replace(/-/g, " ");
            const phosphorOriginalTags = Array.isArray(i.tags) ? i.tags : [];
            
            let processedCategories = [];
            if (Array.isArray(i.categories)) {
                processedCategories = i.categories.map(catKey => {
                    return ICON_CATEGORY_MAPPING[catKey] || catKey;
                }).filter(cat => typeof cat === 'string');
            }

            const allTags = Array.from(
                new Set(
                    [friendlyName, ...phosphorOriginalTags]
                        .map(t => String(t).toLowerCase())
                        .filter(t => !(t.startsWith("*") && t.endsWith("*")))
                )
            ).sort();

            const popularity = allTags.reduce((maxPop, tag) => {
                const pop = this.materialPopularity[tag] || 0;
                if (pop > 0) {
                    if (maxPop > 0) {
                        maxPop = Math.round((maxPop + pop) / 2);
                    } else {
                        maxPop = pop;
                    }
                }
                return maxPop;
            }, 0);

            acc.push({
                name: i.name,
                categories: processedCategories,
                tags: allTags,
                popularity: popularity,
            });
            return acc;
        }, []);

        if (skippedCount > 0) {
            console.log(`Phosphor: Skipped ${skippedCount} icons during transformation.`);
        }
        return icons;
    }

    async _process(data) {
        await this._layoutAndSaveIconsInSuitableFormats(data, OUTPUT_NAME_PHOSPHOR_ICONS);
    }
}