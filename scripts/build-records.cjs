#!/usr/bin/env node

/**
 * Build Records Script
 * Reads JSON files from data-source/ and generates utils/recordsData.ts
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  dim: (msg) => console.log(`${colors.dim}${msg}${colors.reset}`),
};

// Validation constants
const REQUIRED_FIELDS = [
  'region',
  'name',
  'weightClass',
  'gender',
  'lift',
  'ageCategory',
  'record',
  'dateSet',
  'equipment',
];

const VALID_GENDERS = ['M', 'F'];
const VALID_LIFTS = ['squat', 'bench_press', 'bench_press_ac', 'deadlift', 'total'];
const VALID_EQUIPMENT = ['equipped', 'unequipped'];

/**
 * Validates a single record object
 */
function validateRecord(record, fileName, index) {
  const errors = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in record)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate specific field values
  if (record.gender && !VALID_GENDERS.includes(record.gender)) {
    errors.push(`Invalid gender: ${record.gender} (must be M or F)`);
  }

  if (record.lift && !VALID_LIFTS.includes(record.lift)) {
    errors.push(`Invalid lift: ${record.lift}`);
  }

  if (record.equipment && !VALID_EQUIPMENT.includes(record.equipment)) {
    errors.push(`Invalid equipment: ${record.equipment}`);
  }

  if (record.record !== undefined && (typeof record.record !== 'number' || record.record <= 0)) {
    errors.push(`Invalid record value: ${record.record} (must be positive number)`);
  }

  if (errors.length > 0) {
    log.error(`Validation failed for record #${index + 1} in ${fileName}:`);
    errors.forEach((err) => log.error(`  ${err}`));
    return false;
  }

  return true;
}

/**
 * Reads and processes all JSON files from data-source/
 */
function buildRecords() {
  log.header('🏋️  Building Powerlifting Records');

  const dataSourceDir = path.join(process.cwd(), 'data-source');
  const outputFile = path.join(process.cwd(), 'utils', 'recordsData.ts');

  // Check if data-source directory exists
  if (!fs.existsSync(dataSourceDir)) {
    log.error('data-source/ directory not found');
    log.info('Create the directory and add JSON files from BPRecords repository');
    process.exit(1);
  }

  // Read all JSON files
  const files = fs.readdirSync(dataSourceDir).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    log.warn('No JSON files found in data-source/');
    log.info('Copy *.json files from BPRecords/data-source/ to get started');
    process.exit(0);
  }

  log.info(`Found ${files.length} JSON file${files.length > 1 ? 's' : ''}`);
  console.log();

  const allRecords = [];
  const stats = {
    totalRecords: 0,
    byRegion: {},
    byLift: {},
    byEquipment: {},
    validationErrors: 0,
  };

  // Process each file
  for (const file of files) {
    const filePath = path.join(dataSourceDir, file);
    const fileName = path.basename(file, '.json');

    try {
      log.info(`Processing ${colors.cyan}${file}${colors.reset}...`);

      const content = fs.readFileSync(filePath, 'utf8');
      const records = JSON.parse(content);

      if (!Array.isArray(records)) {
        log.error(`  ${file} must contain an array of records`);
        stats.validationErrors++;
        continue;
      }

      let validCount = 0;
      let invalidCount = 0;

      // Validate and collect records
      records.forEach((record, index) => {
        if (validateRecord(record, file, index)) {
          allRecords.push(record);
          validCount++;

          // Update statistics
          stats.byRegion[record.region] = (stats.byRegion[record.region] || 0) + 1;
          stats.byLift[record.lift] = (stats.byLift[record.lift] || 0) + 1;
          stats.byEquipment[record.equipment] = (stats.byEquipment[record.equipment] || 0) + 1;
        } else {
          invalidCount++;
          stats.validationErrors++;
        }
      });

      if (validCount > 0) {
        log.success(`  ${validCount} valid record${validCount > 1 ? 's' : ''} loaded`);
      }
      if (invalidCount > 0) {
        log.warn(`  ${invalidCount} invalid record${invalidCount > 1 ? 's' : ''} skipped`);
      }

      stats.totalRecords += validCount;
    } catch (error) {
      log.error(`  Failed to process ${file}: ${error.message}`);
      stats.validationErrors++;
    }
  }

  console.log();

  // Display statistics
  log.header('📊 Statistics');
  log.info(`Total Records: ${colors.bright}${stats.totalRecords}${colors.reset}`);

  if (stats.totalRecords > 0) {
    console.log();
    log.dim('By Region:');
    Object.entries(stats.byRegion)
      .sort(([, a], [, b]) => b - a)
      .forEach(([region, count]) => {
        log.dim(`  ${region}: ${count}`);
      });

    console.log();
    log.dim('By Lift:');
    Object.entries(stats.byLift)
      .sort(([, a], [, b]) => b - a)
      .forEach(([lift, count]) => {
        log.dim(`  ${lift}: ${count}`);
      });

    console.log();
    log.dim('By Equipment:');
    Object.entries(stats.byEquipment)
      .sort(([, a], [, b]) => b - a)
      .forEach(([equipment, count]) => {
        log.dim(`  ${equipment}: ${count}`);
      });
  }

  if (stats.validationErrors > 0) {
    console.log();
    log.warn(`${stats.validationErrors} validation error${stats.validationErrors > 1 ? 's' : ''} encountered`);
  }

  if (stats.totalRecords === 0) {
    log.error('No valid records to generate');
    process.exit(1);
  }

  // Generate TypeScript file
  console.log();
  log.header('📝 Generating TypeScript');

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tsContent = `/**
 * Powerlifting Records Data
 *
 * Auto-generated by scripts/build-records.cjs
 * DO NOT EDIT THIS FILE MANUALLY
 *
 * Generated: ${new Date().toISOString()}
 * Total Records: ${stats.totalRecords}
 */

import type { PowerliftingRecord } from '../types';

let cachedRecords: PowerliftingRecord[] | null = null;

/**
 * Get all powerlifting records (lazy-loaded)
 */
export function getRecordsData(): PowerliftingRecord[] {
  if (cachedRecords === null) {
    cachedRecords = ${JSON.stringify(allRecords, null, 2)};
  }
  return cachedRecords;
}

/**
 * Get records count without loading data
 */
export function getRecordsCount(): number {
  return ${stats.totalRecords};
}
`;

  fs.writeFileSync(outputFile, tsContent, 'utf8');
  log.success(`Generated ${colors.cyan}${path.relative(process.cwd(), outputFile)}${colors.reset}`);
  log.dim(`  ${(tsContent.length / 1024).toFixed(2)} KB`);

  console.log();
  log.header('✨ Build Complete');
  log.success(`${stats.totalRecords} records ready to use`);
  console.log();
}

// Run the build
try {
  buildRecords();
} catch (error) {
  console.error();
  log.error(`Build failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
