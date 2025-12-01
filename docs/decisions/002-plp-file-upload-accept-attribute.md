# ADR 002: .plp File Upload Accept Attribute

**Status:** Accepted
**Date:** 2024-12-01
**Context:** Bug fix for .plp file import restriction

## Context

Users reported that .plp files could not be selected in the file upload dialog when using the "Import Plan" feature. Regular .json files worked fine, but the custom .plp extension was being filtered out.

## Problem

The file input's `accept` attribute was initially set to:
```javascript
triggerImport('.plp,.json', handleImportPlan);
```

When MIME type was added to be more permissive:
```javascript
triggerImport('.plp,.json,application/json', handleImportPlan);
```

This actually made it MORE restrictive. Browsers were filtering out .plp files because:
1. `.plp` is not a recognized file extension with a standard MIME type
2. When MIME types are specified in `accept`, browsers only show files matching those MIME types
3. `.plp` files have no MIME type association, so they were hidden
4. `.json` files worked because they have the `application/json` MIME type

## Decision

Changed the accept attribute to accept all file types:

```javascript
triggerImport('*', handleImportPlan);
```

Security is maintained through content validation in the `handleImportPlan()` function:
1. File is read as text
2. Content is parsed as JSON
3. Structure is validated with `isPlanData()` type guard
4. Invalid files are rejected with error message

## Affected Files

- `App.tsx` - `handlePlannerImportClick()` function

## Consequences

### Positive
- ✅ .plp files can now be imported on all browsers
- ✅ Security maintained through content validation
- ✅ Better user experience (can select any file, gets validated after)
- ✅ More flexible for future file format additions
- ✅ Eliminates browser-specific MIME type handling issues

### Negative
- ⚠️ Users might select wrong file types (but they'll get clear error message)
- ⚠️ File picker shows all files instead of filtered list

### Neutral
- Validation happens after file selection instead of before
- Error handling provides user feedback for invalid files

## Alternative Solutions Considered

1. **Register .plp MIME type** - Not possible without server configuration, doesn't work for static sites
2. **Use .json extension instead** - Confusing for users, .plp is more descriptive
3. **Keep extension-only filter** - Doesn't work reliably across browsers
4. **Create MIME type mapping** - Browser-dependent, fragile

## Technical Details

### File Validation Process

```javascript
const handleImportPlan = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            // Parse as JSON
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File could not be read as text.");
            const data = JSON.parse(text);

            // Validate structure
            if (!isPlanData(data)) throw new Error("Invalid plan file format.");

            // Migrate and load
            const migratedData = migrateState(data);
            setAppState(prev => ({ ...prev, ...migratedData, ...}));
            showFeedback('Plan imported! Use "Save As..." to save it.');
        } catch (error) {
            showFeedback('Error: Could not import plan. File may be invalid.');
        }
    };
    reader.readAsText(file);
};
```

### isPlanData Type Guard

```typescript
const isPlanData = (data: any): data is PlanData => {
    return (
        data &&
        typeof data.details === 'object' &&
        typeof data.equipment === 'object' &&
        typeof data.lifts === 'object' &&
        'squat' in data.lifts &&
        'eventName' in data.details
    );
};
```

## Security Considerations

- ✅ Content validation prevents malicious files
- ✅ JSON parsing fails safely on invalid files
- ✅ Type guard ensures data structure integrity
- ✅ No code execution from uploaded files
- ✅ FileReader API is sandboxed

## Migration Notes for Next.js

When rebuilding in Next.js:
- Same approach will work for client-side file uploads
- Consider Next.js API route for server-side validation if needed
- Could add more sophisticated validation (schema validation with Zod)
- May want to add file size limits
- Consider drag-and-drop file upload for better UX
- Could show file preview before import

## User Experience Improvements for Future

Potential enhancements:
- Show file preview before importing
- Display file metadata (lifter name, date, etc.)
- Support batch import of multiple plans
- Add visual indicator for valid .plp files
- Drag-and-drop support

## References

- HTML accept attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
- FileReader API: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
- MIME types: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
