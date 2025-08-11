// Dynamic Icon Lists. Copyright (C) 2025 Maksym Grigorash (@kibermaks).
// Licensed under the GNU GPL, Version 3 or later. See LICENSE file in root.

import { readFileSync } from "fs";
import { SetProcessor } from "./set-processor.js";
import { ALPHABETICAL_SUFFIX, BASIC_SUFFIX, DIST_DIR, FULL_SUFFIX, saveToFiles } from "./utils.js";

// Data file paths
const MATERIAL_COMBINED_DATA_PATH = "dist/material-combined-full.min.json";
const MATERIAL_ICONS_DATA_PATH = "dist/material-icons-full.min.json";
const MATERIAL_SYMBOLS_DATA_PATH = "dist/material-symbols-full.min.json";
const LUCIDE_DATA_PATH = "dist/lucide-icons-full.min.json";
const PHOSPHOR_DATA_PATH = "dist/phosphor-icons-full.min.json";

const OUTPUT_NAME_ULTIMATE = "ultimate-icons";

// Set abbreviations and names
const ICON_SETS = {
    'mi': { name: 'Material Icons', dataPath: MATERIAL_ICONS_DATA_PATH },
    'ms': { name: 'Material Symbols', dataPath: MATERIAL_SYMBOLS_DATA_PATH },
    'lc': { name: 'Lucide Icons', dataPath: LUCIDE_DATA_PATH },
    'ph': { name: 'Phosphor Icons', dataPath: PHOSPHOR_DATA_PATH }
};

// Category mapping to merge similar categories (maps to the longest/preferred form)
const CATEGORY_MAPPING = {
    'Device': 'Devices',
    'Devices': 'Devices',
    'Communicate': 'Communication',
    'Communication': 'Communication',
    'Action': 'Actions',
    'Actions': 'Actions',
    'Game': 'Games',
    'Games': 'Games',
    'Gaming': 'Games',
    'File': 'File Icons',
    'File Icons': 'File Icons',
    'File icons': 'File Icons',
    'Files': 'File Icons',
    'Home': 'Household',
    'Household': 'Household',
    'Text': 'Text Formatting',
    'Text Formatting': 'Text Formatting',
    'Image': 'Images',
    'Images': 'Images',
    'Audio & Video': 'Audio & Video',
    'Audio&Video': 'Audio & Video',
    'Technology & Development': 'Technology & Development',
    'Development': 'Technology & Development',
    'Tech': 'Technology & Development',
    'Maps & Travel': 'Maps & Travel',
    'Maps': 'Maps & Travel',
    'Travel': 'Maps & Travel',
    'Health & Wellness': 'Health & Wellness',
    'Health': 'Health & Wellness',
    'Wellness': 'Health & Wellness',
    'Finances': 'Finance',
    'Finance': 'Finance',
    'Financial': 'Finance',
    'UI Actions': 'UI Actions',
    'UI actions': 'UI Actions',
    'UI': 'UI Actions'
};

export class UltimateProcessor extends SetProcessor {
    constructor() {
        super();
        this.combinedData = [];
        this.setStats = {};
    }

    async _fetchData() {
        let allIconsData = [];
        
        // Load all data files
        for (const [setCode, setInfo] of Object.entries(ICON_SETS)) {
            try {
                // console.log(`Loading ${setInfo.name} data from ${setInfo.dataPath}...`);
                const fileContent = readFileSync(setInfo.dataPath, "utf-8");
                const setData = JSON.parse(fileContent);
                
                if (setData && setData.icons && Array.isArray(setData.icons)) {
                    // console.log(`Loaded ${setData.icons.length} icons from ${setInfo.name}`);
                    
                    // Add set information to each icon
                    const iconsWithSet = setData.icons.map(icon => ({
                        ...icon,
                        set: setCode,
                        setName: setInfo.name
                    }));
                    
                    allIconsData = allIconsData.concat(iconsWithSet);
                    this.setStats[setCode] = {
                        name: setInfo.name,
                        count: setData.icons.length
                    };
                } else {
                    console.warn(`Invalid data structure in ${setInfo.dataPath}`);
                }
            } catch (error) {
                console.error(`UltimateProcessor: Error reading ${setInfo.dataPath}:`, error);
                this.setStats[setCode] = {
                    name: setInfo.name,
                    count: 0
                };
            }
        }
        
        return allIconsData;
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

    _mergeCategories(categories) {
        if (!Array.isArray(categories)) return [];
        
        // Map categories to their preferred form and remove duplicates
        const mappedCategories = categories
            .map(cat => CATEGORY_MAPPING[cat] || cat)
            .filter((cat, index, arr) => arr.indexOf(cat) === index); // remove duplicates
        
        return mappedCategories;
    }

    _transformData(data) {
        console.log(`Ultimate: Total icons count from all sets: ${data.length}`);
        
        // Separate icons by set for deduplication
        const materialIcons = data.filter(icon => icon.set === 'mi');
        const materialSymbols = data.filter(icon => icon.set === 'ms');
        const otherIcons = data.filter(icon => icon.set !== 'mi' && icon.set !== 'ms');
        
        // Create maps for fast lookup
        const materialIconsMap = new Map();
        const materialSymbolsMap = new Map();
        
        materialIcons.forEach(icon => materialIconsMap.set(icon.n, icon));
        materialSymbols.forEach(icon => materialSymbolsMap.set(icon.n, icon));
        
        // Find duplicates and merge
        const finalIcons = [];
        const processedNames = new Set();
        
        // Process Material Symbols first (preferred version)
        materialSymbols.forEach(msIcon => {
            const miIcon = materialIconsMap.get(msIcon.n);
            let finalIcon = msIcon;
            
            if (miIcon) {
                // Merge categories and tags from both versions
                const mergedCategories = this._mergeCategories([
                    ...(msIcon.c || []),
                    ...(miIcon.c || [])
                ]);
                
                const mergedTags = [
                    ...(Array.isArray(msIcon.t) ? msIcon.t : []),
                    ...(Array.isArray(miIcon.t) ? miIcon.t : [])
                ].filter((tag, index, arr) => arr.indexOf(tag) === index); // remove duplicates
                
                // Use higher popularity score
                const popularity = Math.max(msIcon.p || 0, miIcon.p || 0);
                
                finalIcon = {
                    ...msIcon,
                    c: mergedCategories,
                    t: mergedTags,
                    p: popularity
                };
            }
            
            processedNames.add(msIcon.n);
            finalIcons.push(finalIcon);
        });
        
        // Add unique Material Icons (no Material Symbols counterpart)
        materialIcons.forEach(miIcon => {
            if (!processedNames.has(miIcon.n)) {
                finalIcons.push(miIcon);
            }
        });
        
        // Add all other icons (Lucide, Phosphor)
        finalIcons.push(...otherIcons);
        
        console.log(`Ultimate: After deduplication: ${finalIcons.length} icons (reduced from ${data.length})`);
        
        // Update set statistics with actual counts after deduplication
        const actualCounts = finalIcons.reduce((acc, icon) => {
            acc[icon.set] = (acc[icon.set] || 0) + 1;
            return acc;
        }, {});
        
        // Update setStats with actual counts
        Object.keys(this.setStats).forEach(setCode => {
            this.setStats[setCode].count = actualCounts[setCode] || 0;
        });
        
        // Transform all icons to final format
        const transformedIcons = finalIcons.map(icon => {
            // Create new name format: 'icon-name:[set-code]'
            const newName = `${icon.n}:${icon.set}`;
            
            // Merge similar categories (DO NOT add set names to categories)
            const mergedCategories = this._mergeCategories(icon.c);
            
            return {
                name: newName,
                originalName: icon.n,
                set: icon.set,
                setName: icon.setName,
                popularity: icon.p || 0,
                categories: mergedCategories,
                tags: Array.isArray(icon.t) ? icon.t : []
            };
        });

        // Sort by popularity (highest first), then by name
        transformedIcons.sort((a, b) => {
            if (b.popularity !== a.popularity) {
                return b.popularity - a.popularity;
            }
            return a.name.localeCompare(b.name);
        });

        return transformedIcons;
    }

    async _process(data) {
        await this._layoutAndSaveIconsInSuitableFormats(data, OUTPUT_NAME_ULTIMATE);
    }

    async _layoutAndSaveIconsInSuitableFormats(icons, fileName) {
        console.log(`Processing ${icons.length} icons to ${fileName}...`);

        const iconsObject = icons.map((i) => {
            return {
                n: i.name,
                s: i.set, // set abbreviation
                ...(this.includePopularity ? { p: i.popularity } : {}),
                c: i.categories,
                t: i.tags,
            }
        });

        let countOfTags = 0;
        const countByCategories = {};
        const countByCategoriesAndSets = {};

        // Count categories and track by set
        iconsObject.forEach((i) => {
            i.c.forEach((c) => {
                // Total count per category
                countByCategories[c] = (countByCategories[c] || 0) + 1;
                
                // Count by set per category
                if (!countByCategoriesAndSets[c]) {
                    countByCategoriesAndSets[c] = {};
                }
                countByCategoriesAndSets[c][i.s] = (countByCategoriesAndSets[c][i.s] || 0) + 1;
            });
            countOfTags += i.t.length;
        });

        const categories = Object.entries(countByCategories).map(([category, count]) => ({
            n: category,
            c: count,
            cs: countByCategoriesAndSets[category], // Count by set
        })).sort((a, b) => a.n.localeCompare(b.n));

        // Create sets structure with icon counts
        const sets = Object.entries(this.setStats).map(([code, info]) => ({
            code: code,
            name: info.name,
            count: info.count
        })).sort((a, b) => a.name.localeCompare(b.name));

        const fullOutput = {
            countOfIcons: icons.length,
            countOfCategories: Object.keys(countByCategories).length,
            countOfTags,
            countOfSets: sets.length,
            sets,
            categories,
            icons: iconsObject,
        }

        // For alphabetical output, sort by name alphabetically
        const alphabeticalIcons = [...iconsObject].sort((a, b) => a.n.localeCompare(b.n));
        const normalOutput = alphabeticalIcons.map((i) => (i.n));   

        let popularityOutput = [];
        let basicIcons = [];
        if (this.includePopularity) {
            const iconsByPopularity = [...iconsObject].sort((a, b) => b.p - a.p || a.n.localeCompare(b.n));
            popularityOutput = iconsByPopularity.map((i) => (i.n));
            basicIcons = iconsByPopularity.map((i) => ({n: i.n}));
        }
        else {
            popularityOutput = normalOutput;
            basicIcons = iconsObject.map((i) => ({n: i.n}));
        }

        const basicOutput = {
            countOfIcons: icons.length,
            countOfCategories: 0,
            countOfTags: 0,
            categories: [],
            icons: basicIcons,
        };

        await Promise.all([
            saveToFiles(DIST_DIR, fileName + FULL_SUFFIX, fullOutput, fullOutput),
            ...(this.includePopularity ? [saveToFiles(DIST_DIR, fileName, popularityOutput, popularityOutput)] : []),
            saveToFiles(DIST_DIR, fileName + ALPHABETICAL_SUFFIX, normalOutput, normalOutput),
            saveToFiles(DIST_DIR, fileName + BASIC_SUFFIX, basicOutput, basicOutput)
        ]);
    }
} 