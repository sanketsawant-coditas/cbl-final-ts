"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CBL_1 = require("./CBL");
const employees_1 = require("./employees");
const cbl = new CBL_1.CBL().loadEmployees(employees_1.employeesData);
// console.log("Employee list (id, name, gender):");
// cbl.getEmployees().forEach(emp => {
//   console.log(`  ${emp.id}: ${emp.name} (${emp.gender})`);
// });
cbl.createTeam("Alpha", [1, 2, 3, 4])
    .createTeam("Beta", [1, 2, 3, 4])
    .renameTeam(1, "Warriors")
    .replacePlayerInTeam(1, 4, 9)
    .createGroups();
