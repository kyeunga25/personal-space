const READING_CHARACTERS_PER_MINUTE = 500;

export interface ReadingTime {
  label: string;
  labelEn: string;
  labelZh: string;
  minutes: number;
}

export function getReadingTime(body: string): ReadingTime {
  const minutes = Math.max(
    1,
    Math.ceil(body.length / READING_CHARACTERS_PER_MINUTE),
  );
  const minuteText = String(minutes);
  return {
    label: `${minuteText} 分鐘閱讀 · ${minuteText} min read`,
    labelEn: `${minuteText} min read`,
    labelZh: `${minuteText} 分鐘閱讀`,
    minutes,
  };
}
