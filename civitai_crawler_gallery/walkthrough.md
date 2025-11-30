# Civitai Image Gallery Walkthrough

## Overview
This project is a Cloudflare Worker + Pages application that crawls Civitai for images and displays them in an artistic gallery.

## Components
-   **Worker (`worker/src/index.js`)**: Fetches images from Civitai API and stores them in Cloudflare KV. Serves the API endpoint `/api/images`.
-   **Frontend (`public/`)**: A static site with a dark, artistic theme that fetches data from the Worker.
-   **Configuration (`wrangler.toml`)**: Defines the Worker, KV namespace, and Cron trigger.

## ⚠️ Deployment Troubleshooting

### 1. Git Push Failed (Permission Denied)
I encountered a "Permission denied" error when trying to push to `https://github.com/JackChen6203/gallery798.git`.
**Solution:**
You need to authenticate with GitHub manually.
```bash
# Ensure you are using the correct remote
git remote set-url origin https://github.com/Davis1233798/gallery798.git

# Push manually
# Note: Configured to use key 5090_davis1233798_github_ed25519
git push -u origin main
```
*If you use 2FA, you must use a Personal Access Token as your password.*

### 2. Cloudflare Login Failed (Port Error)
The command `npx wrangler login` failed because it couldn't bind to port 8976.
**Solution:**
Try logging in with the "no-browser" option or check if something is blocking the port.
```bash
# Try this alternative login method
npx wrangler login --browser=false
```
Copy the URL provided, open it in your browser, authorize, and paste the code back into the terminal.

## Standard Deployment Steps (Once Authenticated)

1.  **Create KV Namespace**:
    ```bash
    npx wrangler kv:namespace create "CIVITAI_IMAGES"
    ```
    *Update `wrangler.toml` with the `id` returned by this command.*

2.  **Deploy**:
    ```bash
    npx wrangler deploy
    ```

3.  **Trigger Crawler**:
    Visit `/api/trigger-crawl` on your deployed worker URL (e.g., `https://gallery798.<your-subdomain>.workers.dev/api/trigger-crawl`) to populate the initial images.

## Project Structure
-   `worker/`: Backend logic.
-   `public/`: Frontend assets.
-   `wrangler.toml`: Config.
