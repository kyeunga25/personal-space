import { describe, expect, it } from "vitest";

import {
  formatHongKongDate,
  isArchiveMonth,
  isArchiveYear,
} from "../src/lib/dates";

describe("archive route date segments", () => {
  it.each(["0001", "2026", "9999"])("accepts the year %s", (year) => {
    expect(isArchiveYear(year)).toBe(true);
  });

  it.each(["", "0", "0000", "202", "20260", "+2026", "２０２６"])(
    "rejects the year %j",
    (year) => {
      expect(isArchiveYear(year)).toBe(false);
    },
  );

  it.each(["01", "02", "12"])("accepts the month %s", (month) => {
    expect(isArchiveMonth(month)).toBe(true);
  });

  it.each(["", "0", "00", "1", "13", "001", "+1"])(
    "rejects the month %j",
    (month) => {
      expect(isArchiveMonth(month)).toBe(false);
    },
  );
});

describe("Hong Kong public dates", () => {
  it("formats valid timestamps in the Hong Kong calendar date", () => {
    expect(formatHongKongDate("2026-08-10T16:30:00.000Z")).toBe(
      "2026年8月11日",
    );
  });

  it.each([null, "", "   "])(
    "describes a missing date without throwing",
    (value) => {
      expect(formatHongKongDate(value)).toBe("未發佈 · Unpublished");
    },
  );

  it("describes an invalid stored date without crashing the public page", () => {
    expect(formatHongKongDate("not-a-date")).toBe(
      "日期不明 · Date unavailable",
    );
  });
});
