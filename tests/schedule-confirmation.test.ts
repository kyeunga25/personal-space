import { describe, expect, it, vi } from "vitest";

import {
  ARTICLE_TITLE_REQUIRED_ERROR,
  POST_CONTENT_REQUIRED_ERROR,
  SCHEDULE_FUTURE_REQUIRED_ERROR,
} from "../src/config/publishing";
import {
  buildScheduleConfirmation,
  confirmScheduledPublication,
  formatHongKongScheduleInput,
  getScheduleActionState,
  getScheduleInputFeedback,
  getScheduleReadinessError,
  parseHongKongScheduleInput,
  updateScheduleInputFeedback,
} from "../src/scripts/schedule-confirmation";

const SCHEDULE_NOW = Date.parse("2026-08-10T00:00:00.000Z");

describe("schedule action availability", () => {
  it.each([null, "archived", "draft", "scheduled"])(
    "allows scheduling from %s state",
    (status) => {
      expect(getScheduleActionState(status)).toEqual({
        allowed: true,
        mobileActionCount: 3,
        reason: null,
      });
    },
  );

  it("replaces the invalid action for published content with its reason", () => {
    expect(getScheduleActionState("published")).toEqual({
      allowed: false,
      mobileActionCount: 2,
      reason:
        "已發佈內容不可直接排程更新；請立即發佈，或建立另一篇內容。 Published content cannot be scheduled directly; publish the update now or create a separate post.",
    });
  });

  it("fails closed for an unknown content state", () => {
    expect(getScheduleActionState("deleted")).toEqual({
      allowed: false,
      mobileActionCount: 2,
      reason:
        "內容狀態無效，排程已停用。 Content status is invalid; scheduling is disabled.",
    });
  });
});

describe("schedule time conversion", () => {
  it("fills datetime-local with the Hong Kong wall time", () => {
    expect(formatHongKongScheduleInput("2026-07-26T00:00:00.000Z")).toBe(
      "2026-07-26T08:00",
    );
  });

  it("converts a Hong Kong wall time to the matching UTC instant", () => {
    expect(parseHongKongScheduleInput("2026-07-26T08:00")).toBe(
      "2026-07-26T00:00:00.000Z",
    );
  });

  it.each([
    "",
    "not-a-date",
    "2026-02-30T09:00",
    "2026-07-26T24:00",
    "2026-07-26T08:00:30",
  ])("rejects an invalid or unsupported wall time: %s", (value) => {
    expect(parseHongKongScheduleInput(value)).toBeNull();
  });

  it("returns an empty input value for missing or invalid stored data", () => {
    expect(formatHongKongScheduleInput(null)).toBe("");
    expect(formatHongKongScheduleInput("not-a-date")).toBe("");
  });
});

describe("schedule input feedback", () => {
  it.each([
    [
      "",
      {
        label: "尚未設定排程時間。 No schedule time set.",
        state: "empty",
      },
    ],
    [
      "2026-08-10T08:01",
      {
        label:
          "時間有效；按下「排程」後才會生效。 Valid future time; choose Schedule to activate it.",
        state: "ready",
      },
    ],
    [
      "2026-08-10T08:00",
      {
        label: SCHEDULE_FUTURE_REQUIRED_ERROR,
        state: "expired",
      },
    ],
    [
      "2026-02-30T09:00",
      {
        label:
          "時間格式無效，請重新選擇香港日期與時間。 Invalid time; choose a Hong Kong date and time again.",
        state: "invalid",
      },
    ],
  ] as const)("describes schedule input %j", (value, expected) => {
    expect(getScheduleInputFeedback(value, SCHEDULE_NOW)).toEqual(expected);
  });

  it("writes feedback as plain text and exposes its state", () => {
    const output = {
      dataset: { state: "empty" },
      textContent: "previous",
    };

    updateScheduleInputFeedback(output, "2026-08-10T08:01", SCHEDULE_NOW);

    expect(output).toEqual({
      dataset: { state: "ready" },
      textContent:
        "時間有效；按下「排程」後才會生效。 Valid future time; choose Schedule to activate it.",
    });
  });
});

describe("schedule confirmation", () => {
  it.each([
    [
      "public",
      "公開 · Public",
      "到時會出現在公開網站及適用列表。 It will then be available on the public site and eligible listings.",
    ],
    [
      "unlisted",
      "不公開列出 · Unlisted",
      "到時可經精確連結讀取，但不會列入列表或搜尋。 It will then be available by exact link, but omitted from listings and search.",
    ],
    [
      "private",
      "私人 · Private",
      "到時仍只限 Studio，不會出現在公開網站。 It will remain Studio-only and unavailable on the public site.",
    ],
  ])("explains the %s visibility consequence", (visibility, label, effect) => {
    expect(
      buildScheduleConfirmation(
        {
          bodyMd: "正文",
          kind: "article",
          scheduledAt: "2026-08-11T09:30",
          title: "  虛構文章  ",
          visibility,
        },
        SCHEDULE_NOW,
      ),
    ).toEqual({
      iso: "2026-08-11T01:30:00.000Z",
      message:
        `排程「虛構文章」於 2026-08-11 09:30（香港時間 · Hong Kong time）。\n` +
        `可見性 · Visibility：${label}。\n${effect}`,
    });
  });

  it.each([
    {
      bodyMd: "Body",
      kind: "page",
      scheduledAt: "2026-08-11T09:30",
      title: "Title",
      visibility: "public",
    },
    {
      bodyMd: "Body",
      kind: "article",
      scheduledAt: "",
      title: "Title",
      visibility: "public",
    },
    {
      bodyMd: "Body",
      kind: "article",
      scheduledAt: "2026-08-11T09:30",
      title: "Title",
      visibility: "friends",
    },
  ])("fails closed for invalid schedule state", (input) => {
    expect(buildScheduleConfirmation(input)).toBeNull();
  });

  it("uses a bilingual fallback for an untitled note", () => {
    const confirmation = buildScheduleConfirmation(
      {
        bodyMd: "正文",
        kind: "note",
        scheduledAt: "2026-08-11T09:30",
        title: "   ",
        visibility: "private",
      },
      SCHEDULE_NOW,
    );

    expect(confirmation?.message).toContain("無標題筆記 · Untitled note");
  });

  it.each([
    {
      error: POST_CONTENT_REQUIRED_ERROR,
      input: {
        bodyMd: "  ",
        kind: "note",
        scheduledAt: "2026-08-11T09:30",
        title: "",
        visibility: "private",
      },
    },
    {
      error: ARTICLE_TITLE_REQUIRED_ERROR,
      input: {
        bodyMd: "Body",
        kind: "article",
        scheduledAt: "2026-08-11T09:30",
        title: "  ",
        visibility: "public",
      },
    },
  ])(
    "returns the shared content readiness error before prompting",
    ({ error, input }) => {
      const confirm = vi.fn(() => true);

      expect(getScheduleReadinessError(input)).toBe(error);
      expect(confirmScheduledPublication(input, confirm)).toBe("invalid");
      expect(confirm).not.toHaveBeenCalled();
    },
  );

  it("does not prompt for invalid state", () => {
    const confirm = vi.fn(() => true);

    expect(
      confirmScheduledPublication(
        {
          bodyMd: "Body",
          kind: "article",
          scheduledAt: "2026-02-30T09:00",
          title: "Title",
          visibility: "public",
        },
        confirm,
      ),
    ).toBe("invalid");
    expect(confirm).not.toHaveBeenCalled();
  });

  it("rejects a past schedule before prompting", () => {
    const confirm = vi.fn(() => true);
    const input = {
      bodyMd: "Body",
      kind: "note",
      scheduledAt: "2026-08-09T09:30",
      title: "",
      visibility: "private",
    };

    expect(getScheduleReadinessError(input, SCHEDULE_NOW)).toBe(
      SCHEDULE_FUTURE_REQUIRED_ERROR,
    );
    expect(confirmScheduledPublication(input, confirm, SCHEDULE_NOW)).toBe(
      "invalid",
    );
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([
    [false, "cancelled"],
    [true, "confirmed"],
  ] as const)("returns %s confirmation as %s", (answer, decision) => {
    const confirm = vi.fn(() => answer);

    expect(
      confirmScheduledPublication(
        {
          bodyMd: "Body",
          kind: "note",
          scheduledAt: "2026-08-11T09:30",
          title: '<img src=x onerror="alert(1)">',
          visibility: "unlisted",
        },
        confirm,
        SCHEDULE_NOW,
      ),
    ).toBe(decision);
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('<img src=x onerror="alert(1)">'),
    );
  });
});
