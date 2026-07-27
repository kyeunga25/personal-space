import { defineMiddleware } from "astro:middleware";

import { verifyOwnerRequest } from "./server/auth/access";
import { isProtectedPath } from "./server/auth/route-policy";
import { withSecurityHeaders } from "./server/http/security-headers";
import { isSameOriginWrite } from "./server/http/origin-policy";
import { getBindings } from "./server/platform/bindings";

function privateResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, request, url } = context;
  const securityOptions = {
    noIndex: url.hostname.endsWith(".workers.dev"),
  };

  if (isProtectedPath(url.pathname)) {
    const owner = await verifyOwnerRequest(request, getBindings());
    if (!owner) {
      return withSecurityHeaders(privateResponse("Not found", 404), {
        noIndex: true,
      });
    }
    if (!isSameOriginWrite(request)) {
      return withSecurityHeaders(privateResponse("Forbidden", 403), {
        noIndex: true,
      });
    }

    locals.owner = owner;
    const response = await next();
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return withSecurityHeaders(
      new Response(response.body, {
        headers,
        status: response.status,
        statusText: response.statusText,
      }),
      { noIndex: true },
    );
  }

  return withSecurityHeaders(await next(), securityOptions);
});
