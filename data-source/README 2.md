# Data Source Directory

This directory contains the source JSON files for British Powerlifting records, organized by region.

## How to Update Records

### 1. Export from Google Sheets
Export your Google Sheets data as CSV with these columns:
- Region
- Name
- Weight Class
- Gender
- Lift
- Age Category
- Record
- Date Set
- Equipment

### 2. Convert CSV to JSON
1. Open `csv-to-json-converter.html` in your browser
2. Upload your CSV file
3. The tool will validate and convert your data
4. Download the individual region JSON files you want to update

### 3. Place JSON Files Here
Save the downloaded JSON files in this directory. File names should be:
- `england.json`
- `scotland.json`
- `wales.json`
- etc. (lowercase, hyphens for spaces)

### 4. Build the TypeScript Data File
Run the build command to regenerate the TypeScript records file:
```bash
npm run build:data
```

This will automatically create/update `src/data/records.ts` with all records from this directory.

### 5. Commit Your Changes
```bash
git add data-source/
git add src/data/records.ts
git commit -m "Update [region] records"
git push
```

## File Format

Each JSON file should contain an array of record objects:

```json
[
  {
    "region": "England",
    "name": "John Smith",
    "weightClass": "83kg",
    "gender": "M",
    "lift": "squat",
    "ageCategory": "Open",
    "record": 250.5,
    "dateSet": "2024-01-15",
    "equipment": "unequipped"
  }
]
```

## Notes

- Only update the region files you need to change
- The build script will combine all JSON files automatically
- Keep original JSON files in this directory for future updates
- The CSV converter tool handles validation and formatting automatically
