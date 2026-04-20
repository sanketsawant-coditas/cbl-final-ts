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
        this.fixtures = [];
    }
    // ---------- Employee management ----------
    loadEmployees(employees) {
        this.employees = employees;
        return this;
    }
    getEmployees() {
        return [...this.employees];
    }
    saveEmployeesToJSON(filename = "employees.json") {
        const filePath = path.join(process.cwd(), filename);
        fs.writeFileSync(filePath, JSON.stringify(this.employees, null, 2));
        return this;
    }
    addPlayer(player) {
        if (this.employees.some(e => e.id === player.id)) {
            throw new error_1.CBLError(`Player with id ${player.id} already exists`, 'DUPLICATE_PLAYER', { id: player.id });
        }
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
        if (newPlayer.id !== id) {
            throw new error_1.CBLError(`newPlayer.id (${newPlayer.id}) does not match target id ${id}`, 'ID_MISMATCH', { target: id, provided: newPlayer.id });
        }
        const index = this.employees.findIndex(p => p.id === id);
        if (index !== -1) {
            this.employees[index] = newPlayer;
        }
        else {
            throw new error_1.CBLError(`Player with id ${id} not found.`, 'PLAYER_NOT_FOUND', { id });
        }
        return this;
    }
    // ---------- Manual team building ----------
    createTeam(name, playerIds) {
        const errors = [];
        const players = [];
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
        if (errors.length > 0) {
            throw new error_1.CBLError(`Cannot create team "${name}":\n  - ` + errors.join('\n  - '), 'TEAM_CREATION_FAILED', { errors });
        }
        const males = players.filter(p => p.gender === 'M');
        const females = players.filter(p => p.gender === 'F');
        if (males.length !== constants_1.MALES_PER_TEAM || females.length !== constants_1.FEMALES_PER_TEAM) {
            throw new error_1.CBLError(`Team ${name} must have exactly ${constants_1.MALES_PER_TEAM}M and ${constants_1.FEMALES_PER_TEAM}F. Provided: ${males.length}M, ${females.length}F`, 'INVALID_TEAM_COMPOSITION', { males: males.length, females: females.length });
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
            throw new error_1.CBLError(`Team with id ${teamId} not found`, 'TEAM_NOT_FOUND', { teamId });
        team.name = newName;
        return this;
    }
    replacePlayerInTeam(teamId, oldPlayerId, newPlayerId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team)
            throw new error_1.CBLError(`Team ${teamId} not found`, 'TEAM_NOT_FOUND', { teamId });
        const oldIndex = team.players.findIndex(p => p.id === oldPlayerId);
        if (oldIndex === -1)
            throw new error_1.CBLError(`Player ${oldPlayerId} not in team`, 'PLAYER_NOT_IN_TEAM', { oldPlayerId });
        const newPlayer = this.employees.find(e => e.id === newPlayerId);
        if (!newPlayer)
            throw new error_1.CBLError(`New player ${newPlayerId} not found`, 'PLAYER_NOT_FOUND', { newPlayerId });
        const alreadyInTeam = this.teams.some(t => t.id !== teamId && t.players.some(p => p.id === newPlayerId));
        if (alreadyInTeam)
            throw new error_1.CBLError(`Player ${newPlayer.id} :${newPlayer.name} is already in another team`, 'PLAYER_ALREADY_IN_TEAM', { playerId: newPlayerId, playerName: newPlayer.name });
        team.players[oldIndex] = newPlayer;
        team.males = team.players.filter(p => p.gender === 'M');
        team.females = team.players.filter(p => p.gender === 'F');
        if (team.males.length !== constants_1.MALES_PER_TEAM || team.females.length !== constants_1.FEMALES_PER_TEAM) {
            throw new error_1.CBLError(`After replacement, team ${team.name} has ${team.males.length}M, ${team.females.length}F – need exactly ${constants_1.MALES_PER_TEAM}M/${constants_1.FEMALES_PER_TEAM}F`, 'INVALID_TEAM_COMPOSITION', { males: team.males.length, females: team.females.length });
        }
        return this;
    }
    removePlayerFromTeam(teamId, playerId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team)
            throw new error_1.CBLError(`Team ${teamId} not found`, 'TEAM_NOT_FOUND', { teamId });
        const index = team.players.findIndex(p => p.id === playerId);
        if (index === -1)
            throw new error_1.CBLError(`Player ${playerId} not in team`, 'PLAYER_NOT_IN_TEAM', { playerId });
        team.players.splice(index, 1);
        team.males = team.players.filter(p => p.gender === 'M');
        team.females = team.players.filter(p => p.gender === 'F');
        if (team.males.length !== constants_1.MALES_PER_TEAM || team.females.length !== constants_1.FEMALES_PER_TEAM) {
            console.warn(`Team ${team.name} now has ${team.males.length}M, ${team.females.length}F – not a full team.`);
        }
        return this;
    }
    // ---------- Automatic team building ----------
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
    // ---------- Group creation ----------
    createGroups() {
        this.validateTeams();
        if (this.teams.length < constants_1.TEAMS_PER_GROUP) {
            throw new error_1.CBLError(`Not enough teams to form a single group. Need at least ${constants_1.TEAMS_PER_GROUP} teams, but only ${this.teams.length} available.`, error_1.ERROR.NOT_ENOUGH_TEAMS, { teamsFormed: this.teams.length, minRequired: constants_1.TEAMS_PER_GROUP });
        }
        const completeGroups = Math.floor(this.teams.length / constants_1.TEAMS_PER_GROUP);
        const usableTeams = shuffle(this.teams).slice(0, completeGroups * constants_1.TEAMS_PER_GROUP);
        this.groups = chunk(usableTeams, constants_1.TEAMS_PER_GROUP).map((groupTeams, i) => {
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
    generateRoundRobinFixtures(teams, groupName, startId) {
        const fixtures = [];
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
    createAllFixtures() {
        if (this.groups.length === 0) {
            throw new error_1.CBLError('No groups found. Call createGroups() first.', 'NO_GROUPS');
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
    createFixturesForGroup(groupId, append = false) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) {
            throw new error_1.CBLError(`Group with id ${groupId} not found.`, 'GROUP_NOT_FOUND', { groupId });
        }
        const newFixtures = this.generateRoundRobinFixtures(group.teams, group.name, this.fixtures.length + 1);
        if (append) {
            this.fixtures.push(...newFixtures);
        }
        else {
            this.fixtures = newFixtures;
        }
        return this;
    }
    generateGroupFixtures() {
        if (this.groups.length === 0) {
            throw new error_1.CBLError('No groups created. Call createGroups() first.', 'NO_GROUPS');
        }
        const fixtures = [];
        let fixtureId = 1;
        for (const group of this.groups) {
            const groupFixtures = this.generateRoundRobinFixtures(group.teams, group.name, fixtureId);
            fixtures.push(...groupFixtures);
            fixtureId += groupFixtures.length;
        }
        return fixtures;
    }
    // ---------- Match simulation & group stage ----------
    simulateMatch(home, away) {
        const simulateGame = () => {
            let home = 0, away = 0;
            while (home < 21 && away < 21) {
                if (Math.random() > 0.5)
                    home++;
                else
                    away++;
                if (home === 20 && away === 20) {
                    if (Math.random() > 0.5)
                        home = 21;
                    else
                        away = 21;
                    break;
                }
            }
            return { home, away };
        };
        const scores = {};
        let homeWins = 0, awayWins = 0;
        for (const cat of ["MS", "WS", "XD"]) {
            const s = simulateGame();
            const homeWon = s.home > s.away;
            if (homeWon)
                homeWins++;
            else
                awayWins++;
            scores[cat] = { ...s, winner: homeWon ? "home" : "away" };
        }
        return {
            scores,
            homeWins,
            awayWins,
            tieWinner: homeWins >= 2 ? "home" : "away",
        };
    }
    simulateGroupStage() {
        if (this.fixtures.length === 0) {
            throw new error_1.CBLError("No fixtures found. Call createAllFixtures() first.", "NO_FIXTURES");
        }
        const standingsMap = new Map();
        for (const group of this.groups) {
            for (const standing of group.standings) {
                standingsMap.set(standing.team.id, standing);
            }
        }
        for (const fixture of this.fixtures) {
            const result = this.simulateMatch(fixture.homeTeam, fixture.awayTeam);
            fixture.result = result;
            const homeStanding = standingsMap.get(fixture.homeTeam.id);
            const awayStanding = standingsMap.get(fixture.awayTeam.id);
            if (!homeStanding || !awayStanding) {
                throw new error_1.CBLError("Standing not found for a team", "INTERNAL_ERROR");
            }
            for (const cat of ["MS", "WS", "XD"]) {
                if (result.scores[cat].home > result.scores[cat].away) {
                    homeStanding.points++;
                }
                else {
                    awayStanding.points++;
                }
            }
            homeStanding.played++;
            awayStanding.played++;
            if (result.tieWinner === "home") {
                homeStanding.tiesWon++;
                homeStanding.wins++;
                awayStanding.losses++;
            }
            else {
                awayStanding.tiesWon++;
                awayStanding.wins++;
                homeStanding.losses++;
            }
        }
        for (const group of this.groups) {
            group.standings.sort((a, b) => {
                if (b.tiesWon !== a.tiesWon)
                    return b.tiesWon - a.tiesWon;
                return b.points - a.points;
            });
            group.qualifiedTeam = group.standings[0].team;
        }
        return this;
    }
    getQualifiedTeams() {
        return this.groups.map(g => g.qualifiedTeam).filter((t) => t !== undefined);
    }
    // ---------- Getters (return copies) ----------
    getTeams() {
        return [...this.teams];
    }
    getGroups() {
        return [...this.groups];
    }
    getFixtures() {
        return [...this.fixtures];
    }
    // ---------- Private validations ----------
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
    }
}
exports.CBL = CBL;
