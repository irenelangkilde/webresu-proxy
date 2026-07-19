/**
 * Edge Function: proxy
 *
 * webresu.me is a vanity domain for user portfolios that actually live at
 * irenes-ventures.com. This function transparently proxies the paths that
 * belong here (/u/:slug and the images referenced by portfolios) to the
 * main site, so the URL bar stays webresu.me but the content comes from
 * the source of truth.
 *
 * We use an Edge Function instead of a plain _redirects proxy rewrite
 * because Netlify's external-proxy layer mangles the path segment on
 * status-200 rewrites to external hosts (observed in July 2026); an
 * explicit fetch preserves the path exactly.
 */

const MAIN_ORIGIN = "https://irenes-ventures.com";

function stripHopByHop(headers) {
  // Headers that should not be forwarded between hops per HTTP spec.
  const drop = new Set([
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailer", "transfer-encoding", "upgrade",
    "host", "content-length"
  ]);
  const out = new Headers();
  for (const [k, v] of headers) {
    if (!drop.has(k.toLowerCase())) out.append(k, v);
  }
  return out;
}

async function proxyTo(pathAndSearch, request) {
  const upstream = await fetch(MAIN_ORIGIN + pathAndSearch, {
    method: request.method,
    headers: stripHopByHop(request.headers),
    body: (request.method === "GET" || request.method === "HEAD") ? undefined : request.body,
    redirect: "manual"
  });
  // Return upstream response with hop-by-hop headers stripped so the client
  // sees clean headers from webresu.me.
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: stripHopByHop(upstream.headers)
  });
}

export default async function handler(request, context) {
  const url = new URL(request.url);

  // Portfolio pages: /u/{slug}
  if (url.pathname.startsWith("/u/")) {
    return proxyTo(url.pathname + url.search, request);
  }

  // Assets and images referenced from published portfolios:
  //   getPortfolioAsset — new asset store: user-uploaded images, videos, PDFs
  //     keyed by ?owner=<userId>&asset=<hash>.<ext>. This is where the editor
  //     puts everything the user uploads (post-migration).
  //   getPublishedImage — permanent AI-generated hero images (masthead, scene)
  //     keyed by slug. Where publishPortfolio promotes hero URLs on publish.
  //   getSceneImage / getPreviewImage — legacy pre-promotion URLs still baked
  //     into portfolios published before publishPortfolio's promotion loop
  //     existed. Kept as a compat shim; can be removed once no live portfolios
  //     reference them.
  if (
    url.pathname === "/.netlify/functions/getPortfolioAsset" ||
    url.pathname === "/.netlify/functions/getPublishedImage" ||
    url.pathname === "/.netlify/functions/getSceneImage" ||
    url.pathname === "/.netlify/functions/getPreviewImage"
  ) {
    return proxyTo(url.pathname + url.search, request);
  }

  // Everything else falls through to static handling (_redirects still
  // handles the bare-domain 301 and the catch-all 404).
  return context.next();
}

export const config = { path: "/*" };
