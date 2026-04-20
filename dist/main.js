"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CBL_1 = require("./CBL");
const employees_1 = require("./employees");
const jsonExporter_1 = require("./jsonExporter");
const cbl = new CBL_1.CBL()
    .loadEmployees(employees_1.employeesData)
    // .createTeam("Alpha", [1,2,3,4])
    // .createTeam("Beta", [5,6,7,8])
    // .createTeam("Beta", [9,10,11,12])
    // .createTeam("Beta", [13,14,15,16])  
    .buildTeams()
    .createGroups()
    .createAllFixtures();
(0, jsonExporter_1.exportToJSON)(cbl);
