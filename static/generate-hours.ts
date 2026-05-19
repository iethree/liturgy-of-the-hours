import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { getHour, getHourNames } from '../src/hours.ts';
import { format, addDay } from '../src/time.ts';
import { log } from '../src/logger.ts';
import type { HourResult } from '../src/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(__dirname, '_data', 'hours.json');

async function generateHours(startDate: string, num: number): Promise<HourResult[]> {
  const hours = getHourNames().filter((h) => h !== 'random' && h !== 'lectionary');
  const output: HourResult[] = [];
  let date = startDate;

  for (let i = 0; i < num; i++) {
    for (const hour of hours) {
      try {
        const result = await getHour(hour, date);
        output.push(result);
      } catch (e: unknown) {
        log.err(`no office for ${hour} on ${date}`, e);
      }
    }
    date = addDay(date);
  }

  await writeFile(outputFile, JSON.stringify(output));
  log.success(`${output.length} offices written to ${outputFile}`);
  return output;
}

const isMain = typeof Bun !== 'undefined' && import.meta.main;
if (isMain) {
  const days = Number(process.argv[2] ?? 7);
  await generateHours(format.numerical(new Date()), days);
  process.exit(0);
}

export { generateHours };
