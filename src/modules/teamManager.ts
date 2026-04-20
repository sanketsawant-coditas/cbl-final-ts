import { Player, Team } from '../types';
import { MALES_PER_TEAM, FEMALES_PER_TEAM } from '../constants';
import { CBLError } from '../error';
import { shuffle, chunk } from '../utils/helpers';

// ---------- Manual team building ----------
export function createTeam(
  teams: Team[],
  employees: Player[],
  name: string,
  playerIds: number[]
): Team[] {
  const errors: string[] = [];
  const players: Player[] = [];

  for (const id of playerIds) {
    const player = employees.find(e => e.id === id);
    if (!player) {
      errors.push(`Player with id ${id} not found`);
      continue;
    }
    const alreadyInTeam = teams.some(t => t.players.some(p => p.id === id));
    if (alreadyInTeam) {
      errors.push(`Player ${player.name} (id ${id}) is already in another team`);
    } else {
      players.push(player);
    }
  }

  if (errors.length > 0) {
    throw new CBLError(`Cannot create team "${name}":\n  - ` + errors.join('\n  - '), 'TEAM_CREATION_FAILED', { errors });
  }

  const males = players.filter(p => p.gender === 'M');
  const females = players.filter(p => p.gender === 'F');
  if (males.length !== MALES_PER_TEAM || females.length !== FEMALES_PER_TEAM) {
    throw new CBLError(`Team ${name} must have exactly ${MALES_PER_TEAM}M and ${FEMALES_PER_TEAM}F. Provided: ${males.length}M, ${females.length}F`, 'INVALID_TEAM_COMPOSITION', { males: males.length, females: females.length });
  }

  const newTeam: Team = {
    id: teams.length + 1,
    name,
    players,
    males,
    females,
  };
  return [...teams, newTeam];
}

export function renameTeam(teams: Team[], teamId: number, newName: string): Team[] {
  const team = teams.find(t => t.id === teamId);
  if (!team) throw new CBLError(`Team with id ${teamId} not found`, 'TEAM_NOT_FOUND', { teamId });
  team.name = newName;
  return teams;
}

export function replacePlayerInTeam(
  teams: Team[],
  employees: Player[],
  teamId: number,
  oldPlayerId: number,
  newPlayerId: number
): Team[] {
  const teamIndex = teams.findIndex(t => t.id === teamId);
  if (teamIndex === -1) throw new CBLError(`Team ${teamId} not found`, 'TEAM_NOT_FOUND', { teamId });

  const team = { ...teams[teamIndex] };
  const oldIndex = team.players.findIndex(p => p.id === oldPlayerId);
  if (oldIndex === -1) throw new CBLError(`Player ${oldPlayerId} not in team`, 'PLAYER_NOT_IN_TEAM', { oldPlayerId });

  const newPlayer = employees.find(e => e.id === newPlayerId);
  if (!newPlayer) throw new CBLError(`New player ${newPlayerId} not found`, 'PLAYER_NOT_FOUND', { newPlayerId });

  const alreadyInTeam = teams.some(t => t.id !== teamId && t.players.some(p => p.id === newPlayerId));
  if (alreadyInTeam) throw new CBLError(`Player ${newPlayer.name} already in another team`, 'PLAYER_ALREADY_IN_TEAM', { newPlayerId });

  const testPlayers = [...team.players];
  testPlayers[oldIndex] = newPlayer;
  const testMales = testPlayers.filter(p => p.gender === 'M');
  const testFemales = testPlayers.filter(p => p.gender === 'F');

  if (testMales.length !== MALES_PER_TEAM || testFemales.length !== FEMALES_PER_TEAM) {
    throw new CBLError(
      `Replacement breaks gender balance: ${testMales.length}M/${testFemales.length}F`,
      'INVALID_TEAM_COMPOSITION',
      { males: testMales.length, females: testFemales.length }
    );
  }

  team.players = testPlayers;
  team.males = testMales;
  team.females = testFemales;
  const newTeams = [...teams];
  newTeams[teamIndex] = team;
  return newTeams;
}

export function removePlayerFromTeam(teams: Team[], teamId: number, playerId: number): Team[] {
  const teamIndex = teams.findIndex(t => t.id === teamId);
  if (teamIndex === -1) throw new CBLError(`Team ${teamId} not found`, 'TEAM_NOT_FOUND', { teamId });

  const team = { ...teams[teamIndex] };
  const index = team.players.findIndex(p => p.id === playerId);
  if (index === -1) throw new CBLError(`Player ${playerId} not in team`, 'PLAYER_NOT_IN_TEAM', { playerId });

  team.players.splice(index, 1);
  team.males = team.players.filter(p => p.gender === 'M');
  team.females = team.players.filter(p => p.gender === 'F');

  if (team.males.length !== MALES_PER_TEAM || team.females.length !== FEMALES_PER_TEAM) {
    console.warn(`Team ${team.name} now has ${team.males.length}M, ${team.females.length}F – not a full team.`);
  }

  const newTeams = [...teams];
  newTeams[teamIndex] = team;
  return newTeams;
}

// ---------- Automatic team building ----------
export function buildTeamsAuto(employees: Player[], validateEmployees: (employees: Player[]) => { males: Player[]; females: Player[]; completeTeams: number }): Team[] {
  const { males, females, completeTeams } = validateEmployees(employees);
  const usableMales = shuffle(males).slice(0, completeTeams * MALES_PER_TEAM);
  const usableFemales = shuffle(females).slice(0, completeTeams * FEMALES_PER_TEAM);
  const malePairs = chunk(usableMales, MALES_PER_TEAM);
  const femalePairs = chunk(usableFemales, FEMALES_PER_TEAM);
  return malePairs.map((mp, i) => ({
    id: i + 1,
    name: `Team ${i + 1}`,
    players: [...mp, ...femalePairs[i]],
    males: mp,
    females: femalePairs[i],
  }));
}