import { CBL } from './CBL';
import { employeesData } from './employees';
import { exportToJSON } from './jsonExporter';

const cbl = new CBL().loadEmployees(employeesData);

cbl.createTeam("Tigers", [1, 2, 3, 4])
   .createTeam("Lions", [5, 6, 7, 8])
   .createTeam("Eagles", [9, 10, 11, 12])
   .createTeam("Sharks", [13, 14, 15, 16])
   .createTeam("Wolves", [17, 18, 19, 20])
   .createTeam("Bears", [21, 22, 23, 24])
   .createTeam("Hawks", [25, 26, 27, 28])
   .createTeam("Panthers", [29, 30, 31, 32]);

cbl.createGroups();
cbl.createAllFixtures();

cbl.addManualResult({ fixtureId: 1, scores: { MS: {3:21,8:18}, WS: {8:18,3:21}, XD: {8:19,3:21} } })


   .addManualResult({ 
    fixtureId: 2, 
    scores: 
    { MS: {3:21,8:15}, 
      WS: {8:21,5:19}, 
      XD: {8:20,5:22} 
    }})


   .addManualResult({ fixtureId: 3, scores: { MS: {3:21,5:18}, WS: {3:18,5:21}, XD: {3:21,5:19} } })
   .addManualResult({ fixtureId: 4, scores: { MS: {8:21,2:17}, WS: {8:21,2:19}, XD: {8:18,2:21} } })
   .addManualResult({ fixtureId: 5, scores: { MS: {3:21,2:19}, WS: {3:20,2:22}, XD: {3:21,2:18} } })
   .addManualResult({ fixtureId: 6, scores: { MS: {5:21,2:18}, WS: {5:19,2:21}, XD: {5:21,2:20} } })
   .addManualResult({ fixtureId: 7, scores: { MS: {1:21,6:18}, WS: {1:18,6:21}, XD: {1:21,6:19} } })
   .addManualResult({ fixtureId: 8, scores: { MS: {1:21,4:15}, WS: {1:21,4:19}, XD: {1:20,4:22} } })
   .addManualResult({ fixtureId: 9, scores: { MS: {6:21,4:18}, WS: {6:18,4:21}, XD: {6:21,4:19} } })
   .addManualResult({ fixtureId: 10, scores: { MS: {1:21,7:17}, WS: {1:21,7:19}, XD: {1:18,7:21} } })
   .addManualResult({ fixtureId: 11, scores: { MS: {6:21,7:19}, WS: {6:20,7:22}, XD: {6:21,7:18} } })
   .addManualResult({ fixtureId: 12, scores: { MS: {4:21,7:18}, WS: {4:19,7:21}, XD: {4:21,7:20} } });

cbl.finalizeGroupStage();
exportToJSON(cbl);
