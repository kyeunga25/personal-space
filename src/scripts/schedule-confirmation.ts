import {
  getPostContentReadinessError,
  SCHEDULE_FUTURE_REQUIRED_ERROR,
} from "../config/publishing";

type PostKind = "article" | "note";
type PostStatus = "archived" | "draft" | "published" | "scheduled";
type PostVisibility = "private" | "public" | "unlisted";
type Confirm = (message: string) => boolean;

interface ScheduleConfirmationInput {
  bodyMd: string;
  kind: string;
  scheduledAt: string;
  title: string;
  visibility: string;
}

interface ScheduleConfirmation {
  iso: string;
  message: string;
}

interface ScheduleActionState {
  allowed: boolean;
  mobileActionCount: 2 | 3;
  reason: string | null;
}

interface ScheduleInputFeedback {
  label: string;
  state: "empty" | "expired" | "invalid" | "ready";
}

interface ScheduleInputFeedbackOutput {
  dataset: { state?: string };
  textContent: string | null;
}

interface VisibilitySummary {
  effect: string;
  label: string;
}

export type ScheduleConfirmationDecision =
  "cancelled" | "confirmed" | "invalid";

const HONG_KONG_OFFSET_MS = 8 * 60 * 60 * 1000;
const SCHEDULE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u;

const VISIBILITY_SUMMARIES: Record<PostVisibility, VisibilitySummary> = {
  private: {
    effect:
      "到時仍只限 Studio，不會出現在公開網站。 It will remain Studio-only and unavailable on the public site.",
    label: "私人 · Private",
  },
  public: {
    effect:
      "到時會出現在公開網站及適用列表。 It will then be available on the public site and eligible listings.",
    label: "公開 · Public",
  },
  unlisted: {
    effect:
      "到時可經精確連結讀取，但不會列入列表或搜尋。 It will then be available by exact link, but omitted from listings and search.",
    label: "不公開列出 · Unlisted",
  },
};

function isPostKind(value: string): value is PostKind {
  return value === "article" || value === "note";
}

function isPostStatus(value: string): value is PostStatus {
  return (
    value === "archived" ||
    value === "draft" ||
    value === "published" ||
    value === "scheduled"
  );
}

function isPostVisibility(value: string): value is PostVisibility {
  return value === "private" || value === "public" || value === "unlisted";
}

export const SCHEDULE_CONFIRMATION_STATE_ERROR =
  "排程設定不完整或時間無效，請核對香港時間後再試。 Schedule settings are incomplete or invalid; check the Hong Kong time and try again.";

export function getScheduleActionState(
  status: string | null,
): ScheduleActionState {
  if (status === null || (isPostStatus(status) && status !== "published")) {
    return { allowed: true, mobileActionCount: 3, reason: null };
  }
  if (status === "published") {
    return {
      allowed: false,
      mobileActionCount: 2,
      reason:
        "已發佈內容不可直接排程更新；請立即發佈，或建立另一篇內容。 Published content cannot be scheduled directly; publish the update now or create a separate post.",
    };
  }
  return {
    allowed: false,
    mobileActionCount: 2,
    reason:
      "內容狀態無效，排程已停用。 Content status is invalid; scheduling is disabled.",
  };
}

export function formatHongKongScheduleInput(
  value: string | null | undefined,
): string {
  if (!value) return "";
  const instant = Date.parse(value);
  if (!Number.isFinite(instant)) return "";

  const hongKongWallTime = new Date(instant + HONG_KONG_OFFSET_MS);
  if (!Number.isFinite(hongKongWallTime.getTime())) return "";
  return hongKongWallTime.toISOString().slice(0, 16);
}

export function parseHongKongScheduleInput(value: string): string | null {
  const normalized = value.trim();
  if (!SCHEDULE_INPUT_PATTERN.test(normalized)) return null;

  const wallTime = Date.parse(`${normalized}:00.000Z`);
  if (!Number.isFinite(wallTime)) return null;

  const instant = new Date(wallTime - HONG_KONG_OFFSET_MS).toISOString();
  return formatHongKongScheduleInput(instant) === normalized ? instant : null;
}

export function getScheduleInputFeedback(
  value: string,
  now = Date.now(),
): ScheduleInputFeedback {
  if (!value.trim()) {
    return {
      label: "尚未設定排程時間。 No schedule time set.",
      state: "empty",
    };
  }
  const iso = parseHongKongScheduleInput(value);
  if (!iso) {
    return {
      label:
        "時間格式無效，請重新選擇香港日期與時間。 Invalid time; choose a Hong Kong date and time again.",
      state: "invalid",
    };
  }
  if (Date.parse(iso) <= now) {
    return { label: SCHEDULE_FUTURE_REQUIRED_ERROR, state: "expired" };
  }
  return {
    label:
      "時間有效；按下「排程」後才會生效。 Valid future time; choose Schedule to activate it.",
    state: "ready",
  };
}

export function updateScheduleInputFeedback(
  output: ScheduleInputFeedbackOutput,
  value: string,
  now = Date.now(),
): ScheduleInputFeedback {
  const feedback = getScheduleInputFeedback(value, now);
  output.textContent = feedback.label;
  output.dataset.state = feedback.state;
  return feedback;
}

export function buildScheduleConfirmation(
  { bodyMd, kind, scheduledAt, title, visibility }: ScheduleConfirmationInput,
  now = Date.now(),
): ScheduleConfirmation | null {
  if (!isPostKind(kind) || !isPostVisibility(visibility)) return null;
  const input = { bodyMd, kind, scheduledAt, title, visibility };
  if (getScheduleReadinessError(input, now)) return null;

  const iso = parseHongKongScheduleInput(scheduledAt);
  if (!iso) return null;

  const postTitle =
    title.trim() ||
    (kind === "article"
      ? "未命名文章 · Untitled article"
      : "無標題筆記 · Untitled note");
  const summary = VISIBILITY_SUMMARIES[visibility];
  const localTime = scheduledAt.trim().replace("T", " ");

  return {
    iso,
    message:
      `排程「${postTitle}」於 ${localTime}（香港時間 · Hong Kong time）。\n` +
      `可見性 · Visibility：${summary.label}。\n${summary.effect}`,
  };
}

export function getScheduleReadinessError(
  { bodyMd, kind, scheduledAt, title, visibility }: ScheduleConfirmationInput,
  now = Date.now(),
): string | null {
  if (!isPostKind(kind) || !isPostVisibility(visibility)) {
    return SCHEDULE_CONFIRMATION_STATE_ERROR;
  }
  const contentError = getPostContentReadinessError({ bodyMd, kind, title });
  if (contentError) return contentError;
  const scheduledIso = parseHongKongScheduleInput(scheduledAt);
  if (!scheduledIso) return SCHEDULE_CONFIRMATION_STATE_ERROR;
  return Date.parse(scheduledIso) <= now
    ? SCHEDULE_FUTURE_REQUIRED_ERROR
    : null;
}

export function confirmScheduledPublication(
  input: ScheduleConfirmationInput,
  confirm: Confirm,
  now = Date.now(),
): ScheduleConfirmationDecision {
  const confirmation = buildScheduleConfirmation(input, now);
  if (!confirmation) return "invalid";
  return confirm(confirmation.message) ? "confirmed" : "cancelled";
}
