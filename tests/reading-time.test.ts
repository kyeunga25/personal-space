import { describe, expect, it } from "vitest";

import { getReadingTime } from "../src/lib/reading-time";

describe("public article reading time", () => {
  it.each([
    ["", 1],
    ["a", 1],
    ["a".repeat(500), 1],
    ["a".repeat(501), 2],
    ["a".repeat(1_500), 3],
  ])("estimates a bounded minute count at boundary %#", (body, minutes) => {
    const minuteText = String(minutes);
    expect(getReadingTime(body)).toEqual({
      label: `${minuteText} 分鐘閱讀 · ${minuteText} min read`,
      labelEn: `${minuteText} min read`,
      labelZh: `${minuteText} 分鐘閱讀`,
      minutes,
    });
  });
});
