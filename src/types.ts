export interface Player {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: "M" | "F";
}

export interface Team {
  id: number;
  name: string;
  players: Player[];
  males: Player[];
  females: Player[];
}

export interface Group {
  id: number;
  name: string;
  teams: Team[];
  standings?: any[];
  qualifiedTeam?: Team;
}


// src/types.ts
export interface Fixture {
  id: number;
  stage: 'group' | 'knockout';
  groupName?: string;
  homeTeam: Team;
  awayTeam: Team;
  result: any; 
}