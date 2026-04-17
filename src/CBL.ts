import { Player, Team, Group, Fixture } from './types';
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
  private fixtures: Fixture[] = [];

  // ---------- Employee management ----------
  loadEmployees(employees: Player[]): this {
    this.employees = employees;
    return this;
  }

  getEmployees(): Player[] {
    return [...this.employees];
  }

  saveEmployeesToJSON(filename: string = "employees.json"): this {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, JSON.stringify(this.employees, null, 2));
    return this;
  }

  addPlayer(player: Player): this {
    if (this.employees.some(e => e.id === player.id)) {
      throw new CBLError(`Player with id ${player.id} already exists`, 'DUPLICATE_PLAYER', { id: player.id });
    }
    this.employees.push(player);
    return this;
  }

  removePlayerById(id: number): this {
    const index = this.employees.findIndex(p => p.id === id);
    if (index !== -1) this.employees.splice(index, 1);
    return this;
  }

  replacePlayerById(id: number, newPlayer: Player): this {
    if (newPlayer.id !== id) {
      throw new CBLError(`newPlayer.id (${newPlayer.id}) does not match target id ${id}`, 'ID_MISMATCH', { target: id, provided: newPlayer.id });
    }
    const index = this.employees.findIndex(p => p.id === id);
    if (index !== -1) {
      this.employees[index] = newPlayer;
    } else {
      throw new CBLError(`Player with id ${id} not found.`, 'PLAYER_NOT_FOUND', { id });
    }
    return this;
  }

  // ---------- Manual team building ----------
  createTeam(name: string, playerIds: number[]): this {
    const errors: string[] = [];
    const players: Player[] = [];

    for (const id of playerIds) {
      const player = this.employees.find(e => e.id === id);
      if (!player) {
        errors.push(`Player with id ${id} not found`);
        continue;
      }
      const alreadyInTeam = this.teams.some(t => t.players.some(p => p.id === id));
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
    if (!team) throw new CBLError(`Team with id ${teamId} not found`, 'TEAM_NOT_FOUND', { teamId });
    team.name = newName;
    return this;
  }

  replacePlayerInTeam(teamId: number, oldPlayerId: number, newPlayerId: number): this {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) throw new CBLError(`Team ${teamId} not found`, 'TEAM_NOT_FOUND', { teamId });

    const oldIndex = team.players.findIndex(p => p.id === oldPlayerId);
    if (oldIndex === -1) throw new CBLError(`Player ${oldPlayerId} not in team`, 'PLAYER_NOT_IN_TEAM', { oldPlayerId });

    const newPlayer = this.employees.find(e => e.id === newPlayerId);
    if (!newPlayer) throw new CBLError(`New player ${newPlayerId} not found`, 'PLAYER_NOT_FOUND', { newPlayerId });

    const alreadyInTeam = this.teams.some(t => t.id !== teamId && t.players.some(p => p.id === newPlayerId));
    if (alreadyInTeam) throw new CBLError(`Player ${newPlayer.id} :${newPlayer.name} is already in another team`, 'PLAYER_ALREADY_IN_TEAM', { playerId: newPlayerId, playerName: newPlayer.name });

    team.players[oldIndex] = newPlayer;
    team.males = team.players.filter(p => p.gender === 'M');
    team.females = team.players.filter(p => p.gender === 'F');

    if (team.males.length !== MALES_PER_TEAM || team.females.length !== FEMALES_PER_TEAM) {
      throw new CBLError(`After replacement, team ${team.name} has ${team.males.length}M, ${team.females.length}F – need exactly ${MALES_PER_TEAM}M/${FEMALES_PER_TEAM}F`, 'INVALID_TEAM_COMPOSITION', { males: team.males.length, females: team.females.length });
    }
    return this;
  }

  removePlayerFromTeam(teamId: number, playerId: number): this {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) throw new CBLError(`Team ${teamId} not found`, 'TEAM_NOT_FOUND', { teamId });

    const index = team.players.findIndex(p => p.id === playerId);
    if (index === -1) throw new CBLError(`Player ${playerId} not in team`, 'PLAYER_NOT_IN_TEAM', { playerId });

    team.players.splice(index, 1);
    team.males = team.players.filter(p => p.gender === 'M');
    team.females = team.players.filter(p => p.gender === 'F');

    if (team.males.length !== MALES_PER_TEAM || team.females.length !== FEMALES_PER_TEAM) {
      console.warn(`Team ${team.name} now has ${team.males.length}M, ${team.females.length}F – not a full team.`);
    }
    return this;
  }

  // ---------- Automatic team building ----------
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

  // ---------- Group creation ----------
  createGroups(): this {
    this.validateTeams();

    if (this.teams.length < TEAMS_PER_GROUP) {
      throw new CBLError(
        `Not enough teams to form a single group. Need at least ${TEAMS_PER_GROUP} teams, but only ${this.teams.length} available.`,
        ERROR.NOT_ENOUGH_TEAMS,
        { teamsFormed: this.teams.length, minRequired: TEAMS_PER_GROUP }
      );
    }

    const completeGroups = Math.floor(this.teams.length / TEAMS_PER_GROUP);
    const usableTeams = shuffle(this.teams).slice(0, completeGroups * TEAMS_PER_GROUP);
    this.groups = chunk(usableTeams, TEAMS_PER_GROUP).map((groupTeams, i) => {
      const groupId = i + 1;
      const groupName = groupId <= 26 ? `Group ${String.fromCharCode(64 + groupId)}` : `Group ${groupId}`;
      return {
        id: groupId,
        name: groupName,
        teams: groupTeams,
        standings: groupTeams.map(t => ({
          team: t,
          played: 0,
          wins: 0,
          losses: 0,
          points: 0,
          tiesWon: 0,
        })),
      };
    });
    return this;
  }

  // ---------- Fixture generation (private helpers) ----------
  private generateRoundRobinFixtures(teams: Team[], groupName: string, startId: number): Fixture[] {
    const fixtures: Fixture[] = [];
    let fid = startId;
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          id: fid++,
          stage: 'group',
          groupName,
          homeTeam: teams[i],
          awayTeam: teams[j],
          result: null,
        });
      }
    }
    return fixtures;
  }

  createAllFixtures(): this {
    if (this.groups.length === 0) {
      throw new CBLError('No groups found. Call createGroups() first.', 'NO_GROUPS');
    }
    this.fixtures = [];
    let nextId = 1;
    for (const group of this.groups) {
      const groupFixtures = this.generateRoundRobinFixtures(group.teams, group.name, nextId);
      this.fixtures.push(...groupFixtures);
      nextId += groupFixtures.length;
    }
    return this;
  }

  createFixturesForGroup(groupId: number, append: boolean = false): this {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new CBLError(`Group with id ${groupId} not found.`, 'GROUP_NOT_FOUND', { groupId });
    }
    const newFixtures = this.generateRoundRobinFixtures(group.teams, group.name, this.fixtures.length + 1);
    if (append) {
      this.fixtures.push(...newFixtures);
    } else {
      this.fixtures = newFixtures;
    }
    return this;
  }

  generateGroupFixtures(): Fixture[] {
    if (this.groups.length === 0) {
      throw new CBLError('No groups created. Call createGroups() first.', 'NO_GROUPS');
    }
    const fixtures: Fixture[] = [];
    let fixtureId = 1;
    for (const group of this.groups) {
      const groupFixtures = this.generateRoundRobinFixtures(group.teams, group.name, fixtureId);
      fixtures.push(...groupFixtures);
      fixtureId += groupFixtures.length;
    }
    return fixtures;
  }

  // ---------- Getters (return copies) ----------
  getTeams(): Team[] {
    return [...this.teams];
  }

  getGroups(): Group[] {
    return [...this.groups];
  }

  getFixtures(): Fixture[] {
    return [...this.fixtures];
  }

  // ---------- Private validations ----------
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

  private validateTeams(): void {
    const minTeams = MIN_GROUPS * TEAMS_PER_GROUP;
    if (this.teams.length < minTeams) {
      throw new CBLError(
        `Not enough complete teams. Formed ${this.teams.length}, need at least ${minTeams}.`,
        ERROR.NOT_ENOUGH_TEAMS,
        { teamsFormed: this.teams.length, minRequired: minTeams }
      );
    }
  }
}