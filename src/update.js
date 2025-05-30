// Dynamic Icon Lists. Copyright (C) 2025 Maksym Grigorash (@kibermaks).
// Licensed under the GNU GPL, Version 3 or later. See LICENSE file in root.

import { LucideProcessor } from "./lucide-processor.js";
import { MaterialProcessor } from "./material-processor.js";
import { ensureDistDir } from "./utils.js";

async function main() {
    ensureDistDir();

    const materialProcessor = new MaterialProcessor();

    const lucideIconsProcessor = new LucideProcessor();
    try {
        let materialResult = await materialProcessor.execute();
        let lucideResult = await lucideIconsProcessor.execute();

        if (materialResult.success && lucideResult.success) {
            console.log("All icon processing finished successfully.");
        } else {
            console.error("Error processing icons:", materialResult.error, lucideResult.error);
        }
    } catch (error) {
        console.error("Error processing icons:", error);
        process.exit(1);
    }
}

main();
