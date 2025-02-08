"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageSearch = void 0;
const messageSearch = (search) => {
    if (!search) {
        return undefined;
    }
    const searchConditions = [];
    if (search) {
        searchConditions.push({
            message: { contains: search, mode: "insensitive" },
        });
    }
    return {
        OR: searchConditions,
    };
};
exports.messageSearch = messageSearch;
