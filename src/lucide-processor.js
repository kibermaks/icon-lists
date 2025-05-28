import { IconProcessor } from "./icon-processor.js";

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

export const MaterialProcessorType = {
    ICONS: 'icons',
    SYMBOLS: 'symbols',
};
Object.freeze(MaterialProcessorType); // Make it immutable

export class MaterialProcessor extends IconProcessor {
    constructor(type) {
        let name;
        let categoriesMapping;
        let unsupportedFamiliesCount;

        if (type === MaterialProcessorType.ICONS) {
            name = OUTPUT_NAME_MATERIAL_ICONS;
            categoriesMapping = CATEGORIES_MAPPING_MATERIAL_ICONS;
            unsupportedFamiliesCount = 3;
        } else if (type === MaterialProcessorType.SYMBOLS) {
            name = OUTPUT_NAME_MATERIAL_SYMBOLS;
            categoriesMapping = CATEGORIES_MAPPING_MATERIAL_SYMBOLS;
            unsupportedFamiliesCount = 5;
        } else {
            throw new Error(`Unknown MaterialProcessor type: ${type}`);
        }

        super(name, SOURCE_MATERIAL, SOURCE_MATERIAL_SCHEMA, categoriesMapping);
        this.unsupportedFamiliesCount = unsupportedFamiliesCount;
    }

    filterIcons(allIcons) {
        const filtered = allIcons.filter((i) => i.unsupported_families.length === this.unsupportedFamiliesCount);
        console.log(`Total icons count from source for ${this.name}: ${allIcons.length}`);
        console.log(`Icons filtered out for ${this.name}: ${allIcons.length - filtered.length}`);
        return filtered;
    }
} 