import { defineMiddleware } from "astro:middleware";

import { isProtectedPath } from "./server/auth/route-policy";
import { withSecurityHeaders } from "./server/http/security-headers";

export const onRequest = defineMiddleware(async ({ url }, next) => {
  if (isProtectedPath(url.pathname)) {
    return withSecurityHeaders(
      new Response("Not found", {
        status: 404,
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }),
    );
  }

  return withSecurityHeaders(await next());
});
