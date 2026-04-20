import { Team, Fixture } from '../types';


// -------------------- automatic for testing ---------------------
function simulateGame(): { home: number; away: number } {
  let home = 0, away = 0;
  while (home < 21 && away < 21) {
    if (Math.random() > 0.5) home++; else away++;
    if (home === 20 && away === 20) {
      if (Math.random() > 0.5) home = 21; else away = 21;
      break;
    }
  }
  return { home, away };
}

export function simulateMatch(home: Team, away: Team): any {
  const scores: any = {};
  let homeWins = 0, awayWins = 0;
  for (const cat of ["MS", "WS", "XD"]) {
    const s = simulateGame();
    const homeWon = s.home > s.away;
    if (homeWon) homeWins++; else awayWins++;
    scores[cat] = { ...s, winner: homeWon ? "home" : "away" };
  }
  return {
    scores,
    homeWins,
    awayWins,
    tieWinner: homeWins >= 2 ? "home" : "away",
  };
}

//------------------------- manual result entry -------------------------
export function addManualResultToFixture(
  fixture: Fixture,
  homeScores: [number, number, number],
  awayScores: [number, number, number]
): void {
  const scores: any = {};
  let homeWins = 0, awayWins = 0;
  const categories = ["MS", "WS", "XD"];
  for (let i = 0; i < 3; i++) {
    const home = homeScores[i];
    const away = awayScores[i];
    const homeWon = home > away;
    if (homeWon) homeWins++; else awayWins++;
    scores[categories[i]] = { home, away, winner: homeWon ? "home" : "away" };
  }
  fixture.result = {
    scores,
    homeWins,
    awayWins,
    tieWinner: homeWins >= 2 ? "home" : "away",
  };
}