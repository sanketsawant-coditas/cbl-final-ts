import { CBL } from './CBL';
import { employeesData } from './employees';
import { exportToJSON } from './jsonExporter';

const cbl = new CBL()
  .loadEmployees(employeesData) 
  // .createTeam("Alpha", [1,2,3,4])
  // .createTeam("Beta", [5,6,7,8])
  // .createTeam("Beta", [9,10,11,12])
  // .createTeam("Beta", [13,14,15,16])  

  .buildTeams()                   
  .createGroups()
  .createAllFixtures();

  exportToJSON(cbl)
 