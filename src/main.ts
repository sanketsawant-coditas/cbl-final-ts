import { log } from 'console';
import { CBL } from './CBL';
import { employeesData } from './employees';
import { exportToJSON } from './jsonExporter';

// ------------------ EMPLOYEE DATA ----------------------
// console.log("Employee list (id, name, gender):");
// cbl.getEmployees().forEach(emp => {
//   console.log(`  ${emp.id}: ${emp.name} (${emp.gender})`);
// });


// const cbl = new CBL().loadEmployees(employeesData);

// cbl.createTeam("Alpha", [1, 2, 3, 4])
//    .createTeam("Beta", [5, 6, 7, 8])
//    .renameTeam(1, "Warriors")
// //    .replacePlayerInTeam(1, 2, 9)
//    .createGroups();

// exportToJSON(cbl.createGroups())


//--------------------- AUTO FLL DATA ---------------------
// const cbl = new CBL()
//   .loadEmployees(employeesData)
//   .buildTeams()
//   .createGroups();


// exportToJSON(cbl)



// ----------------------- 2 group data------------

const cbl = new CBL().loadEmployees(employeesData);

cbl.createTeam("Alpha", [1, 2, 3, 4])        
   .createTeam("Beta",  [5, 6, 7, 8])         
   .createTeam("Gamma", [9,10,11,12])          
   .createTeam("Delta", [13,14,15,16])        
        
    
    
   .renameTeam(1, "Warriors")
   .replacePlayerInTeam(1,2,24)                


   .createGroups();  
exportToJSON(cbl) 





   

   

