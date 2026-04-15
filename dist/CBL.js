"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CBL = void 0;
const constants_1 = require("./constants");
const error_1 = require("./error");
const fs = require("fs");
const path = require("path");
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size));
    return out;
}
class CBL {
    constructor() {
        this.employees = [];
        this.teams = [];
        this.groups = [];
    }
    // ---------- Employee management ----------
    loadEmployees(employees) {
        this.employees = employees;
        return this;
    }
    getEmployees() {
        return this.employees;
    }
    saveEmployeesToJSON(filename = "employees.json") {
        const filePath = path.join(process.cwd(), filename);
        fs.writeFileSync(filePath, JSON.stringify(this.employees, null, 2));
        return this;
    }
    addPlayer(player) {
        this.employees.push(player);
        return this;
    }
    removePlayerById(id) {
        const index = this.employees.findIndex(p => p.id === id);
        if (index !== -1)
            this.employees.splice(index, 1);
        return this;
    }
    replacePlayerById(id, newPlayer) {
        const index = this.employees.findIndex(p => p.id === id);
        if (index !== -1) {
            this.employees[index] = newPlayer;
        }
        else {
            throw new Error(`Player with id ${id} not found.`);
        }
        return this;
    }
    // ---------- Manual team building (throws on error) ----------
    createTeam(name, playerIds) {
        const errors = [];
        const players = [];
        // First, check each ID for existence and duplication
        for (const id of playerIds) {
            const player = this.employees.find(e => e.id === id);
            if (!player) {
                errors.push(`Player with id ${id} not found`);
                continue;
            }
            const alreadyInTeam = this.teams.some(t => t.players.some(p => p.id === id));
            if (alreadyInTeam) {
                errors.push(`Player ${player.name} (id ${id}) is already in another team`);
            }
            else {
                players.push(player);
            }
        }
        // If any errors, throw them all at once
        if (errors.length > 0) {
            throw new Error(`Cannot create team "${name}":\n  - ` + errors.join('\n  - '));
        }
        // Then validate gender composition
        const males = players.filter(p => p.gender === 'M');
        const females = players.filter(p => p.gender === 'F');
        if (males.length !== constants_1.MALES_PER_TEAM || females.length !== constants_1.FEMALES_PER_TEAM) {
            throw new Error(`Team ${name} must have exactly ${constants_1.MALES_PER_TEAM}M and ${constants_1.FEMALES_PER_TEAM}F. Provided: ${males.length}M, ${females.length}F`);
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
    renameTeam(teamId, newName) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team)
            throw new Error(`Team with id ${teamId} not found`);
        team.name = newName;
        return this;
    }
    replacePlayerInTeam(teamId, oldPlayerId, newPlayerId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team)
            throw new Error(`Team ${teamId} not found`);
        const oldIndex = team.players.findIndex(p => p.id === oldPlayerId);
        if (oldIndex === -1)
            throw new Error(`Player ${oldPlayerId} not in team`);
        const newPlayer = this.employees.find(e => e.id === newPlayerId);
        if (!newPlayer)
            throw new Error(`New player ${newPlayerId} not found`);
        const alreadyInTeam = this.teams.some(t => t.id !== teamId && t.players.some(p => p.id === newPlayerId));
        if (alreadyInTeam)
            throw new Error(`Player ${newPlayer.name} is already in another team`);
        team.players[oldIndex] = newPlayer;
        team.males = team.players.filter(p => p.gender === 'M');
        team.females = team.players.filter(p => p.gender === 'F');
        if (team.males.length !== constants_1.MALES_PER_TEAM || team.females.length !== constants_1.FEMALES_PER_TEAM) {
            throw new Error(`After replacement, team ${team.name} has ${team.males.length}M, ${team.females.length}F – need exactly ${constants_1.MALES_PER_TEAM}M/${constants_1.FEMALES_PER_TEAM}F`);
        }
        return this;
    }
    removePlayerFromTeam(teamId, playerId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team)
            throw new Error(`Team ${teamId} not found`);
        const index = team.players.findIndex(p => p.id === playerId);
        if (index === -1)
            throw new Error(`Player ${playerId} not in team`);
        team.players.splice(index, 1);
        team.males = team.players.filter(p => p.gender === 'M');
        team.females = team.players.filter(p => p.gender === 'F');
        if (team.males.length !== constants_1.MALES_PER_TEAM || team.females.length !== constants_1.FEMALES_PER_TEAM) {
            console.warn(`Team ${team.name} now has ${team.males.length}M, ${team.females.length}F – not a full team.`);
        }
        return this;
    }
    // ---------- Automatic team building (throws on validation error) ----------
    buildTeams() {
        const { males, females, completeTeams } = this.validateEmployees();
        const usableMales = shuffle(males).slice(0, completeTeams * constants_1.MALES_PER_TEAM);
        const usableFemales = shuffle(females).slice(0, completeTeams * constants_1.FEMALES_PER_TEAM);
        const malePairs = chunk(usableMales, constants_1.MALES_PER_TEAM);
        const femalePairs = chunk(usableFemales, constants_1.FEMALES_PER_TEAM);
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
    createGroups() {
        const { completeGroups } = this.validateTeams();
        const usableTeams = shuffle(this.teams).slice(0, completeGroups * constants_1.TEAMS_PER_GROUP);
        this.groups = chunk(usableTeams, constants_1.TEAMS_PER_GROUP).map((groupTeams, i) => ({
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
    getTeams() {
        return this.teams;
    }
    getGroups() {
        return this.groups;
    }
    saveToJSON(filename = "cbl_data.json") {
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
    validateEmployees() {
        if (!this.employees || this.employees.length === 0) {
            throw new error_1.CBLError("No employee data provided.", error_1.ERROR.NO_EMPLOYEES, { received: 0 });
        }
        const males = this.employees.filter(e => e.gender === "M");
        const females = this.employees.filter(e => e.gender === "F");
        const total = this.employees.length;
        if (total < constants_1.PLAYERS_PER_TEAM) {
            throw new error_1.CBLError(`Not enough players to form a single team. Received ${total}, need ${constants_1.PLAYERS_PER_TEAM}.`, error_1.ERROR.NOT_ENOUGH_PLAYERS, { total, required: constants_1.PLAYERS_PER_TEAM });
        }
        if (males.length !== females.length) {
            const diff = Math.abs(males.length - females.length);
            const moreSide = males.length > females.length ? "male" : "female";
            throw new error_1.CBLError(`Unequal gender split: ${males.length}M, ${females.length}F – ${diff} extra ${moreSide}(s).`, error_1.ERROR.GENDER_IMBALANCE, { males: males.length, females: females.length, diff });
        }
        const minPlayers = constants_1.MIN_GROUPS * constants_1.TEAMS_PER_GROUP * constants_1.PLAYERS_PER_TEAM;
        if (total < minPlayers) {
            const teamsCanForm = Math.floor(total / constants_1.PLAYERS_PER_TEAM);
            const groupsCanForm = Math.floor(teamsCanForm / constants_1.TEAMS_PER_GROUP);
            throw new error_1.CBLError(`Too few players for a valid tournament. Need ≥ ${minPlayers} players.`, error_1.ERROR.NOT_ENOUGH_GROUPS, { total, teamsCanForm, groupsCanForm, minRequired: minPlayers });
        }
        const completeTeams = Math.floor(males.length / constants_1.MALES_PER_TEAM);
        return { males, females, completeTeams };
    }
    validateTeams() {
        const minTeams = constants_1.MIN_GROUPS * constants_1.TEAMS_PER_GROUP;
        if (this.teams.length < minTeams) {
            throw new error_1.CBLError(`Not enough complete teams. Formed ${this.teams.length}, need at least ${minTeams}.`, error_1.ERROR.NOT_ENOUGH_TEAMS, { teamsFormed: this.teams.length, minRequired: minTeams });
        }
        const completeGroups = Math.floor(this.teams.length / constants_1.TEAMS_PER_GROUP);
        return { completeGroups };
    }
}
exports.CBL = CBL;
