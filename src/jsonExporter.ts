// src/jsonExporter.ts
import * as fs from 'fs';
import * as path from 'path';
import { CBL } from './CBL';

const OUTPUT_DIR = path.join(process.cwd(), 'cbl-output');

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function generateFileName(): string {
  const files = fs.readdirSync(OUTPUT_DIR);
  const pattern = /^(\d+)-cbl-.*\.json$/;
  let maxNum = 0;
  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = (maxNum + 1).toString().padStart(2, '0');
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${nextNum}-cbl-${hours}.${minutes}.json`;
}

export function exportToJSON(cbl: CBL): void {
  ensureOutputDir();
  const fileName = generateFileName();
  const fullPath = path.join(OUTPUT_DIR, fileName);

  // Generate fixtures from current groups
  const fixtures = cbl.generateGroupFixtures();

  const data = {
    teams: cbl.getTeams(),
    groups: cbl.getGroups(),
    fixtures: fixtures,                    
    timestamp: new Date().toISOString(),
    stats: {
      totalTeams: cbl.getTeams().length,
      totalGroups: cbl.getGroups().length,
      totalPlayers: cbl.getTeams().reduce((sum, t) => sum + t.players.length, 0),
      totalFixtures: fixtures.length
    }
  };

  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}