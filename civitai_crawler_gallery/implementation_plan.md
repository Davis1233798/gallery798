# Implementation Plan - Civitai Image Gallery

## Goal
Create a "Civitai Image Gallery" hosted on Cloudflare that periodically fetches images from Civitai (likely via API) and displays them on an artistic landing page. No physical image storage; use Cloudflare KV to store URLs and metadata.

## User Review Required
> [!NOTE]
> **API Availability**: Civitai has a public API (`https://civitai.com/api/v1/images`). This is much more reliable than scraping.
> **NSFW Content**: Civitai contains NSFW content. We should decide whether to filter it or allow it (defaulting to safe/PG for a general gallery unless specified otherwise). *Assumption: We will fetch SFW images by default or configurable.*

## Proposed Changes

### Cloudflare Worker (`worker/src/index.js`)
- **Scheduled Event**:
    -   Fetch `https://civitai.com/api/v1/images` (with query params for sort/period/nsfw).
    -   Parse JSON response.
    -   Extract image URLs and metadata (prompt, model, etc.).
    -   Store unique URLs in Cloudflare KV (`CIVITAI_IMAGES` namespace).
- **API Endpoint (`GET /api/images`)**:
    -   Return list of image URLs from KV.
- **Proxy Endpoint (`GET /api/proxy`)**:
    -   (Optional) If hotlinking is blocked (unlikely for Civitai), fetch image and stream response.

### Frontend (`public/index.html`, `public/style.css`, `public/app.js`)
- **Design**:
    -   **Theme**: "Artistic", Dark Mode, Glassmorphism.
    -   **Layout**: Masonry grid.
    -   **Interactions**: Hover to see metadata (prompt, model).
- **Logic**:
    -   Fetch list from `/api/images`.
    -   Render images.

### Configuration (`wrangler.toml`)
-   Define Worker, KV Namespace, and Cron Trigger.
-   Define Pages configuration.

## Verification Plan

### Automated Tests
-   **Unit Tests**: Test API response parsing.

### Manual Verification
1.  **Deploy**: `npm run deploy`.
2.  **Trigger Worker**: Manually trigger to populate KV.
3.  **View Site**: Verify images load from Civitai.
