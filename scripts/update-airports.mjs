#!/usr/bin/env node
/**
 * Downloads the OurAirports airport list and keeps only what flightfootprints needs.
 *
 * Source:  https://ourairports.com/data/  (released into the public domain)
 * Output:  backend/src/main/resources/data/airports.csv
 *          columns: iata, name, city, country, lat, lon
 *
 * Kept:    large_airport and medium_airport rows with a valid three-letter IATA code.
 *
 * Usage:   node scripts/update-airports.mjs
 *          node scripts/update-airports.mjs --input ~/Downloads/airports.csv
 *
 * Needs Node 22 or newer and has no dependencies.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const SOURCE_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT = resolve(REPO_ROOT, "backend/src/main/resources/data/airports.csv");

// Order matters: when two rows claim the same IATA code, the earlier type wins.
const KEPT_TYPES = ["large_airport", "medium_airport"];
const OUTPUT_COLUMNS = ["iata", "name", "city", "country", "lat", "lon"];

const IATA_PATTERN = /^[A-Z]{3}$/;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;

/**
 * Parses RFC 4180 CSV into an array of records (arrays of strings). Handles quoted
 * fields, doubled quotes ("") inside them, and commas or line breaks inside quotes.
 */
function parseCsv(text) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') {
        field += char;
      } else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = false;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }
  // Last record when the file does not end with a line break.
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

/** Turns records into objects keyed by the header row, checking every record's width. */
function toObjects(records) {
  const [header, ...rows] = records;
  return rows.map((row, index) => {
    if (row.length !== header.length) {
      throw new Error(`Record ${index + 1}: expected ${header.length} fields, found ${row.length}`);
    }
    return Object.fromEntries(header.map((name, i) => [name, row[i]]));
  });
}

function csvField(value) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** Six decimals is about 0.1 m, far finer than an airport reference point needs. */
function formatDegrees(value) {
  const text = value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  return text === "-0" ? "0" : text;
}

/** Converts one OurAirports row, or says why it cannot be used. */
function convert(row) {
  const iata = row.iata_code.trim().toUpperCase();
  if (!IATA_PATTERN.test(iata)) return { reason: "invalid IATA code" };

  const name = row.name.trim();
  const country = row.iso_country.trim().toUpperCase();
  if (!name || !COUNTRY_PATTERN.test(country)) return { reason: "missing name or country" };

  // Number("") is 0, so empty coordinates have to be rejected before converting.
  const lat = row.latitude_deg.trim() === "" ? NaN : Number(row.latitude_deg);
  const lon = row.longitude_deg.trim() === "" ? NaN : Number(row.longitude_deg);
  if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) return { reason: "invalid coordinates" };

  return {
    airport: {
      iata,
      name,
      city: row.municipality.trim(),
      country,
      lat: formatDegrees(lat),
      lon: formatDegrees(lon),
    },
  };
}

/** Orders rows that share an IATA code: the first one after sorting is kept. */
function byPreference(a, b) {
  return (
    KEPT_TYPES.indexOf(a.type) - KEPT_TYPES.indexOf(b.type) ||
    Number(b.scheduled_service === "yes") - Number(a.scheduled_service === "yes") ||
    Number(a.id) - Number(b.id)
  );
}

async function readSource(inputPath) {
  if (inputPath) {
    return { text: await readFile(inputPath, "utf8"), origin: inputPath };
  }
  const response = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status} from ${SOURCE_URL}`);
  return { text: await response.text(), origin: SOURCE_URL };
}

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: "string" },
      output: { type: "string", default: DEFAULT_OUTPUT },
    },
  });

  const { text, origin } = await readSource(values.input);
  const sourceRows = toObjects(parseCsv(text.replace(/^﻿/, "")));
  console.log(`Read ${sourceRows.length.toLocaleString("en-US")} rows from ${origin}`);

  const skipped = new Map(); // reason -> count
  const candidates = new Map(); // iata -> [{ row, airport }]
  for (const row of sourceRows) {
    if (!KEPT_TYPES.includes(row.type) || row.iata_code.trim() === "") continue;
    const { airport, reason } = convert(row);
    if (!airport) {
      skipped.set(reason, (skipped.get(reason) ?? 0) + 1);
      console.warn(`  skipped (${reason}): ${row.ident} "${row.name}" iata="${row.iata_code}"`);
      continue;
    }
    if (!candidates.has(airport.iata)) candidates.set(airport.iata, []);
    candidates.get(airport.iata).push({ row, airport });
  }

  const airports = [];
  const keptByType = Object.fromEntries(KEPT_TYPES.map((type) => [type, 0]));
  let duplicates = 0;
  for (const iata of [...candidates.keys()].sort()) {
    const [winner, ...losers] = candidates.get(iata).sort((a, b) => byPreference(a.row, b.row));
    for (const loser of losers) {
      duplicates++;
      console.warn(
        `  duplicate IATA ${iata}: kept ${winner.row.ident} "${winner.row.name}",` +
          ` dropped ${loser.row.ident} "${loser.row.name}"`,
      );
    }
    keptByType[winner.row.type]++;
    airports.push(winner.airport);
  }

  if (airports.length < 1000) {
    throw new Error(`Only ${airports.length} airports survived filtering; the source looks wrong, nothing written.`);
  }

  const lines = [OUTPUT_COLUMNS, ...airports.map((airport) => OUTPUT_COLUMNS.map((column) => airport[column]))];
  await mkdir(dirname(values.output), { recursive: true });
  await writeFile(values.output, lines.map((line) => line.map(csvField).join(",")).join("\n") + "\n", "utf8");

  const withoutCity = airports.filter((airport) => airport.city === "").length;
  const byType = KEPT_TYPES.map((type) => `${keptByType[type].toLocaleString("en-US")} ${type}`).join(", ");
  console.log(`Kept ${airports.length.toLocaleString("en-US")} airports (${byType}); ${withoutCity} have no city`);
  const dropped = [...skipped].map(([reason, count]) => `${count} ${reason}`);
  if (duplicates > 0) dropped.push(`${duplicates} duplicate IATA code`);
  if (dropped.length > 0) console.log(`Dropped: ${dropped.join(", ")}`);
  console.log(`Wrote ${values.output}`);
}

main().catch((error) => {
  console.error(`update-airports failed: ${error.message}`);
  process.exitCode = 1;
});
