import { CBL } from './CBL';
import { employeesData } from './employees';
import { exportToJSON } from './jsonExporter';

const cbl = new CBL().loadEmployees(employeesData);

// console.log("Employee list (id, name, gender):");
// cbl.getEmployees().forEach(emp => {
//   console.log(`  ${emp.id}: ${emp.name} (${emp.gender})`);
// });

cbl.createTeam("Alpha", [1, 2, 3, 4])
   .createTeam("Beta", [1, 2, 3, 4])
   .renameTeam(1, "Warriors")
   .replacePlayerInTeam(1, 4, 9)
   .createGroups();

