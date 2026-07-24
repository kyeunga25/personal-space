# Content and Editorial Model

## 1. Why this model is recommended

A personal site and an automated news collector have very different volume patterns. Personal writing may be occasional, while source collection may produce dozens or hundreds of items per day. Publishing both as equal feed posts would bury the owner’s voice.

The solution is to treat raw news as private editorial material and publish only finished Editions.

## 2. Public content model

### Note

Best for:

- a thought or complaint;
- a small story;
- a short reaction;
- a status update;
- a photo with commentary;
- a short review;
- a quotation or link with personal context.

Rules:

- title optional;
- body required;
- normally concise, but no hard character limit;
- can link to an Edition or external URL;
- rendered in a compact stream card.

### Article

Best for:

- long opinion;
- travel journal;
- detailed review;
- project reflection;
- tutorial or research note;
- personal essay.

Rules:

- title required;
- excerpt recommended;
- headings and Markdown supported;
- optional table of contents and cover;
- reading-focused page layout.

### Edition

Best for:

- `2026-07-24｜AI｜Agent 工具、模型更新與產業消息`;
- `2026-07-24｜硬件｜新 GPU、迷你主機與市場更新`;
- a weekly topic recap.

Rules:

- associated with one Channel;
- one covered date/range;
- generated as draft;
- selected Story Clusters, not raw item dumps;
- source list and AI-assisted disclosure required;
- owner may edit or keep private.

## 3. Private editorial model

### Source Item

Minimum stored fields:

- source;
- external ID when provided;
- canonical URL;
- original title and author;
- original publication time;
- fetched time;
- language;
- excerpt or bounded processing text;
- content fingerprint;
- status.

### Story Cluster

A Story Cluster represents one event across one or more sources. It contains:

- normalized working title;
- first/last seen time;
- channel;
- importance score;
- novelty score;
- source diversity;
- summary draft;
- member Source Items;
- reviewed/ignored/selected state.

## 4. Edition selection policy

Rank clusters using a transparent weighted score:

```text
importance =
  source_trust
  + owner_interest_match
  + novelty
  + source_diversity
  + recency
  + official_source_bonus
  - duplicate_penalty
  - low_information_penalty
```

Exact weights belong in configuration and may differ by Channel.

Selection constraints:

- prefer official/primary sources when available;
- merge duplicate reports;
- avoid selecting several minor stories about the same product unless materially different;
- include 5–12 stories for a normal daily Edition;
- allow fewer when the day is quiet;
- do not generate a public Edition from low-quality filler.

## 5. Edition structure

Recommended Markdown structure:

```md
# 2026-07-24｜AI｜今日重要更新

一段 2–4 句的總覽。

## 今日重點

### 1. Story title

2–4 句摘要，說明發生了甚麼、為甚麼值得留意。

- 重點一
- 重點二

來源：[Source A](...)、[Source B](...)

## 其他更新

- Short item...

## 編輯說明

本篇由自動化系統收集與 AI 輔助整理，內容以原始來源為準。
```

## 6. Title rules

### Note

- no title required;
- when needed, use natural wording, not SEO templates.

### Article

- descriptive and personal;
- date normally shown separately rather than forced into the title.

### Daily Edition

```text
YYYY-MM-DD｜Channel｜short thematic summary
```

### Weekly Edition

```text
YYYY-Www｜Channel｜weekly summary
```

Do not use the generic phrase “每日摘要” alone when a short thematic summary can make the Edition easier to recognize later.

## 7. Authorship labels

- Notes and Articles: `Ken` or configured owner identity.
- Editions: `AI Radar · <Channel>` or another clear system publication name.
- Display `AI-assisted` on Edition pages.
- Do not present automated channels as real human reporters.

## 8. External content rules

- Preserve links and source names.
- Use original summaries rather than copied full text.
- Do not bypass paywalls, authentication, or technical access controls.
- Do not republish third-party hero images by default.
- Prefer original channel artwork, CSS decoration, source favicon, or no image.
- A source can be disabled immediately from Studio.

## 9. Status state machine

### Notes and Articles

```text
draft -> scheduled -> published -> archived
         \-> published

draft -> archived
```

### Editions

```text
generating -> review -> scheduled -> published -> archived
               \-> discarded
               \-> private published
```

### Source Items

```text
new -> processed -> clustered -> reviewed
               \-> ignored
               \-> error/retry
```
