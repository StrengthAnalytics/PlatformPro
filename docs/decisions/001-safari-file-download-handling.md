# ADR 001: Safari File Download Handling

**Status:** Accepted
**Date:** 2024-12-01
**Context:** Bug fix for .plp file downloads on Safari mobile

## Context

Users reported that .plp files were not downloading on Safari mobile browsers. This affected both:
1. Competition plan exports (.plp files)
2. PDF exports (both desktop and mobile versions)

Safari on iOS has stricter requirements for programmatic file downloads compared to other browsers.

## Problem

The original implementation created a download link, clicked it programmatically, and immediately cleaned up the DOM and revoked the blob URL:

```javascript
const link = document.createElement('a');
link.href = url;
link.download = fileName;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);  // Immediate cleanup
URL.revokeObjectURL(url);         // Immediate revocation
```

Safari's download process is asynchronous and needs time to process the blob URL before it's revoked.

## Decision

Implemented the following changes to support Safari:

1. **Explicit download attribute**: Use `setAttribute('download', fileName)` in addition to setting the property
2. **Hide link element**: Set `link.style.display = 'none'` for cleaner DOM manipulation
3. **Delayed cleanup**: Use `setTimeout()` with 100ms delay before removing link and revoking URL

```javascript
link.setAttribute('download', fileName);
link.style.display = 'none';
document.body.appendChild(link);
link.click();

setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}, 100);
```

## Affected Files

- `App.tsx` - `handleExportPlan()` function
- `utils/exportHandler.ts` - `savePdf()` function

## Consequences

### Positive
- ✅ Downloads now work on Safari mobile
- ✅ Maintains compatibility with other browsers
- ✅ No user-facing changes required
- ✅ Minimal performance impact (100ms delay)

### Negative
- ⚠️ Blob URL persists in memory for an extra 100ms
- ⚠️ Link element exists in DOM slightly longer (hidden)

### Neutral
- Memory impact is negligible for typical file sizes
- 100ms delay is imperceptible to users

## Alternative Solutions Considered

1. **Use FileSaver.js library** - Adds dependency overhead for a simple fix
2. **Longer timeout (500ms+)** - Unnecessary, 100ms is sufficient
3. **Safari user-agent detection** - Fragile, requires maintenance
4. **Server-side downloads** - Overkill, adds complexity and server requirements

## Migration Notes for Next.js

When rebuilding in Next.js:
- This pattern should work identically on client-side
- Consider Next.js API routes for server-side file generation if needed
- Could use Next.js file download helpers if available
- Keep the Safari timeout pattern for client-side downloads
- Test on actual Safari iOS devices, not just desktop Safari

## References

- Safari download behavior: https://developer.apple.com/forums/thread/108710
- Blob URL memory management: https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL
