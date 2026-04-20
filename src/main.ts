// src/main.ts
import { CBL } from './CBL';
import { employeesData } from './employees';
import { exportToJSON } from './jsonExporter';

const cbl = new CBL().loadEmployees(employeesData);

cbl.createTeam("Tigers",   [1, 2, 3, 4])
   .createTeam("Lions",    [5, 6, 7, 8])
   .createTeam("Eagles",   [9, 10, 11, 12])
   .createTeam("Sharks",   [13, 14, 15, 16])
   .createTeam("Wolves",   [17, 18, 19, 20])
   .createTeam("Bears",    [21, 22, 23, 24])
   .createTeam("Hawks",    [25, 26, 27, 28])
   .createTeam("Panthers", [29, 30, 31, 32]);

cbl.createGroups();

cbl.createAllFixtures();

cbl.addManualResult(1,  [21, 18, 19], [18, 21, 21])   
   .addManualResult(2,  [21, 21, 20], [15, 19, 22])   
   .addManualResult(3,  [19, 21, 21], [21, 18, 19])  
   .addManualResult(4,  [21, 21, 18], [17, 19, 21])   
   .addManualResult(5,  [21, 20, 21], [18, 22, 19])   
   .addManualResult(6,  [21, 21, 21], [19, 19, 19])   

   //B 6 match 


   .addManualResult(7,  [21, 19, 21], [18, 21, 19]) 
   .addManualResult(8,  [21, 21, 18], [17, 19, 21])   
   .addManualResult(9,  [19, 21, 21], [21, 18, 19])   
   .addManualResult(10, [21, 21, 20], [15, 19, 22])   
   .addManualResult(11, [21, 20, 21], [18, 22, 19])   
   .addManualResult(12, [21, 21, 21], [19, 19, 19]);  

cbl.finalizeGroupStage();

exportToJSON(cbl);

console.log("\n=== Tournament Results ===");
console.log(`Teams: ${cbl.getTeams().length}`);
console.log(`Groups: ${cbl.getGroups().length}`);
console.log(`Fixtures: ${cbl.getFixtures().length}`);
cbl.getGroups().forEach(group => {
  console.log(`\n${group.name} – Qualified: ${group.qualifiedTeam?.name}`);
  group.standings.forEach(s => {
    console.log(`  ${s.team.name}: ${s.wins} wins, ${s.losses} losses, ${s.points} pts`);
  });
});