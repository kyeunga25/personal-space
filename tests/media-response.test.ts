import { describe, expect, it } from "vitest";

import { mediaObjectResponse } from "../src/server/media/response";

function objectFixture() {
  return {
    body: new Uint8Array([1, 2, 3]),
    httpEtag: '"synthetic-etag"',
  };
}

describe("public media responses", () => {
  it.each([
    ['"synthetic-etag"'],
    ['W/"synthetic-etag"'],
    ['"other", W/"synthetic-etag"'],
    ["*"],
  ])("returns 304 when If-None-Match is %s", (ifNoneMatch) => {
    const response = mediaObjectResponse({
      cacheControl: "public, max-age=300, stale-while-revalidate=60",
      ifNoneMatch,
      mimeType: "image/png",
      object: objectFixture(),
    });

    expect(response.status).toBe(304);
    expect(response.body).toBeNull();
    expect(response.headers.get("etag")).toBe('"synthetic-etag"');
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=300, stale-while-revalidate=60",
    );
  });

  it.each([null, '"other"', 'W/"other"'])(
    "returns the complete object when If-None-Match is %s",
    (ifNoneMatch) => {
      const response = mediaObjectResponse({
        cacheControl: "public, max-age=300, stale-while-revalidate=60",
        ifNoneMatch,
        mimeType: "image/png",
        object: objectFixture(),
      });

      expect(response.status).toBe(200);
      expect(response.body).not.toBeNull();
      expect(response.headers.get("content-type")).toBe("image/png");
    },
  );
});
