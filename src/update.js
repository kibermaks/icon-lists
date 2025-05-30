// Dynamic Icon Lists. Copyright (C) 2025 Maksym Grigorash (@kibermaks).
// Licensed under the GNU GPL, Version 3 or later. See LICENSE file in root.

import { LucideProcessor } from "./lucide-processor.js";
import { MaterialProcessor } from "./material-processor.js";
import { PhosphorProcessor } from "./phosphor-processor.js";
import { ensureDistDir } from "./utils.js";

async function main() {
    ensureDistDir();
    let overallSuccess = true;

    const materialProcessor = new MaterialProcessor();
    const lucideIconsProcessor = new LucideProcessor();
    const phosphorProcessor = new PhosphorProcessor();

    console.log("Starting icon processing...");

    try {
        // Material Processor
        const materialResult = await materialProcessor.execute();
        if (!materialResult.success) {
            console.error("Error: Material icon processing failed.");
            overallSuccess = false;
        }

        // Lucide and Phosphor Processors (run concurrently)
        const results = await Promise.allSettled([
            lucideIconsProcessor.execute(),
            phosphorProcessor.execute()
        ]);

        const lucideResult = results[0];
        if (lucideResult.status === 'rejected' || (lucideResult.status === 'fulfilled' && !lucideResult.value.success)) {
            console.error("Error: Lucide icon processing failed.", lucideResult.status === 'rejected' ? lucideResult.reason : lucideResult.value.error);
            overallSuccess = false;
        }

        const phosphorResult = results[1];
        if (phosphorResult.status === 'rejected' || (phosphorResult.status === 'fulfilled' && !phosphorResult.value.success)) {
            console.error("Error: Phosphor icon processing failed.", phosphorResult.status === 'rejected' ? phosphorResult.reason : phosphorResult.value.error);
            overallSuccess = false;
        }

    } catch (error) {
        console.error(`Fatal error during icon processing: ${error.message || error}`);
        overallSuccess = false;
    }

    if (overallSuccess) {
        console.log("All icon sets processed successfully.");
    } else {
        console.error("Icon processing completed with errors.");
        process.exit(1);
    }
}

main();
