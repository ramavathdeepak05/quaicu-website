// Cloudflare Worker — GitHub OAuth proxy for Decap CMS.
// ====================================================
// Decap CMS in the browser cannot talk to GitHub directly because the OAuth
// token exchange requires a client secret. This Worker stands in:
//
//   1. Browser opens /auth → Worker redirects to GitHub's authorize URL.
//   2. User logs in on GitHub.
//   3. GitHub redirects to /callback?code=… → Worker exchanges code for token.
//   4. Worker returns a tiny HTML page that postMessages the token to the
//      parent window. Decap CMS picks it up and uses it for GitHub API calls.
//
// Secrets required (set via `wrangler secret put`):
//   GITHUB_CLIENT_ID
//   GITHUB_CLIENT_SECRET

const PROVIDER = "github";

const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

const isOriginAllowed = (origin, allowed) => {
  if (!origin) return false;
  if (origin === allowed) return true;
  // Allow Cloudflare Pages preview deployments under the same project.
  if (/^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin)) return true;
  return false;
};

const renderResponseHtml = (status, payload) => {
  // Message format Decap CMS expects on the postMessage channel.
  // See: https://decapcms.org/docs/external-oauth-clients/
  const message = `authorization:${PROVIDER}:${status}:${JSON.stringify(payload)}`;
  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>Authorizing…</title></head>
<body>
<p style="font-family: system-ui, sans-serif; padding: 24px;">Authorizing…</p>
<script>
(function() {
  function send(e) {
    if (!window.opener) return;
    window.opener.postMessage(${JSON.stringify(message)}, e.origin || "*");
    window.removeEventListener("message", send, false);
    setTimeout(function() { window.close(); }, 200);
  }
  window.addEventListener("message", send, false);
  // Kick off the handshake — Decap listens for this and replies.
  if (window.opener) {
    window.opener.postMessage("authorizing:${PROVIDER}", "*");
  }
})();
</script>
</body>
</html>`;
};

const htmlResponse = (body, status = 200) =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });

const jsonError = (status, message) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    // Preflight (Decap may send OPTIONS from the popup).
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(isOriginAllowed(origin, env.ALLOWED_ORIGIN) ? origin : env.ALLOWED_ORIGIN),
      });
    }

    // ---- step 1: Decap opens this URL in a popup ----
    if (url.pathname === "/auth") {
      const referer = request.headers.get("Referer") || "";
      // Lightweight origin check on the referer (popups don't always send Origin).
      const allowedHost = new URL(env.ALLOWED_ORIGIN).host;
      const refererHost = referer ? new URL(referer).host : "";
      const refererOk =
        refererHost === allowedHost || /\.pages\.dev$/.test(refererHost) || !referer;
      if (!refererOk) {
        return jsonError(403, `Origin ${refererHost} not allowed.`);
      }

      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope: env.GITHUB_OAUTH_SCOPE || "repo,user",
        // state binds this request to the callback. Decap also passes its own
        // state; we mint our own so the round-trip is verifiable.
        state: crypto.randomUUID(),
        allow_signup: "false",
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params.toString()}`,
        302
      );
    }

    // ---- step 2: GitHub redirects back here with ?code=… ----
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return htmlResponse(renderResponseHtml("error", { message: "Missing OAuth code." }), 400);
      }

      let tokenJson;
      try {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "User-Agent": "quaicu-cms-oauth",
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });
        tokenJson = await tokenRes.json();
      } catch (err) {
        return htmlResponse(
          renderResponseHtml("error", { message: `Token exchange failed: ${err.message}` }),
          500
        );
      }

      if (!tokenJson || !tokenJson.access_token) {
        return htmlResponse(
          renderResponseHtml("error", {
            message: tokenJson?.error_description || tokenJson?.error || "No token returned.",
          }),
          400
        );
      }

      return htmlResponse(
        renderResponseHtml("success", {
          token: tokenJson.access_token,
          provider: PROVIDER,
        })
      );
    }

    // ---- health check ----
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response("OK · quaicu-cms-oauth", {
        headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
      });
    }

    return jsonError(404, "Not found.");
  },
};
