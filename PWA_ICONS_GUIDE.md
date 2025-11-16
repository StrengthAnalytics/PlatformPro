# PWA Icons and Branding Guide

This document explains how the PWA (Progressive Web App) icons and branding work for the dual-app deployment of PlatformPro.

## Overview

The repository now supports **unique PWA icons and names** for each app version:

- **Platform Coach** (paid version): Blue gradient background with white "P"
- **Platform Lifter** (free version): Orange-to-red gradient background with white "P"

When users save the app to their home screen, they'll see:
- **Platform Coach**: Blue icon, "Platform Coach" label
- **Platform Lifter**: Orange icon, "Platform Lifter" label

## File Structure

```
public/
├── icons/
│   ├── icon-192-paid.svg      # Platform Coach 192x192 icon
│   ├── icon-512-paid.svg      # Platform Coach 512x512 icon
│   ├── icon-192-free.svg      # Platform Lifter 192x192 icon
│   └── icon-512-free.svg      # Platform Lifter 512x512 icon
├── manifest-paid.json          # Platform Coach PWA manifest
├── manifest-free.json          # Platform Lifter PWA manifest
└── manifest.json              # Active manifest (copied during build)
```

## How It Works

### 1. Icon Files

Each app has its own SVG icon files with gradient backgrounds:

- **Platform Coach** (blue): `#0066ff` to `#0044AA` gradient
- **Platform Lifter** (orange): `#f97316` to `#dc2626` gradient

Both display a single white "P" character.

### 2. Manifest Files

Two separate manifest files define the PWA configuration:

- `manifest-paid.json`: Platform Coach configuration
- `manifest-free.json`: Platform Lifter configuration

During the build process (via `vite.config.ts`), the correct manifest is automatically copied to `manifest.json` based on the `VITE_APP_MODE` environment variable.

### 3. Dynamic Meta Tags

The app dynamically updates HTML meta tags at runtime (in `index.tsx`) including:

- Document title
- Theme color (blue vs orange)
- Apple mobile web app title
- Description
- Apple touch icon

This ensures the correct branding appears regardless of how the app is accessed.

### 4. Service Worker Cache Names

The service worker (`service-worker.ts`) uses app-specific cache names:

- Platform Coach: `platform-coach-v1`, `platform-coach-runtime-v1`
- Platform Lifter: `platform-lifter-v1`, `platform-lifter-runtime-v1`

This prevents cache conflicts between the two apps if a user has both installed.

## Building for Each Version

### Platform Coach (Paid)

```bash
VITE_APP_MODE=paid npm run build
```

This will:
1. Copy `manifest-paid.json` to `manifest.json`
2. Set theme color to `#0066ff` (blue)
3. Use Platform Coach branding
4. Set cache names to `platform-coach-*`

### Platform Lifter (Free)

```bash
VITE_APP_MODE=free npm run build
```

This will:
1. Copy `manifest-free.json` to `manifest.json`
2. Set theme color to `#f97316` (orange)
3. Use Platform Lifter branding
4. Set cache names to `platform-lifter-*`

## Testing PWA Installation

### Desktop (Chrome/Edge)

1. Run the app in development mode or serve the build
2. Click the install icon in the address bar (next to bookmark star)
3. Verify the correct app name and icon appear in the install dialog
4. After installation, check the icon in your apps/taskbar

### Mobile (iOS Safari)

1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Verify the correct icon and name appear
5. Check the home screen icon after adding

### Mobile (Android Chrome)

1. Open the app in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home screen" or "Install app"
4. Verify the correct icon and name appear
5. Check the home screen icon after adding

## Verifying the Configuration

You can verify which version is running by checking:

1. Browser console logs:
   ```
   [PWA] Meta tags updated for Platform Coach
   ```
   or
   ```
   [PWA] Meta tags updated for Platform Lifter
   ```

2. Service worker console logs:
   ```
   [ServiceWorker] Caching app shell
   ```
   Check the cache names in DevTools > Application > Cache Storage

3. Manifest file:
   - Open DevTools > Application > Manifest
   - Verify the correct name, theme color, and icons are loaded

## Customizing Icons

To modify the icon designs:

1. Edit the SVG files in `public/icons/`
2. Update the gradient colors or the letter displayed
3. The changes will automatically be reflected in both the manifest files and runtime

### Icon Design Guidelines

- **Size**: Icons are provided in 192x192 and 512x512 for optimal display
- **Format**: SVG is used for sharp rendering at all sizes
- **Purpose**: Both "any" and "maskable" purposes are supported
- **Background**: Gradients provide visual depth and match app branding
- **Letter**: Single character "P" keeps icons simple and recognizable

## Troubleshooting

### Icons not updating after changes

1. Clear browser cache and service worker cache:
   - Chrome: DevTools > Application > Clear storage
2. Uninstall and reinstall the PWA
3. Verify the correct manifest.json is being served

### Wrong app name showing

1. Check `VITE_APP_MODE` environment variable is set correctly
2. Verify `vite.config.ts` is copying the right manifest
3. Check browser console for PWA meta tag update logs

### Both apps have the same cache

1. Verify service worker is using app-specific cache names
2. Check the `APP_MODE` variable in `service-worker.ts`
3. Clear all caches and rebuild

## Related Files

- `config.ts`: Central branding configuration
- `vite.config.ts`: Build-time manifest copying
- `index.tsx`: Runtime meta tag updates
- `service-worker.ts`: Cache naming strategy
- `DUAL_DEPLOYMENT_GUIDE.md`: Overall deployment architecture
