import Ajv2020 from "ajv/dist/2020.js";
import { ALPHABETICAL_SUFFIX, DIST_DIR, FULL_SUFFIX, saveToFiles } from "./utils.js";


export class SetProcessor {
    constructor(includePopularity = true) {
        this.ajv = new Ajv2020();
        this.includePopularity = includePopularity;
        this.rawData = [];
        this.data = [];
    }

    async _fetchData() {
        console.warn("fetchData method should be overridden in the subclass");
        return [];
    }

    _validateData(data) {
        console.warn("validateData method should be overridden in the subclass");
        return null;
    }

    _transformData(data) {
        console.warn("transformData method should be overridden in the subclass");
        return data;
    }
    
    async execute() {
        let resultError = null;
        this.rawData = await this._fetchData();
        if (this.rawData) {
            resultError = this._validateData(this.rawData);
        }
        if (!resultError) {
            this.data = this._transformData(this.rawData);
            await this._process(this.data);
        }
        return {
            success: !resultError,
            error: resultError,
        };
    }

    async _process(data) {
        console.warn("process method should be overridden in the subclass");
        return;
    }

    async _layoutAndSaveIconsInSuitableFormats(icons, fileName) {
        console.log(`Processing ${icons.length} icons to ${fileName}...`);

        const iconsObject = icons.map((i) => {
            return {
                n: i.name,
                ...(this.includePopularity ? { p: i.popularity } : {}),
                c: i.categories,
                t: i.tags,
            }
        });

        let countOfTags = 0;
        const countByCategories = iconsObject.reduce((acc, i) => {
            i.c.forEach((c) => {
                acc[c] = (acc[c] || 0) + 1;
            });
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

        let popularityOutput = [];
        if (this.includePopularity) {
            const iconsByPopularity = [...iconsObject].sort((a, b) => b.p - a.p || a.n.localeCompare(b.n));
            popularityOutput = iconsByPopularity.map((i) => (i.n));
        }

        await Promise.all([
            saveToFiles(DIST_DIR, fileName + FULL_SUFFIX, fullOutput, fullOutput),
            ...(this.includePopularity ? [saveToFiles(DIST_DIR, fileName, popularityOutput, popularityOutput)] : []),
            saveToFiles(DIST_DIR, fileName + ALPHABETICAL_SUFFIX, normalOutput, normalOutput)
        ]);
    }
}