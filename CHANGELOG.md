# Changelog

## 2026-01-27
- Fix Aviary hooks ordering to prevent React minified errors.
- Add scarlet hatchling images (hatchling-2.webp, hatchling-3.webp).
- Add Aviary entry full-page detail overlay (timeline, streak length, upgrades).
- Add Three.js dependency, then remove it after switching directions.
- Build and then remove a 3D forest scene (superseded by pixel art view).
- Replace forest view with 2D pixel-art style scene using existing tree sprites.
- Enforce top-down grid placement so trees sit in fixed cells without overlap.
- Make the pixel forest grid scrollable inside the scene.
- Fix login flow so auth state updates immediately after login.
- Add level showcase page with hero image and animated transitions.
- Add background preview mode banner with purchase/exit actions.
- Add Burning Fire background theme and Phoenix Constellation theme with animations.
- Add Solar System background using the provided SCSS/HTML orbit animation.
- Add darker animated forest theme (Nocturne Forest) scoped to forest page, with preview.
- Add urge tasks system with Turso persistence (newspaper timer + pushup session flow).
- Add pushup session penalties for early exit or tab close.
- Add Scarlet Phoenix skin with relapse-triggered repurchase and cumulative discounting.
- Seed Scarlet skin images on first run (shop_item_images rows).
- Switch Aviary and Forest lists to react-virtuoso virtualization.
- Pin React/ReactDOM to 18.2 for compatibility.
- Add AGENTS.md project guide.
