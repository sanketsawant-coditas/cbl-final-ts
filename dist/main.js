"use strict";
// import { CBL } from './CBL';
// import { employeesData } from './employees';
// import { exportToJSON } from './jsonExporter';
Object.defineProperty(exports, "__esModule", { value: true });
// console.log("Employee list (id, name, gender):");
// cbl.getEmployees().forEach(emp => {
//   console.log(`  ${emp.id}: ${emp.name} (${emp.gender})`);
// });
// const cbl = new CBL().loadEmployees(employeesData);
// cbl.createTeam("Alpha", [1, 2, 3, 4])
//    .createTeam("Beta", [5, 6, 7, 8])
//    .renameTeam(1, "Warriors")
//    .replacePlayerInTeam(2, 2, 9)
//    .createGroups();
// exportToJSON(cbl)
// const cbl = new CBL()
//   .loadEmployees(employeesData)
//   .buildTeams()
//   .createGroups();
// exportToJSON(cbl)
// src/main.ts
const CBL_1 = require("./CBL");
const employees_1 = require("./employees");
const jsonExporter_1 = require("./jsonExporter");
// Assuming employeesData has 32 players with IDs 1..32, alternating M/F
const cbl = new CBL_1.CBL().loadEmployees(employees_1.employeesData);
cbl.createTeam("Alpha", [1, 2, 3, 4]) // IDs 1(M),2(F),3(M),4(F) → 2M+2F ✅
    .createTeam("Beta", [5, 6, 7, 8]) // 5(M),6(F),7(M),8(F) ✅
    .createTeam("Gamma", [9, 10, 11, 12]) // 9(M),10(F),11(M),12(F) ✅
    .createTeam("Delta", [13, 14, 15, 16]) // 13(M),14(F),15(M),16(F) ✅
    .createTeam("Epsilon", [17, 18, 19, 20]) // 17(M),18(F),19(M),20(F) ✅
    .createTeam("Zeta", [21, 22, 23, 24]) // 21(M),22(F),23(M),24(F) ✅
    .createTeam("Eta", [25, 26, 27, 28]) // 25(M),26(F),27(M),28(F) ✅
    .createTeam("Theta", [29, 30, 31, 32]) // 29(M),30(F),31(M),32(F) ✅
    .renameTeam(1, "Warriors") // Rename team id 1 (Alpha → Warriors)
    // Replace in team id 2 (Beta): replace player id 5 (first player) with player id 9
    // Note: player 9 is in Gamma team, so this will THROW an error because player 9 is already used.
    // If you want a valid replacement, use an unused player id (e.g., 33 after adding).
    // We keep the original example to show error behaviour.
    .replacePlayerInTeam(2, 5, 9) // ❌ Throws: Player 9 already in another team
    .createGroups(); // Won't be reached if error occurs
(0, jsonExporter_1.exportToJSON)(cbl);
