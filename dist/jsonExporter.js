"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportToJSON = exportToJSON;
// src/jsonExporter.ts
const fs = require("fs");
const path = require("path");
const fileUtils_1 = require("./fileUtils");
const OUTPUT_DIR = path.join((0, fileUtils_1.getProjectRoot)(), 'cbl-output');
function generateFileName() {
    const files = fs.readdirSync(OUTPUT_DIR);
    const pattern = /^(\d+)-cbl-.*\.json$/;
    let maxNum = 0;
    for (const file of files) {
        const match = file.match(pattern);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum)
                maxNum = num;
        }
    }
    const nextNum = (maxNum + 1).toString().padStart(2, '0');
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${nextNum}-cbl-${hours}.${minutes}.json`;
}
function exportToJSON(cbl) {
    (0, fileUtils_1.ensureDirectory)(OUTPUT_DIR);
    const fileName = generateFileName();
    const fullPath = path.join(OUTPUT_DIR, fileName);
    const cleanTeams = cbl.getTeams().map(team => {
        const { males, females, ...rest } = team;
        return rest;
    });
    const cleanGroups = cbl.getGroups().map(group => ({
        ...group,
        teams: group.teams.map(team => {
            const { males, females, ...rest } = team;
            return rest;
        }),
    }));
    const cleanFixtures = cbl.getFixtures().map(fx => ({
        ...fx,
        homeTeam: (() => {
            const { males, females, ...rest } = fx.homeTeam;
            return rest;
        })(),
        awayTeam: (() => {
            const { males, females, ...rest } = fx.awayTeam;
            return rest;
        })(),
    }));
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
