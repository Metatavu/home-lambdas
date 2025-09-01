/**
 * Script for importing on-call data from a JSON file into staging via HTTP endpoint
 *
 * Usage:
 *   npm run import-oncall-data -- ./scripts/2025.json
 *
 * Arguments:
 *   Path to the JSON file (e.g., ./scripts/2025.json)
 *
 * File format:
 *   [ { "Week": 1, "Person": "sofia" }, ... ]
 *
 * Year is extracted from the filename (e.g., 2025.json -> 2025)
 *
 * The endpoint used is the same as the weekly check POST endpoint: /on-call/weekly-check
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const ENDPOINT_URL = process.env.ONCALL_WEEKLY_CHECK_ENDPOINT || "http://localhost:3000/on-call/weekly-check";

async function main() {
	const filePath = process.argv[2];
	if (!filePath) {
		console.error("Please provide the path to the JSON file, e.g.: npm run import-oncall-data -- ./scripts/2025.json");
		process.exit(1);
	}

	const yearMatch = path.basename(filePath).match(/(\d{4})\.json$/);
	if (!yearMatch) {
		console.error("Filename must contain the year, e.g.: 2025.json");
		process.exit(1);
	}
	const year = parseInt(yearMatch[1], 10);

	let data;
	try {
		data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
	} catch (err) {
		console.error("Error reading file:", err);
		process.exit(1);
	}

	if (!Array.isArray(data)) {
		console.error("File must contain an array of objects");
		process.exit(1);
	}

	for (const entry of data) {
		if (typeof entry.Week !== "number" || typeof entry.Person !== "string") {
			console.warn("Skipped invalid entry:", entry);
			continue;
		}
		const payload = {
			Year: year,
			Week: entry.Week,
			Person: entry.Person,
			Paid: false
		};
		try {
			const res = await fetch(ENDPOINT_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				console.error(`Error importing week ${entry.Week}:`, await res.text());
			} else {
				console.log(`Week ${entry.Week} (${entry.Person}) imported successfully.`);
			}
		} catch (err) {
			console.error(`Network error for week ${entry.Week}:`, err);
		}
	}
}

main();
