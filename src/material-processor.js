import { readFileSync } from "fs";
import fetch from "node-fetch";
import { SetProcessor } from "./set-processor.js";

const SOURCE_MATERIAL = "https://fonts.google.com/metadata/icons?&key=material_symbols&incomplete=true";
const SOURCE_MATERIAL_SCHEMA = "src/material-schema.json";

const OUTPUT_NAME_MATERIAL_COMBINED = "material-combined";
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

export class MaterialProcessor extends SetProcessor {
    constructor() {
        super();
        this.combinedCategories = {
			...CATEGORIES_MAPPING_MATERIAL_ICONS,
			...CATEGORIES_MAPPING_MATERIAL_SYMBOLS,
		};
    }

    async _fetchData() {
        const raw = await fetch(SOURCE_MATERIAL).then((r) => r.text());
        return JSON.parse(raw.replace(/^[^\n]*\n/, ""));
    }

    _validateData(data) {
        const validate = this.ajv.compile(JSON.parse(readFileSync(SOURCE_MATERIAL_SCHEMA, "utf-8")));
        if (!validate(data)) {
            console.error(validate.errors);
            return new Error(`Schema validation failed for ${this.name}`);
        }
        return null;
    }

    _transformData(data) {
        console.log(`Material: Total icons count: ${data.icons.length}`);

        const icons = data.icons.reduce((acc, i) => {
            if (i.unsupported_families.length === 3 || i.unsupported_families.length === 5) {
                i.name = i.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                i.categories = i.categories.map((c) => this.combinedCategories[c] || c);
                i.tags = Array.from(new Set([i.name, ...i.tags].map(tag => tag.toLowerCase()))).sort();
                acc.push(i);
            }
            return acc;
        }, []);
        return icons;
    }

    async _process(data) {
        const icons = data.filter((i) => i.unsupported_families.length === 3);
        const symbols = data.filter((i) => i.unsupported_families.length === 5);

        await Promise.all([
            this._layoutAndSaveIconsInSuitableFormats(data, OUTPUT_NAME_MATERIAL_COMBINED),
            this._layoutAndSaveIconsInSuitableFormats(icons, OUTPUT_NAME_MATERIAL_ICONS),
            this._layoutAndSaveIconsInSuitableFormats(symbols, OUTPUT_NAME_MATERIAL_SYMBOLS),
        ]);
    }
} 