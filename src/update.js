import { MaterialProcessor, MaterialProcessorType } from "./material-processor.js";
import { ensureDistDir } from "./utils.js";

async function main() {
    ensureDistDir();

    const materialIconsProcessor = new MaterialProcessor(MaterialProcessorType.ICONS);
    const materialSymbolsProcessor = new MaterialProcessor(MaterialProcessorType.SYMBOLS);

    try {
        await materialIconsProcessor.process();
        await materialSymbolsProcessor.process();
        console.log("All icon processing finished successfully.");
    } catch (error) {
        console.error("Error processing icons:", error);
        process.exit(1);
    }
}

main();
