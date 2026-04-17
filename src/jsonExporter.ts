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

// src/jsonExporter.ts (updated)
export function exportToJSON(cbl: CBL): void {
  ensureOutputDir();
  const fileName = generateFileName();
  const fullPath = path.join(OUTPUT_DIR, fileName);

  // Clean teams: remove `males` and `females` arrays
  const cleanTeams = cbl.getTeams().map(team => {
    const { males, females, ...rest } = team;  // exclude males/females
    return rest;
  });

  // Groups contain teams – we must also clean teams inside groups
  const cleanGroups = cbl.getGroups().map(group => ({
    ...group,
    teams: group.teams.map(team => {
      const { males, females, ...rest } = team;
      return rest;
    }),
  }));

  // Fixtures contain homeTeam and awayTeam – clean those too
  const cleanFixtures = cbl.getFixtures().map(fx => ({
    ...fx,
    homeTeam: (() => {
      const { males, females, ...rest } = fx.homeTeam;
      return rest;
    })(),
    awayTeam: (() => {
      const { males, females, ...rest } = fx.awayTeam;
      return rest;
    })(),
  }));

  const data = {
    teams: cleanTeams,
    groups: cleanGroups,
    fixtures: cleanFixtures,
    timestamp: new Date().toISOString(),
    stats: {
      totalTeams: cbl.getTeams().length,
      totalGroups: cbl.getGroups().length,
      totalPlayers: cbl.getTeams().reduce((sum, t) => sum + t.players.length, 0),
      totalFixtures: cbl.getFixtures().length,
    },
  };

  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}