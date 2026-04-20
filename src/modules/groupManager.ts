import { Team, Group } from '../types';
import { TEAMS_PER_GROUP, MIN_GROUPS } from '../constants';
import { CBLError, ERROR } from '../error';
import { shuffle, chunk } from '../utils/helpers';

export function createGroups(teams: Team[]): Group[] {
  const minTeams = MIN_GROUPS * TEAMS_PER_GROUP;  
  if (teams.length < minTeams) {
    throw new CBLError(
      `Not enough complete teams. Formed ${teams.length}, need at least ${minTeams}.`,
      ERROR.NOT_ENOUGH_TEAMS,
      { teamsFormed: teams.length, minRequired: minTeams }
    );
  }
  if (teams.length < TEAMS_PER_GROUP) {
    throw new CBLError(
      `Not enough teams to form a single group. Need at least ${TEAMS_PER_GROUP} teams, but only ${teams.length} available.`,
      ERROR.NOT_ENOUGH_TEAMS,
      { teamsFormed: teams.length, minRequired: TEAMS_PER_GROUP }
    );
  }

  const completeGroups = Math.floor(teams.length / TEAMS_PER_GROUP);
  const usableTeams = shuffle(teams).slice(0, completeGroups * TEAMS_PER_GROUP);
  const groups = chunk(usableTeams, TEAMS_PER_GROUP).map((groupTeams: Team[], i: number) => {
    const groupId = i + 1;
    const groupName = groupId <= 26 ? `Group ${String.fromCharCode(64 + groupId)}` : `Group ${groupId}`;
    return {
      id: groupId,
      name: groupName,
      teams: groupTeams,
      standings: groupTeams.map((t: Team) => ({
        team: t,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        tiesWon: 0,
      })),
    };
  });
  return groups;
}

export function finalizeGroupStandings(groups: Group[]): void {
  for (const group of groups) {
    group.standings.sort((a, b) => {
      if (b.tiesWon !== a.tiesWon) return b.tiesWon - a.tiesWon;
      return b.points - a.points;
    });
    group.qualifiedTeam = group.standings[0].team;
  }
}