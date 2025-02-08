"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockPostmanRequests = void 0;
const blockPostmanRequests = (req, res, next) => {
    const userAgent = req.headers["user-agent"];
    if (userAgent && userAgent.includes("PostmanRuntime")) {
        return res
            .status(403)
            .json({ message: "Forbidden: Postman requests are not allowed" });
    }
    next();
};
exports.blockPostmanRequests = blockPostmanRequests;
