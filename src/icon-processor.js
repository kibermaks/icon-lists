import Ajv2020 from "ajv/dist/2020.js";
import { readFileSync } from "fs";
import fetch from "node-fetch";
import { ALPHABETICAL_SUFFIX, DIST_DIR, FULL_SUFFIX, saveToFiles } from "./utils.js";

export class IconProcessor {
    constructor(name, sourceUrl, schemaPath, categoriesMapping) {
        this.name = name;
        this.sourceUrl = sourceUrl;
        this.schemaPath = schemaPath;
        this.categoriesMapping = categoriesMapping;
        this.ajv = new Ajv2020();
    }

    async fetchData() {
        const raw = await fetch(this.sourceUrl).then((r) => r.text());
        // Strip the XSSI guard if present
        return JSON.parse(raw.replace(/^[^\n]*\n/, ""));
    }

    validateData(data) {
        const validate = this.ajv.compile(JSON.parse(readFileSync(this.schemaPath, "utf-8")));
        if (!validate(data)) {
            console.error(validate.errors);
            throw new Error(`Schema validation failed for ${this.name}`);
        }
        return data;
    }

    // This method will be overridden by subclasses
    filterIcons(allIcons) {
        console.warn("filterIcons method should be overridden in the subclass");
        return allIcons;
    }
    
    transformData(filteredIcons) {
        console.log(`Processing ${filteredIcons.length} icons for ${this.name}...`);

        const iconsObject = filteredIcons.map((i) => {
            const name = i.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const category = i.categories[0];
            const categoryName = this.categoriesMapping[category] || category;
            return {
                n: name,
                p: i.popularity,
                c: categoryName,
                t: i.tags,
            };
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
            countOfIcons: filteredIcons.length,
            countOfCategories: Object.keys(countByCategories).length,
            countOfTags,
            categories,
            icons: iconsObject,
        };
        const normalOutput = iconsObject.map((i) => (i.n));
        const iconsByPopularity = [...iconsObject].sort((a, b) => b.p - a.p);
        const popularityOutput = iconsByPopularity.map((i) => (i.n));

        return { fullOutput, normalOutput, popularityOutput };
    }

    async saveData({ fullOutput, normalOutput, popularityOutput }) {
        await Promise.all([
            saveToFiles(DIST_DIR, this.name + FULL_SUFFIX, fullOutput, fullOutput),
            saveToFiles(DIST_DIR, this.name, popularityOutput, popularityOutput),
            saveToFiles(DIST_DIR, this.name + ALPHABETICAL_SUFFIX, normalOutput, normalOutput)
        ]);
    }

    async process() {
        const rawData = await this.fetchData();
        const validatedData = this.validateData(rawData);
        const filteredIcons = this.filterIcons(validatedData.icons);
        const transformedData = this.transformData(filteredIcons);
        await this.saveData(transformedData);
        console.log(`${this.name} processing complete.`);
    }
} 