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

// Import modules
import {
  createTeam,
  renameTeam,
  replacePlayerInTeam,
  removePlayerFromTeam,
  buildTeamsAuto
} from './modules/teamManager';
import { createGroups, finalizeGroupStandings } from './modules/groupManager';
import { createAllFixtures, createFixturesForGroup, generateGroupFixtures } from './modules/fixtureManager';
import { simulateMatch, addManualResultToFixture } from './modules/matchSimulator';
import { updateStandingsFromFixture } from './modules/standingsHelper';

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

  // ---------- Team operations (delegated) ----------
  createTeam(name: string, playerIds: number[]): this {
    this.teams = createTeam(this.teams, this.employees, name, playerIds);
    return this;
  }

  renameTeam(teamId: number, newName: string): this {
    this.teams = renameTeam(this.teams, teamId, newName);
    return this;
  }

  replacePlayerInTeam(teamId: number, oldPlayerId: number, newPlayerId: number): this {
    this.teams = replacePlayerInTeam(this.teams, this.employees, teamId, oldPlayerId, newPlayerId);
    return this;
  }

  removePlayerFromTeam(teamId: number, playerId: number): this {
    this.teams = removePlayerFromTeam(this.teams, teamId, playerId);
    return this;
  }

  buildTeams(): this {
    this.teams = buildTeamsAuto(this.employees, this.validateEmployees.bind(this));
    return this;
  }

  // ---------- Group operations ----------
  createGroups(): this {
    this.groups = createGroups(this.teams);
    return this;
  }

  finalizeGroupStage(): this {
    finalizeGroupStandings(this.groups);
    return this;
  }

  // ---------- Fixture operations ----------
  createAllFixtures(): this {
    this.fixtures = createAllFixtures(this.groups);
    return this;
  }

  createFixturesForGroup(groupId: number, append: boolean = false): this {
    this.fixtures = createFixturesForGroup(this.groups, this.fixtures, groupId, append);
    return this;
  }

  generateGroupFixtures(): Fixture[] {
    return generateGroupFixtures(this.groups);
  }

  // ---------- Simulation ----------
  simulateGroupStage(): this {
    if (this.fixtures.length === 0) {
      throw new CBLError("No fixtures found. Call createAllFixtures() first.", "NO_FIXTURES");
    }
    const standingsMap = new Map<number, any>();
    for (const group of this.groups) {
      for (const standing of group.standings) {
        standingsMap.set(standing.team.id, standing);
      }
    }
    for (const fixture of this.fixtures) {
      if (!fixture.result) {
        fixture.result = simulateMatch(fixture.homeTeam, fixture.awayTeam);
      }
      const homeStanding = standingsMap.get(fixture.homeTeam.id);
      const awayStanding = standingsMap.get(fixture.awayTeam.id);
      if (!homeStanding || !awayStanding) {
        throw new CBLError("Standing not found for a team", "INTERNAL_ERROR");
      }
      updateStandingsFromFixture(fixture, homeStanding, awayStanding);
    }
    this.finalizeGroupStage();
    return this;
  }

  addManualResult(fixtureId: number, homeScores: [number, number, number], awayScores: [number, number, number]): this {
    const fixture = this.fixtures.find(f => f.id === fixtureId);
    if (!fixture) {
      throw new CBLError(`Fixture ${fixtureId} not found`, 'FIXTURE_NOT_FOUND', { fixtureId });
    }
    addManualResultToFixture(fixture, homeScores, awayScores);

    // Immediately update standings
    const standingsMap = new Map<number, any>();
    for (const group of this.groups) {
      for (const standing of group.standings) {
        standingsMap.set(standing.team.id, standing);
      }
    }
    const homeStanding = standingsMap.get(fixture.homeTeam.id);
    const awayStanding = standingsMap.get(fixture.awayTeam.id);
    if (!homeStanding || !awayStanding) {
      throw new CBLError("Standing not found for a team", "INTERNAL_ERROR");
    }
    updateStandingsFromFixture(fixture, homeStanding, awayStanding);
    return this;
  }

  // ---------- Getters ----------
  getTeams(): Team[] {
    return [...this.teams];
  }

  getGroups(): Group[] {
    return [...this.groups];
  }

  getFixtures(): Fixture[] {
    return [...this.fixtures];
  }

  getQualifiedTeams(): Team[] {
    return this.groups.map(g => g.qualifiedTeam).filter((t): t is Team => t !== undefined);
  }

  // ---------- JSON export (kept here for simplicity) ----------
  saveToJSON(filename: string = "cbl_data.json"): this {
    const data = {
      teams: this.teams,
      groups: this.groups,
      fixtures: this.fixtures,
      timestamp: new Date().toISOString(),
      stats: {
        totalTeams: this.teams.length,
        totalGroups: this.groups.length,
        totalPlayers: this.teams.reduce((sum, t) => sum + t.players.length, 0),
        totalFixtures: this.fixtures.length,
      },
    };
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return this;
  }

  // ---------- Private validations (still needed for buildTeams) ----------
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
}