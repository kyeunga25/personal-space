const LATIN_TERM = /[\p{L}\p{N}]+/gu;
const HAN_CHARACTER = /\p{Script=Han}/u;

export function normalizeStoryTitle(title: string): string {
  return title
    .normalize("NFKC")
    .toLocaleLowerCase("zh-Hant-HK")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 300);
}

function titleTokens(title: string): Set<string> {
  const normalized = normalizeStoryTitle(title);
  const tokens = new Set(normalized.match(LATIN_TERM) ?? []);
  const han = Array.from(normalized).filter((character) =>
    HAN_CHARACTER.test(character),
  );
  for (let index = 0; index < han.length - 1; index += 1) {
    const left = han[index];
    const right = han[index + 1];
    if (left && right) tokens.add(`${left}${right}`);
  }
  return tokens;
}

export function storyTitleSimilarity(left: string, right: string): number {
  const leftNormalized = normalizeStoryTitle(left);
  const rightNormalized = normalizeStoryTitle(right);
  if (!leftNormalized || !rightNormalized) return 0;
  if (leftNormalized === rightNormalized) return 1;

  const leftTokens = titleTokens(leftNormalized);
  const rightTokens = titleTokens(rightNormalized);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }
  return (2 * intersection) / (leftTokens.size + rightTokens.size);
}
