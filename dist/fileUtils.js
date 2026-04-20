"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDirectory = ensureDirectory;
exports.getProjectRoot = getProjectRoot;
const fs = require("fs");
function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
function getProjectRoot() {
    return process.cwd();
}
