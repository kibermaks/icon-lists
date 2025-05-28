import { readFileSync } from "fs";
import { readAllMetadata } from "./helpers/readAllMetadata.mjs";
import { SetProcessor } from "./set-processor.js";

const ICONS_DIR = "lucide/icons";
const CATEGORIES_DIR = "lucide/categories";
const MATERIAL_DATA_PATH = "dist/material-combined-full.min.json";

const OUTPUT_NAME_LUCIDE_ICONS = "lucide-icons";

export class LucideProcessor extends SetProcessor {
    constructor() {
        super();
        this.categoriesMapping = {};
        this.materialPopularity = {};
    }

    async _fetchData() {
        const iconsMetadata = await readAllMetadata(ICONS_DIR);
        const lucideRawData = Object.keys(iconsMetadata).map((key) => {
            return {
                name: key,
                categories: iconsMetadata[key].categories,
                tags: iconsMetadata[key].tags,
            };
        });

        const categories = await readAllMetadata(CATEGORIES_DIR);
        this.categoriesMapping = Object.keys(categories).reduce((acc, key) => {
            acc[key] = categories[key].title;
            return acc;
        }, {});

        try {
            const materialFileContent = readFileSync(MATERIAL_DATA_PATH, "utf-8");
            const materialJson = JSON.parse(materialFileContent);
            this.materialPopularity = materialJson.icons.sort((a, b) => b.p - a.p).reduce((acc, i) => {
                i.t.forEach(t => {
                    if (!acc[t]) {
                        acc[t] = i.p;
                    }
                });
                return acc;
            }, {});
        } catch (error) {
            console.error(`LucideProcessor: Error reading or parsing ${MATERIAL_DATA_PATH}:`, error);
            this.materialPopularity = {};
        }

        return lucideRawData;
    }

    _validateData(data) {
        return null;
    }

    _transformData(data) {
        console.log(`Lucide: Total icons count: ${data.length}`);

        const icons = data.reduce((acc, i) => {
            const friendlyName = i.name.replace(/-/g, " ");
            const lucideOriginalTags = Array.isArray(i.tags) ? i.tags : [];
            
            i.categories = Array.isArray(i.categories) ? i.categories.map((c) => this.categoriesMapping[c] || c) : [];
            i.tags = Array.from(new Set([friendlyName, ...lucideOriginalTags].map(t => String(t).toLowerCase()))).sort();

            i.popularity = i.tags.reduce((maxPop, lTag) => {
                const pop = this.materialPopularity[lTag] || 0;
                if (pop > 0) {
                    if (maxPop > 0) {
                        maxPop = Math.round((maxPop + pop) / 2);
                    }
                    else {
                        maxPop = pop;
                    }
                }
                return maxPop;
            }, 0);

            acc.push(i);
            return acc;
        }, []);
        return icons;
    }

    async _process(data) {
        await this._layoutAndSaveIconsInSuitableFormats(data, OUTPUT_NAME_LUCIDE_ICONS);
    }
} 