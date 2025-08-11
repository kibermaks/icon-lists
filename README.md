# Dynamic Icon Lists

Always up-to-date lists of icon names for popular icon libraries including Lucide, Material Icons/Symbols, and Phosphor Icons.

## Overview

This project automatically fetches and processes icon data from popular icon libraries to generate standardized JSON files containing icon names, categories, tags, and popularity metrics. The generated files are optimized for use in applications that need to provide icon selection interfaces, search functionality, or autocomplete features.

## Supported Icon Libraries

- **Material Icons & Symbols** (~5,875 icons)
  - Material Icons (filled style)
  - Material Symbols (outlined style)  
  - Combined dataset
- **Lucide Icons** (~1,597 icons)
  - Popular React/Vue icon library
- **Phosphor Icons** (~1,512 icons)
  - Flexible icon family
- **Ultimate Icons** (~8,907 icons) **NEW!**
  - Combined dataset with unified naming: `icon-name:library-code`
  - Cross-library standardization with set abbreviations
  - Category mapping and deduplication

## Generated Output Files

The project generates multiple formats for each icon library in the `dist/` directory:

### File Types Explained

**Standard Files (without `-full`)**:

- Contain **simple arrays of icon names only**
- Perfect for basic icon lists, autocomplete, or lightweight applications
- Sorted by **popularity** (most used icons first) or **alphabetically** (with `-a` suffix)

**Basic Files (with `-basic`)**:

- Contain **minimal icon objects** with just the name field
- Include count statistics but no categories, tags, or popularity data
- Ideal for applications that need icon names in object format without extra metadata

**Full Metadata Files (with `-full`)**:

- Contain **rich JSON objects** with complete metadata
- Include categories, tags, popularity scores, and statistics
- Ideal for advanced features like filtering, categorization, and search

### File Naming Convention

- `{library-name}.json` - Pretty formatted JSON, sorted by popularity
- `{library-name}.min.json` - Minified JSON, sorted by popularity  
- `{library-name}-a.json` - Pretty formatted JSON, sorted alphabetically
- `{library-name}-a.min.json` - Minified JSON, sorted alphabetically
- `{library-name}-basic.json` - Minimal icon objects with names only
- `{library-name}-basic.min.json` - Minified basic format
- `{library-name}-full.json` - Complete metadata including categories and tags
- `{library-name}-full.min.json` - Minified complete metadata
- `*.br` - Brotli compressed versions (≈80% smaller)

### Example Files

- `material-combined.json` - All Material icons sorted by popularity
- `material-icons-full.json` - Material Icons with full metadata
- `lucide-icons-a.json` - Lucide icons sorted alphabetically
- `phosphor-icons.min.json.br` - Compressed Phosphor icons

### Data Structure

**Simple Format (popularity/alphabetical):**

```json
["icon-name-1", "icon-name-2", "icon-name-3"]
```

**Basic Format:**

```json
{
  "countOfIcons": 1597,
  "countOfCategories": 0,
  "countOfTags": 0,
  "categories": [],
  "icons": [
    {"n": "icon-name-1"},
    {"n": "icon-name-2"},
    {"n": "icon-name-3"}
  ]
}
```

**Full Format:**

```json
{
  "countOfIcons": 1597,
  "countOfCategories": 25,
  "countOfTags": 8532,
  "categories": [
    {"n": "Accessibility", "c": 23},
    {"n": "Animals", "c": 45}
  ],
  "icons": [
    {
      "n": "home",
      "p": 95,
      "c": ["Navigation"],
      "t": ["home", "house", "building"]
    }
  ]
}
```

**Field Descriptions:**

- `n` - Icon name (for Ultimate Icons: `name:code` format)
- `s` - Set abbreviation (Ultimate Icons only: `mi`, `ms`, `lc`, `ph`)
- `p` - Popularity score (0-100)
- `c` - Categories array
- `t` - Tags array (searchable keywords)

### Ultimate Icons Format (NEW)

The Ultimate Icons dataset combines all libraries with unified naming:

**Icon Name Format:** `{original-name}:{library-code}`

**Examples:**

- `search:mi` (Material Icons)
- `home:lc` (Lucide Icons)
- `arrow-right:ph` (Phosphor Icons)
- `account-circle:ms` (Material Symbols)

**Set Codes:**

- `mi` = Material Icons
- `ms` = Material Symbols
- `lc` = Lucide Icons
- `ph` = Phosphor Icons

**Additional Features:**

- Merged similar categories (e.g., "Device" + "Devices" → "Devices")
- Cross-library category standardization
- Set statistics and counts

## Local Development

### Prerequisites

- Node.js 16+ (the project uses ES modules)
- npm or yarn

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/kibermaks/icon-lists.git
    cd Dynamic-icon-lists
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

### Running the Icon Processor

To update all icon libraries and regenerate the JSON files:

```bash
node src/update.js
```

This will:

1. Fetch the latest icon data from each source
2. Process and transform the data
3. Generate all output formats in the `dist/` directory
4. Compress files using Brotli

**Expected output:**

```code
Starting icon processing...
Material: Total icons count: 5875
Processing 5798 icons to material-combined...
Processing 2122 icons to material-icons...
Processing 3676 icons to material-symbols...
Lucide: Total icons count: 1597
Processing 1597 icons to lucide-icons...
Phosphor: Total icons count from _fetchData: 1512
Processing 1512 icons to phosphor-icons...
Ultimate: Total icons count from all sets: 8907
Processing 8907 icons to ultimate-icons...
All icon sets processed successfully.
```

### Development Structure

```code
src/
├── update.js              # Main entry point
├── material-processor.js  # Material Icons/Symbols processor
├── lucide-processor.js    # Lucide Icons processor  
├── phosphor-processor.js  # Phosphor Icons processor
├── ultimate-processor.js  # Ultimate Icons combined processor (NEW)
├── set-processor.js       # Base processor class
├── utils.js              # File I/O and compression utilities
├── material-schema.json  # JSON schema for Material icons validation
└── helpers/
    ├── readAllMetadata.mjs
    └── readMetadata.mjs
```

### Running Individual Processors

You can run individual processors by importing and executing them directly:

```javascript
import { MaterialProcessor } from './src/material-processor.js';
const processor = new MaterialProcessor();
await processor.execute();
```

### Testing

Currently, there are no automated tests. To verify the output:

1. Run the processor: `node src/update.js`
2. Check that files are generated in `dist/`
3. Validate JSON syntax in generated files
4. Verify icon counts match expected values

### Adding New Icon Libraries

To add support for a new icon library:

1. Create a new processor file extending `SetProcessor`
2. Implement required methods:
   - `_fetchData()` - Fetch raw icon data
   - `_validateData()` - Validate data structure  
   - `_transformData()` - Transform to standard format
   - `_process()` - Generate output files
3. Add the processor to `src/update.js`

## Automated Updates

This repository includes a GitHub Actions workflow that automatically updates the icon data daily to ensure the lists stay current with upstream changes.

### Daily Update Schedule

The workflow (`.github/workflows/update.yml`) runs automatically:

- **Schedule**: Every day at 00:05 UTC
- **Manual trigger**: Can be triggered manually via GitHub Actions UI

### Update Process

1. **Clone Dependencies**: Downloads the latest Lucide icons repository
2. **Fetch Latest Data**: Retrieves current icon data from all supported libraries
3. **Process & Generate**: Runs `node src/update.js` to create updated JSON files
4. **Commit Changes**: Automatically commits any changes to the `gh-pages` branch
5. **CDN Cache Purge**: Purges jsDelivr cache to ensure fresh content delivery

### CDN Access

The generated files are automatically published to jsDelivr CDN for easy access:

```code
https://cdn.jsdelivr.net/gh/kibermaks/icon-lists@gh-pages/dist/{filename}
```

**Example URLs:**

- `https://cdn.jsdelivr.net/gh/kibermaks/icon-lists@gh-pages/dist/material-combined.min.json`
- `https://cdn.jsdelivr.net/gh/kibermaks/icon-lists@gh-pages/dist/lucide-icons.json`
- `https://cdn.jsdelivr.net/gh/kibermaks/icon-lists@gh-pages/dist/phosphor-icons-full.min.json.br`

## Data Sources

- **Material Icons/Symbols**: Google Fonts API
- **Lucide Icons**: Local metadata files (requires lucide package)
- **Phosphor Icons**: Phosphor Icons API

## License

Licensed under the GNU GPL, Version 3 or later. See [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `node src/update.js`
5. Submit a pull request

## Use Cases

- **Icon Picker Components**: Use the JSON files to populate icon selection interfaces
- **Search/Autocomplete**: Use tags and names for fuzzy search functionality
- **Design Systems**: Integrate icon lists into design system documentation
- **Code Generators**: Generate icon constants or enums for applications
- **Analytics**: Track icon usage patterns using popularity scores
