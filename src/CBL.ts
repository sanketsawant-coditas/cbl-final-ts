import { Player, Team, Group } from './types';
import {
  PLAYERS_PER_TEAM,
  TEAMS_PER_GROUP,
  MIN_GROUPS,
  MALES_PER_TEAM,
  FEMALES_PER_TEAM
} from './constants';
import { CBLError, ERROR } from './error';
import * as fs from 'fs';
import * as path from 'path';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export class CBL {
  private employees: Player[] = [];
  private teams: Team[] = [];
  private groups: Group[] = [];

  // ---------- Employee management ----------
  loadEmployees(employees: Player[]): this {
    this.employees = employees;
    return this;
  }

  getEmployees(): Player[] {
    return this.employees;
  }

  saveEmployeesToJSON(filename: string = "employees.json"): this {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, JSON.stringify(this.employees, null, 2));
    return this;
  }

  addPlayer(player: Player): this {
    this.employees.push(player);
    return this;
  }

  removePlayerById(id: number): this {
    const index = this.employees.findIndex(p => p.id === id);
    if (index !== -1) this.employees.splice(index, 1);
    return this;
  }

  replacePlayerById(id: number, newPlayer: Player): this {
    const index = this.employees.findIndex(p => p.id === id);
    if (index !== -1) {
      this.employees[index] = newPlayer;
    } else {
      throw new Error(`Player with id ${id} not found.`);
    }
    return this;
  }

  // ---------- Manual team building (throws on error) ----------
  createTeam(name: string, playerIds: number[]): this {
    const players: Player[] = [];
    for (const id of playerIds) {
      const player = this.employees.find(e => e.id === id);
      if (!player) throw new Error(`Player with id ${id} not found`);
      const alreadyInTeam = this.teams.some(t => t.players.some(p => p.id === id));
      if (alreadyInTeam) throw new Error(`Player ${player.name} (id ${id}) is already in another team`);
      players.push(player);
    }
    const males = players.filter(p => p.gender === 'M');
    const females = players.filter(p => p.gender === 'F');
    if (males.length !== MALES_PER_TEAM || females.length !== FEMALES_PER_TEAM) {
      throw new Error(`Team ${name} must have exactly ${MALES_PER_TEAM}M and ${FEMALES_PER_TEAM}F. Provided: ${males.length}M, ${females.length}F`);
    }
    this.teams.push({
      id: this.teams.length + 1,
      name,
      players,
      males,
      females,
    });
    return this;
  }

  renameTeam(teamId: number, newName: string): this {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) throw new Error(`Team with id ${teamId} not found`);
    team.name = newName;
    return this;
  }

  replacePlayerInTeam(teamId: number, oldPlayerId: number, newPlayerId: number): this {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);
    const oldIndex = team.players.findIndex(p => p.id === oldPlayerId);
    if (oldIndex === -1) throw new Error(`Player ${oldPlayerId} not in team`);
    const newPlayer = this.employees.find(e => e.id === newPlayerId);
    if (!newPlayer) throw new Error(`New player ${newPlayerId} not found`);
    const alreadyInTeam = this.teams.some(t => t.id !== teamId && t.players.some(p => p.id === newPlayerId));
    if (alreadyInTeam) throw new Error(`Player ${newPlayer.name} is already in another team`);
    team.players[oldIndex] = newPlayer;
    team.males = team.players.filter(p => p.gender === 'M');
    team.females = team.players.filter(p => p.gender === 'F');
    if (team.males.length !== MALES_PER_TEAM || team.females.length !== FEMALES_PER_TEAM) {
      throw new Error(`After replacement, team ${team.name} has ${team.males.length}M, ${team.females.length}F – need exactly ${MALES_PER_TEAM}M/${FEMALES_PER_TEAM}F`);
    }
    return this;
  }

  removePlayerFromTeam(teamId: number, playerId: number): this {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);
    const index = team.players.findIndex(p => p.id === playerId);
    if (index === -1) throw new Error(`Player ${playerId} not in team`);
    team.players.splice(index, 1);
    team.males = team.players.filter(p => p.gender === 'M');
    team.females = team.players.filter(p => p.gender === 'F');
    if (team.males.length !== MALES_PER_TEAM || team.females.length !== FEMALES_PER_TEAM) {
      console.warn(`Team ${team.name} now has ${team.males.length}M, ${team.females.length}F – not a full team.`);
    }
    return this;
  }

  // ---------- Automatic team building (throws on validation error) ----------
  buildTeams(): this {
    const { males, females, completeTeams } = this.validateEmployees();
    const usableMales = shuffle(males).slice(0, completeTeams * MALES_PER_TEAM);
    const usableFemales = shuffle(females).slice(0, completeTeams * FEMALES_PER_TEAM);
    const malePairs = chunk(usableMales, MALES_PER_TEAM);
    const femalePairs = chunk(usableFemales, FEMALES_PER_TEAM);
    this.teams = malePairs.map((mp, i) => ({
      id: i + 1,
      name: `Team ${i + 1}`,
      players: [...mp, ...femalePairs[i]],
      males: mp,
      females: femalePairs[i],
    }));
    return this;
  }

  // ---------- Group creation (throws on validation error) ----------
  createGroups(): this {
    const { completeGroups } = this.validateTeams();
    const usableTeams = shuffle(this.teams).slice(0, completeGroups * TEAMS_PER_GROUP);
    this.groups = chunk(usableTeams, TEAMS_PER_GROUP).map((groupTeams, i) => ({
      id: i + 1,
      name: `Group ${String.fromCharCode(65 + i)}`,
      teams: groupTeams,
      standings: groupTeams.map(t => ({
        team: t,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        tiesWon: 0,
      })),
    }));
    return this;
  }

  getTeams(): Team[] {
    return this.teams;
  }

  getGroups(): Group[] {
    return this.groups;
  }

  saveToJSON(filename: string = "cbl_data.json"): this {
    const data = {
      teams: this.teams,
      groups: this.groups,
      timestamp: new Date().toISOString(),
      stats: {
        totalTeams: this.teams.length,
        totalGroups: this.groups.length,
        totalPlayers: this.teams.reduce((sum, t) => sum + t.players.length, 0)
      }
    };
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return this;
  }

  // ---------- Private validations (throw CBLError) ----------
  private validateEmployees(): { males: Player[]; females: Player[]; completeTeams: number } {
    if (!this.employees || this.employees.length === 0) {
      throw new CBLError("No employee data provided.", ERROR.NO_EMPLOYEES, { received: 0 });
    }
    const males = this.employees.filter(e => e.gender === "M");
    const females = this.employees.filter(e => e.gender === "F");
    const total = this.employees.length;

    if (total < PLAYERS_PER_TEAM) {
      throw new CBLError(
        `Not enough players to form a single team. Received ${total}, need ${PLAYERS_PER_TEAM}.`,
        ERROR.NOT_ENOUGH_PLAYERS,
        { total, required: PLAYERS_PER_TEAM }
      );
    }
    if (males.length !== females.length) {
      const diff = Math.abs(males.length - females.length);
      const moreSide = males.length > females.length ? "male" : "female";
      throw new CBLError(
        `Unequal gender split: ${males.length}M, ${females.length}F – ${diff} extra ${moreSide}(s).`,
        ERROR.GENDER_IMBALANCE,
        { males: males.length, females: females.length, diff }
      );
    }
    const minPlayers = MIN_GROUPS * TEAMS_PER_GROUP * PLAYERS_PER_TEAM;
    if (total < minPlayers) {
      const teamsCanForm = Math.floor(total / PLAYERS_PER_TEAM);
      const groupsCanForm = Math.floor(teamsCanForm / TEAMS_PER_GROUP);
      throw new CBLError(
        `Too few players for a valid tournament. Need ≥ ${minPlayers} players.`,
        ERROR.NOT_ENOUGH_GROUPS,
        { total, teamsCanForm, groupsCanForm, minRequired: minPlayers }
      );
    }
    const completeTeams = Math.floor(males.length / MALES_PER_TEAM);
    return { males, females, completeTeams };
  }

  private validateTeams(): { completeGroups: number } {
    const minTeams = MIN_GROUPS * TEAMS_PER_GROUP;
    if (this.teams.length < minTeams) {
      throw new CBLError(
        `Not enough complete teams. Formed ${this.teams.length}, need at least ${minTeams}.`,
        ERROR.NOT_ENOUGH_TEAMS,
        { teamsFormed: this.teams.length, minRequired: minTeams }
      );
    }
    const completeGroups = Math.floor(this.teams.length / TEAMS_PER_GROUP);
    return { completeGroups };
  }
}