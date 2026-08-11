export type EditionItemMoveDirection = "down" | "up";

export interface EditionItemMovePlan {
  announcement: string;
  targetIndex: number;
}

function isValidEditionItemPosition(index: number, total: number): boolean {
  return (
    Number.isSafeInteger(index) &&
    Number.isSafeInteger(total) &&
    total > 0 &&
    index >= 0 &&
    index < total
  );
}

export function formatEditionItemPosition(
  index: number,
  total: number,
): string | null {
  if (!isValidEditionItemPosition(index, total)) return null;
  const position = index + 1;
  return `第 ${String(position)} 項，共 ${String(total)} 項 · Item ${String(position)} of ${String(total)}`;
}

export function planEditionItemMove(
  index: number,
  total: number,
  direction: EditionItemMoveDirection,
): EditionItemMovePlan | null {
  if (!isValidEditionItemPosition(index, total)) return null;
  const targetIndex = index + (direction === "up" ? -1 : 1);
  if (targetIndex < 0 || targetIndex >= total) return null;
  const position = targetIndex + 1;
  return {
    announcement:
      `已移至第 ${String(position)} 項，共 ${String(total)} 項。 ` +
      `Moved to item ${String(position)} of ${String(total)}.`,
    targetIndex,
  };
}
