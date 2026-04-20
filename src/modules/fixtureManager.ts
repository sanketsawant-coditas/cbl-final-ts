import { Team, Group, Fixture } from '../types';

function generateRoundRobinFixtures(teams: Team[], groupName: string, startId: number): Fixture[] {
  const fixtures: Fixture[] = [];
  let fid = startId;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        id: fid++,
        stage: 'group',
        groupName,
        homeTeam: teams[i],
        awayTeam: teams[j],
        result: null,
      });
    }
  }
  return fixtures;
}

export function createAllFixtures(groups: Group[]): Fixture[] {
  if (groups.length === 0) {
    throw new Error('No groups found. Call createGroups() first.');
  }
  const allFixtures: Fixture[] = [];
  let nextId = 1;
  for (const group of groups) {
    const groupFixtures = generateRoundRobinFixtures(group.teams, group.name, nextId);
    allFixtures.push(...groupFixtures);
    nextId += groupFixtures.length;
  }
  return allFixtures;
}

export function createFixturesForGroup(
  groups: Group[],
  existingFixtures: Fixture[],
  groupId: number,
  append: boolean = false
): Fixture[] {
  const group = groups.find(g => g.id === groupId);
  if (!group) throw new Error(`Group with id ${groupId} not found.`);
  const newFixtures = generateRoundRobinFixtures(group.teams, group.name, existingFixtures.length + 1);
  if (append) {
    return [...existingFixtures, ...newFixtures];
  } else {
    return newFixtures;
  }
}

export function generateGroupFixtures(groups: Group[]): Fixture[] {
  if (groups.length === 0) {
    throw new Error('No groups created. Call createGroups() first.');
  }
  const fixtures: Fixture[] = [];
  let fixtureId = 1;
  for (const group of groups) {
    const groupFixtures = generateRoundRobinFixtures(group.teams, group.name, fixtureId);
    fixtures.push(...groupFixtures);
    fixtureId += groupFixtures.length;
  }
  return fixtures;
}