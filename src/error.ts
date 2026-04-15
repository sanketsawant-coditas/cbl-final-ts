export class CBLError extends Error {
  code: string;
  details: Record<string, any>;
  constructor(message: string, code: string, details: Record<string, any> = {}) {
    super(message);
    this.name = "CBLError";
    this.code = code;
    this.details = details;
  }
}

export const ERROR = {
  NO_EMPLOYEES      : "NO_EMPLOYEES",
  NOT_ENOUGH_PLAYERS: "NOT_ENOUGH_PLAYERS",
  GENDER_IMBALANCE  : "GENDER_IMBALANCE",
  NOT_ENOUGH_GROUPS : "NOT_ENOUGH_GROUPS",
  NOT_ENOUGH_TEAMS  : "NOT_ENOUGH_TEAMS",
  ODD_QUALIFIERS    : "ODD_QUALIFIERS",
};