/**
 * Code review findings — src/ (CBL tournament project)
 *
 * Usage: node mentor-review-findings.js
 * Mentor: share this file and ask the developer to address each item (fix or document why not).
 */

const SEVERITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

/**
 * @typedef {{ id: string, severity: string, files: string[], title: string, detail: string, hint?: string }} Finding
 */

/** @type {Finding[]} */
const FINDINGS = [
  {
    id: "CBL-001",
    severity: SEVERITY.HIGH,
    files: ["src/CBL.ts"],
    title: "Dead code: validateTeams() is never called",
    detail:
      "Private method validateTeams() enforces at least MIN_GROUPS * TEAMS_PER_GROUP teams but nothing invokes it. Manual createTeam + createGroups bypass this, so rules differ from the auto buildTeams() path.",
    hint: "Either call validateTeams() from createGroups() (or equivalent), or remove/refactor if intentional.",
  },
  {
    id: "CBL-002",
    severity: SEVERITY.MEDIUM,
    files: ["src/CBL.ts"],
    title: "Inconsistent error types (Error vs CBLError)",
    detail:
      "Some APIs throw plain Error; others throw CBLError with code and details. Callers cannot handle failures uniformly (e.g. instanceof CBLError).",
    hint: "Prefer CBLError (or a small hierarchy) for domain failures; reserve Error for truly unexpected cases.",
  },
  {
    id: "CBL-003",
    severity: SEVERITY.MEDIUM,
    files: ["src/CBL.ts"],
    title: "Getters expose mutable internal arrays",
    detail:
      "getEmployees(), getTeams(), getGroups(), getFixtures() return references to internal state. External code can mutate CBL internals without using the class API.",
    hint: "Return shallow copies, freeze in dev, or document that these are live mutable views.",
  },
  {
    id: "CBL-004",
    severity: SEVERITY.MEDIUM,
    files: ["src/CBL.ts"],
    title: "addPlayer does not prevent duplicate player ids",
    detail:
      "Two employees with the same id can be pushed; downstream find() and team logic become ambiguous.",
    hint: "Reject or merge when id already exists.",
  },
  {
    id: "CBL-005",
    severity: SEVERITY.LOW,
    files: ["src/CBL.ts"],
    title: "replacePlayerById does not enforce newPlayer.id === id",
    detail:
      "The roster can store a player object whose id field does not match the row key expectation.",
    hint: "Validate that newPlayer.id matches the id parameter, or document that id must match.",
  },
  {
    id: "CBL-006",
    severity: SEVERITY.MEDIUM,
    files: ["src/CBL.ts"],
    title: "createFixturesForGroup replaces all fixtures, not append",
    detail:
      "It sets this.fixtures = [] and only adds fixtures for one group. Easy to misuse if callers expect cumulative fixtures.",
    hint: "Rename or add JSDoc; consider append vs replace as two methods.",
  },
  {
    id: "CBL-007",
    severity: SEVERITY.LOW,
    files: ["src/CBL.ts"],
    title: "Duplicated round-robin logic",
    detail:
      "createAllFixtures(), createFixturesForGroup(), and generateGroupFixtures() repeat the same nested loops.",
    hint: "Extract one private helper that builds fixture objects; reuse for store vs return.",
  },
  {
    id: "CBL-008",
    severity: SEVERITY.LOW,
    files: ["src/CBL.ts"],
    title: "Group names only support A–Z (26 groups)",
    detail:
      "Group name uses String.fromCharCode(65 + i). More than 26 groups would produce wrong labels.",
    hint: "Guard or use Group 1, Group 2, … for i >= 26.",
  },
  {
    id: "TYPES-001",
    severity: SEVERITY.LOW,
    files: ["src/types.ts"],
    title: "Loose typing: any for standings and fixture result",
    detail:
      "standings?: any[] and result: any reduce TypeScript value.",
    hint: "Introduce narrow interfaces or unknown + narrowing.",
  },
  {
    id: "ERR-001",
    severity: SEVERITY.LOW,
    files: ["src/error.ts"],
    title: "ERROR.ODD_QUALIFIERS defined but unused",
    detail: "Dead constant in ERROR map unless reserved for future knockout logic.",
    hint: "Use it or remove from public ERROR export.",
  },
  {
    id: "EMP-001",
    severity: SEVERITY.LOW,
    files: ["src/employees.ts"],
    title: "Non-deterministic employee data",
    detail:
      "Random names and phone digits on each run make reproduction and tests flaky.",
    hint: "Seed RNG, or use fixed fixture data for tests.",
  },
  {
    id: "EXPORT-001",
    severity: SEVERITY.LOW,
    files: ["src/jsonExporter.ts", "src/main.ts"],
    title: "Duplicate output directory creation",
    detail:
      "ensureOutputDir (jsonExporter) and ensureCblOutput (main) overlap; minor duplication.",
    hint: "Single shared helper module.",
  },
  {
    id: "MAIN-001",
    severity: SEVERITY.LOW,
    files: ["src/main.ts"],
    title: "Smoke test assumptions (e.g. id 33 gender) tied to employees.ts",
    detail:
      "Comments assume alternating gender by index; breaks if employeesData generation changes.",
    hint: "Derive bench player from schema or add a tiny assertion.",
  },
];

function printFindings() {
  const bySev = { [SEVERITY.HIGH]: [], [SEVERITY.MEDIUM]: [], [SEVERITY.LOW]: [] };
  for (const f of FINDINGS) {
    bySev[f.severity].push(f);
  }
  console.log("CBL code review — findings for developer\n");
  for (const sev of [SEVERITY.HIGH, SEVERITY.MEDIUM, SEVERITY.LOW]) {
    const list = bySev[sev];
    if (list.length === 0) continue;
    console.log(`--- ${sev.toUpperCase()} (${list.length}) ---\n`);
    for (const f of list) {
      console.log(`${f.id}  ${f.title}`);
      console.log(`  Files: ${f.files.join(", ")}`);
      console.log(`  ${f.detail.replace(/\n/g, "\n  ")}`);
      if (f.hint) console.log(`  Suggestion: ${f.hint}`);
      console.log("");
    }
  }
  console.log(`Total: ${FINDINGS.length} items`);
}

if (require.main === module) {
  printFindings();
}

module.exports = { FINDINGS, SEVERITY, printFindings };
