"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFilter = void 0;
const searchFilter = (search) => {
    if (!search) {
        return undefined;
    }
    const searchConditions = [];
    if (search) {
        searchConditions.push({ username: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } });
    }
    return {
        OR: searchConditions,
    };
};
exports.searchFilter = searchFilter;
