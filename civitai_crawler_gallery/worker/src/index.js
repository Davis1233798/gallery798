export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve static assets (handled by Pages/Workers Sites automatically usually, but here we might need to be explicit if using Worker for everything)
    // Actually, with [site] bucket, the worker handles the API and the assets are served by the asset handling logic.
    // But for a simple setup, we can just handle /api routes and let the rest fall through or be handled by the static asset binding if using Pages Functions.
    // However, with `wrangler.toml` [site], it's a "Worker Site".
    
    if (url.pathname === '/api/images') {
      return handleGetImages(env);
    }

    if (url.pathname === '/api/trigger-crawl') {
       // Manual trigger for testing
       await crawlCivitai(env);
       return new Response("Crawled!", { status: 200 });
    }

    // If using Workers Sites, we need to serve assets here. 
    // But modern Cloudflare Pages is better. 
    // Given the prompt "Cloudflare Pages + Workers", we might want to use Pages Functions or just a Worker that serves the API and the static assets are in Pages.
    // But the user said "Cloudflare Worker for Crawling/Proxying" and "Landing page".
    // Let's stick to a Worker Site for simplicity in a single repo, or just a Worker that returns the HTML for the root.
    // Let's use the [site] configuration which makes it a Worker Site.
    
    // For Worker Sites, we need @cloudflare/kv-asset-handler, but that's legacy.
    // Let's just return the HTML directly for / if we want to be super simple, or use the newer "Assets" binding if available.
    // For now, let's assume we are just building the API worker and the static site will be deployed via `wrangler pages deploy` or similar, OR we just serve the HTML string from the worker for maximum simplicity.
    
    // Let's serve the static HTML from the worker for the root path to keep it self-contained in one file if possible, 
    // OR use the [site] bucket which is the standard way for "Worker Sites".
    // Wait, "Worker Sites" is legacy. The new way is Cloudflare Pages.
    // But the user asked for "Cloudflare Worker for Crawling... and a Landing Page".
    // Let's build it as a Worker that serves the API, and we can host the frontend on Pages or just serve it from the Worker.
    // Serving from Worker is easiest for a single "push".
    
    if (url.pathname === '/') {
       // We can read index.html from the KV or just embed it if it's small. 
       // But better: use the [site] bucket.
       // To use [site], we need to import `getAssetFromKV`.
       // Let's try to keep it simple: The worker handles API. The static assets are uploaded.
       // We will assume the environment handles the static assets if we use `wrangler deploy`.
       
       // Actually, let's just make the worker serve the API. The frontend will be static files in `public`.
       // We can deploy with `wrangler pages deploy public`.
       // But to keep it in one "project", let's use the Worker to serve the API and maybe just return the HTML for root.
       
       return env.ASSETS.fetch(request); // This works if we use the new Assets binding or Pages Functions.
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(crawlCivitai(env));
  }
};

async function handleGetImages(env) {
  const images = await env.CIVITAI_IMAGES.get("latest_images", { type: "json" });
  return new Response(JSON.stringify(images || []), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
}

async function crawlCivitai(env) {
  try {
    const response = await fetch("https://civitai.com/api/v1/images?limit=50&sort=Most+Reactions&period=Day&nsfw=false");
    const data = await response.json();
    
    const images = data.items.map(item => ({
      id: item.id,
      url: item.url,
      width: item.width,
      height: item.height,
      prompt: item.meta?.prompt || "No prompt available",
      username: item.username,
      stats: item.stats
    }));

    await env.CIVITAI_IMAGES.put("latest_images", JSON.stringify(images));
    console.log(`Crawled ${images.length} images.`);
  } catch (error) {
    console.error("Error crawling Civitai:", error);
  }
}
