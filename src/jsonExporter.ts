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

  // Clean teams: remove `males` and `females` arrays
  const cleanTeams = cbl.getTeams().map(team => {
    const { males, females, ...rest } = team;
    return rest;
  });

  // Clean groups (teams inside groups also get cleaned)
  const cleanGroups = cbl.getGroups().map(group => ({
    ...group,
    teams: group.teams.map(team => {
      const { males, females, ...rest } = team;
      return rest;
    }),
  }));

  // Transform fixtures: remove homeTeam/awayTeam, use teamIds, scores with team IDs, winnerTeamId
  const cleanFixtures = cbl.getFixtures().map(fx => {
    const { homeTeam, awayTeam, result, ...rest } = fx;
    const teamIds = [homeTeam.id, awayTeam.id];
    const homeId = homeTeam.id;
    const awayId = awayTeam.id;

    let scores = null;
    let winnerTeamId = null;

    if (result) {
      // Build scores object with team IDs as keys
      const scoresObj: any = {};
      for (const cat of ["MS", "WS", "XD"]) {
        const catScore = result.scores[cat];
        if (catScore) {
          scoresObj[cat] = {
            [homeId]: catScore.home,
            [awayId]: catScore.away,
            winner: catScore.winner === "home" ? homeId : awayId,
          };
        }
      }
      scores = scoresObj;
      winnerTeamId = result.tieWinner === "home" ? homeId : awayId;
    }

    return {
      ...rest,
      teamIds,
      scores,
      winnerTeamId,
    };
  });

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