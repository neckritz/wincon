const MIN_THRESHOLD = 100;
const MAX_THRESHOLD = 4000;
const YEAR_START_TO_IGNORE = 2015;
const CANDIDATE_PATTERN = /(^|[^A-Za-z0-9])(\d{1,4}(?:[.,]\d{1,3})?)\s*([Kk])?(?=$|[^A-Za-z0-9])/g;

function parseNumericValue(rawValue: string): number | null {
  let normalized = rawValue.trim();

  if (!normalized) return null;

  if (normalized.includes('.') && normalized.includes(',')) {
    normalized = normalized.replace(/,/g, '');
  } else if (normalized.includes(',')) {
    normalized = /^\d{1,3}(,\d{3})+$/.test(normalized)
      ? normalized.replace(/,/g, '')
      : normalized.replace(',', '.');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeThresholdValue(rawValue: string, hasKiloSuffix: boolean): number | null {
  const parsed = parseNumericValue(rawValue);
  if (parsed === null) return null;

  const value = hasKiloSuffix ? parsed * 1000 : parsed;
  return Math.round(value);
}

function isIgnoredYear(value: number): boolean {
  const currentYear = new Date().getFullYear();
  return value >= YEAR_START_TO_IGNORE && value <= currentYear;
}

function scoreContext(description: string, valueStart: number, valueEnd: number): number {
  const contextStart = Math.max(0, valueStart - 24);
  const contextEnd = Math.min(description.length, valueEnd + 24);
  const context = description.slice(contextStart, contextEnd).toLowerCase();

  let score = 0;
  if (/\bfame\b/.test(context)) score += 3;
  if (/\b(min|minimum|req|required|requirement)\b/.test(context)) score += 2;
  if (/\b(war|river|race)\b/.test(context)) score += 1;
  return score;
}

export function extractClanFameThreshold(description?: string | null): number | null {
  if (!description) return null;

  const candidates: { value: number; score: number; index: number }[] = [];
  CANDIDATE_PATTERN.lastIndex = 0;

  let match = CANDIDATE_PATTERN.exec(description);
  while (match) {
    const fullMatch = match[0];
    const rawNumber = match[2];
    const hasKiloSuffix = Boolean(match[3]);
    const normalizedValue = normalizeThresholdValue(rawNumber, hasKiloSuffix);

    if (normalizedValue !== null) {
      const isWithinThresholdRange =
        normalizedValue >= MIN_THRESHOLD && normalizedValue <= MAX_THRESHOLD;

      if (isWithinThresholdRange && !isIgnoredYear(normalizedValue)) {
        const valueStart = match.index + fullMatch.indexOf(rawNumber);
        const valueEnd = valueStart + rawNumber.length;
        const score = scoreContext(description, valueStart, valueEnd);

        candidates.push({
          value: normalizedValue,
          score,
          index: valueStart,
        });
      }
    }

    match = CANDIDATE_PATTERN.exec(description);
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.value !== b.value) return a.value - b.value;
    return a.index - b.index;
  });

  return candidates[0].value;
}
