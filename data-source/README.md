# Records Data Source

This folder contains powerlifting records data copied from the BPRecords repository.

## Workflow

1. **Copy JSON files** from `BPRecords/data-source/*.json` to this folder manually
2. **Run build command**: `npm run build:data`
3. This generates `utils/recordsData.ts` with all records compiled
4. **Build app normally**: `npm run build`

## File Format

Each JSON file should contain an array of records with this structure:

```json
{
  "region": "British",
  "name": "John Smith",
  "weightClass": "83kg",
  "gender": "M",
  "lift": "squat",
  "ageCategory": "Open",
  "record": 280.5,
  "dateSet": "2024-01-15",
  "equipment": "unequipped"
}
```

## Valid Values

- **gender**: `"M"` or `"F"`
- **lift**: `"squat"`, `"bench_press"`, `"bench_press_ac"`, `"deadlift"`, `"total"`
- **equipment**: `"equipped"` or `"unequipped"`
- **ageCategory**: `"Open"`, `"J"`, `"U23"`, `"U18"`, `"U16"`, `"SJ"`, `"M1"`-`"M6"`
- **region**: `"British"`, `"England"`, `"Scotland"`, `"Wales"`, etc.

## Notes

- This folder is `.gitignore`d - data files are managed locally only
- Data files can be large, so they're not committed to version control
- The generated `utils/recordsData.ts` is also `.gitignore`d
