import { extractClanFameThreshold } from './extractClanFameThreshold.ts';

interface TempTestCase {
  description: string;
  input: string;
  expected: number | null;
}

const TEMP_TEST_CASES: TempTestCase[] = [
  {
    description: 'extracts plain fame value',
    input: 'War fame minimum 1300 every week.',
    expected: 1300,
  },
  {
    description: 'extracts decimal k notation',
    input: 'Need 1.3k fame each river race.',
    expected: 1300,
  },
  {
    description: 'extracts spaced K notation',
    input: 'Req: 1.5 K fame per war',
    expected: 1500,
  },
  {
    description: 'ignores est. year and keeps threshold',
    input: 'EST 2019 | required fame 1200',
    expected: 1200,
  },
  {
    description: 'ignores year-only values',
    input: 'Clan established 2024. Active chat.',
    expected: null,
  },
  {
    description: 'ignores out-of-range thresholds',
    input: 'Minimum fame 4200.',
    expected: null,
  },
  {
    description: 'parses comma thousands',
    input: 'war fame req 1,300',
    expected: 1300,
  },
  {
    description: 'prefers fame-context candidate over unrelated number',
    input: 'PB 2500, war fame min 1300',
    expected: 1300,
  },
];

function assertEqual(actual: number | null, expected: number | null, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

export function runExtractClanFameThresholdTempTests(): void {
  TEMP_TEST_CASES.forEach(({ description, input, expected }) => {
    const actual = extractClanFameThreshold(input);
    assertEqual(actual, expected, description);
  });
}

runExtractClanFameThresholdTempTests();
console.log('[temp tests] extractClanFameThreshold: all cases passed');
