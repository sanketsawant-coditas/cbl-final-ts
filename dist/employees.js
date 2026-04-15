"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeesData = void 0;
const constants_1 = require("./constants");
const firstNames = ["Aarav", "Isha", "Rohan", "Neha", "Aditya", "Priya", "Karan", "Sneha", "Vikram", "Pooja"];
const lastNames = ["Sharma", "Patel", "Mehta", "Kulkarni", "Verma", "Nair", "Singh", "Joshi", "Desai", "Shah"];
exports.employeesData = Array.from({ length: constants_1.EMPLOYEE_SIZE }, (_, i) => {
    const id = i + 1;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return {
        id,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${id}@coditas.com`,
        phone: "9" + Math.floor(100000000 + Math.random() * 900000000),
        gender: i % 2 === 0 ? "M" : "F",
    };
});
