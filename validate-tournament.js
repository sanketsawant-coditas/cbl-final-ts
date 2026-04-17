const fs = require('fs');

function validateTeam(team, idx, context) {
  const errors = [];
  const idxStr = (idx !== null && idx !== undefined) ? `[${idx}]` : '';
  const fullContext = context + idxStr;

  if (typeof team.id !== 'number') errors.push(`${fullContext}.id must be a number`);
  if (typeof team.name !== 'string') errors.push(`${fullContext}.name must be a string`);
  if (!Array.isArray(team.players)) {
    errors.push(`${fullContext}.players must be an array`);
  } else {
    if (team.players.length !== 4) {
      errors.push(`${fullContext}.players must have exactly 4 players (found ${team.players.length})`);
    }
    let maleCount = 0, femaleCount = 0;
    team.players.forEach((p, pi) => {
      if (typeof p.id !== 'number') errors.push(`${fullContext}.players[${pi}].id must be a number`);
      if (typeof p.name !== 'string') errors.push(`${fullContext}.players[${pi}].name must be a string`);
      if (p.gender !== 'M' && p.gender !== 'F') {
        errors.push(`${fullContext}.players[${pi}].gender must be 'M' or 'F'`);
      }
      if (p.gender === 'M') maleCount++;
      if (p.gender === 'F') femaleCount++;
    });
    if (maleCount !== 2) errors.push(`${fullContext}.players must have exactly 2 males (found ${maleCount})`);
    if (femaleCount !== 2) errors.push(`${fullContext}.players must have exactly 2 females (found ${femaleCount})`);
  }

//   // Ensure males/females arrays are NOT present
//   if (team.hasOwnProperty('males')) errors.push(`${fullContext} must NOT have 'males' property`);
//   if (team.hasOwnProperty('females')) errors.push(`${fullContext} must NOT have 'females' property`);

  return errors;
}


function validateTournament(data) {
  const errors = [];

  // --- Top-level required properties ---
  const requiredTop = ['teams', 'groups', 'fixtures', 'timestamp', 'stats'];
  for (const prop of requiredTop) {
    if (!data.hasOwnProperty(prop)) errors.push(`Missing top-level property: ${prop}`);
  }
  if (typeof data.timestamp !== 'string') errors.push('timestamp must be a string');
  if (typeof data.stats !== 'object') errors.push('stats must be an object');

  // --- Teams array ---
  if (!Array.isArray(data.teams)) {
    errors.push('teams must be an array');
  } else {
    data.teams.forEach((team, i) => {
      errors.push(...validateTeam(team, i, 'teams'));
    });
  }

  // --- Groups array ---
  if (!Array.isArray(data.groups)) {
    errors.push('groups must be an array');
  } else {
    data.groups.forEach((group, gidx) => {
      const ctx = `groups[${gidx}]`;
      if (typeof group.id !== 'number') errors.push(`${ctx}.id must be a number`);
      if (typeof group.name !== 'string') errors.push(`${ctx}.name must be a string`);
      if (!Array.isArray(group.teams)) {
        errors.push(`${ctx}.teams must be an array`);
      } else {
        group.teams.forEach((team, tidx) => {
          errors.push(...validateTeam(team, tidx, `${ctx}.teams`));
        });
      }
      if (!Array.isArray(group.standings)) {
        errors.push(`${ctx}.standings must be an array`);
      } else {
        group.standings.forEach((standing, sidx) => {
          const sctx = `${ctx}.standings[${sidx}]`;
          if (!standing.team || typeof standing.team !== 'object') {
            errors.push(`${sctx}.team missing or not an object`);
          } else {
            // team is an object, not an array element – pass null index
            errors.push(...validateTeam(standing.team, null, `${sctx}.team`));
          }
          ['played', 'wins', 'losses', 'points', 'tiesWon'].forEach(stat => {
            if (typeof standing[stat] !== 'number') {
              errors.push(`${sctx}.${stat} must be a number (got ${standing[stat]})`);
            }
          });
        });
      }
    });
  }

  // --- Fixtures array ---
  if (!Array.isArray(data.fixtures)) {
    errors.push('fixtures must be an array');
  } else {
    data.fixtures.forEach((fx, fix) => {
      const ctx = `fixtures[${fix}]`;
      if (typeof fx.id !== 'number') errors.push(`${ctx}.id must be a number`);
      if (fx.stage !== 'group' && fx.stage !== 'knockout') {
        errors.push(`${ctx}.stage must be 'group' or 'knockout' (got '${fx.stage}')`);
      }
      if (fx.stage === 'group' && typeof fx.groupName !== 'string') {
        errors.push(`${ctx}.groupName must be a string for group stage`);
      }
      if (!fx.homeTeam || typeof fx.homeTeam !== 'object') {
        errors.push(`${ctx}.homeTeam missing or not an object`);
      } else {
        errors.push(...validateTeam(fx.homeTeam, null, `${ctx}.homeTeam`));
      }
      if (!fx.awayTeam || typeof fx.awayTeam !== 'object') {
        errors.push(`${ctx}.awayTeam missing or not an object`);
      } else {
        errors.push(...validateTeam(fx.awayTeam, null, `${ctx}.awayTeam`));
      }
      if (fx.result !== null && typeof fx.result !== 'object') {
        errors.push(`${ctx}.result must be null or an object`);
      }
    });
  }

  // --- Stats validation (consistency) ---
  if (data.stats && Array.isArray(data.teams) && Array.isArray(data.groups) && Array.isArray(data.fixtures)) {
    const expected = {
      totalTeams: data.teams.length,
      totalGroups: data.groups.length,
      totalPlayers: data.teams.reduce((sum, t) => sum + (t.players ? t.players.length : 0), 0),
      totalFixtures: data.fixtures.length
    };
    for (const [key, val] of Object.entries(expected)) {
      if (data.stats[key] !== val) {
        errors.push(`stats.${key} expected ${val}, got ${data.stats[key]}`);
      }
    }
  }

  return errors;
}

// --- Command line execution ---
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node validate-tournament.js <path-to-json-file>');
  process.exit(1);
}

try {
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const errors = validateTournament(jsonData);
  if (errors.length === 0) {
    console.log('✅ JSON is valid – tournament data structure is correct.');
  } else {
    console.error('❌ Validation errors found:');
    errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }
} catch (err) {
  console.error('Failed to read or parse JSON:', err.message);
  process.exit(1);
}