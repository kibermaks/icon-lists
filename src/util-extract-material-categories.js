import fs from "fs";

const data = JSON.parse(fs.readFileSync("icons.json", "utf8"));

const categories = new Set();

for (const icon of data.icons) {
	for (const cat of icon.categories || []) {
		categories.add(cat);
	}
}

const result = [...categories].sort();

fs.writeFileSync("material-categories.json", JSON.stringify(result, null, 2));
console.log("Total:", result.length);
