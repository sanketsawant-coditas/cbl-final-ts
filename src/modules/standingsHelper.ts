import { Fixture, Standing } from '../types';

export function updateStandingsFromFixture(
  fixture: Fixture,
  homeStanding: Standing,
  awayStanding: Standing
): void {
  const result = fixture.result;
  if (!result) return;

  const categories = ["MS", "WS", "XD"] as const;
  for (const cat of categories) {
    if (result.scores[cat].home > result.scores[cat].away) {
      homeStanding.points++;
    } else {
      awayStanding.points++;
    }
  }
  homeStanding.played++;
  awayStanding.played++;

  if (result.tieWinner === "home") {
    homeStanding.tiesWon++;
    homeStanding.wins++;
    awayStanding.losses++;
  } else {
    awayStanding.tiesWon++;
    awayStanding.wins++;
    homeStanding.losses++;
  }
}