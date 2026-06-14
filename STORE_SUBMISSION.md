# Chrome Web Store Submission

## Current Launch Position

The extension is close to a first free launch.

Ready:
- Manifest V3 extension structure
- Popup color picking flow
- Palette creation and management
- Color history
- Manual color entry
- CSS, SCSS, JSON, Tailwind, and PNG export
- Import and full backup export
- Chinese and English UI strings
- Runtime icons at 16, 48, and 128 px
- Free/Pro UI gates prepared for later payment integration

Hold for later:
- Real PayPal checkout and license verification
- Server-side entitlement storage
- Screenshot-based precision picker
- Store promo screenshots and optional video

## Store Listing Draft

Extension name:
Pixel Color Picker - Pixel Eyedropper

Short description:
A cute pixel-style color picker for collecting, organizing, and exporting web colors.

Detailed description:
Pixel Color Picker is a lightweight browser tool for designers, developers, and creators who want to capture web colors quickly and keep them organized.

Features:
- Pick colors from web pages with the browser eyedropper
- Save colors into reusable palettes
- Add notes to colors
- Search and sort palette colors
- Keep recent color history
- Export palettes as CSS variables, SCSS variables, JSON, Tailwind snippets, or PNG images
- Import palette JSON files
- Back up and restore local extension data
- Switch between Chinese and English
- Choose from playful pixel-style themes

The first release is free. Pro features are prepared in the interface but payment will be enabled in a later update.

Category:
Developer Tools or Productivity

Language:
Chinese Simplified, English

## Privacy Notes

Data handled by the extension:
- Saved palettes
- Color history
- Extension settings

Storage:
- Data is stored with Chrome storage for the extension.
- No account system is active in the first release.
- No payment, license, analytics, or external server calls are active in the first release.

Permissions used:
- `activeTab`: allows the picker flow to work with the active page.
- `storage`: saves palettes, settings, and history.
- `clipboardWrite`: copies color values.
- `downloads`: exports palettes and backups.

Suggested privacy disclosure:
This extension stores palettes, color history, and settings locally in Chrome extension storage. It does not sell user data or share data with third parties. Payment and account features are not active in the first release.

## Assets Needed Before Submission

Required:
- 128x128 icon: already present at `images/icon-128.png`
- At least one screenshot for the Chrome Web Store listing
- Privacy practices answers in the developer dashboard
- Single-purpose description matching the extension behavior

Recommended:
- 3 to 5 screenshots:
  - Popup palette list
  - Palette detail with colors
  - Export dialog
  - Settings and themes
  - History panel
- Promotional tile images if you want a more polished listing

## Pre-Upload Checklist

- Load the unpacked extension in Chrome.
- Confirm popup opens without console errors.
- Pick one color from a normal web page.
- Confirm the color is saved to the active palette.
- Create up to 5 palettes in free mode and confirm the 6th shows the Pro message.
- Confirm free themes work and locked themes show the Pro message.
- Export CSS, JSON, and PNG from a palette.
- Export a full backup, clear data, then import the backup.
- Switch language to English and reopen the popup.
- Package with `scripts/package-release.ps1`.

