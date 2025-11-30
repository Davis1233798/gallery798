import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API Routes
    if (url.pathname === '/api/images') {
      return handleGetImages(env);
    }

    if (url.pathname === '/api/trigger-crawl') {
      await crawlCivitai(env);
      return new Response("Crawled!", { status: 200 });
    }

    // Static Assets (Frontend)
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (e) {
      if (e instanceof Error) {
        // Fallback to index.html for SPA routing if needed, or just 404
        // For this simple site, 404 is fine if file not found.
      }
      return new Response(`"${url.pathname}" not found`, {
        status: 404,
        statusText: "not found",
      });
    }
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
