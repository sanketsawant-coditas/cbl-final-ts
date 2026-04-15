"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR = exports.CBLError = void 0;
class CBLError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = "CBLError";
        this.code = code;
        this.details = details;
    }
}
exports.CBLError = CBLError;
exports.ERROR = {
    NO_EMPLOYEES: "NO_EMPLOYEES",
    NOT_ENOUGH_PLAYERS: "NOT_ENOUGH_PLAYERS",
    GENDER_IMBALANCE: "GENDER_IMBALANCE",
    NOT_ENOUGH_GROUPS: "NOT_ENOUGH_GROUPS",
    NOT_ENOUGH_TEAMS: "NOT_ENOUGH_TEAMS",
    ODD_QUALIFIERS: "ODD_QUALIFIERS",
};
