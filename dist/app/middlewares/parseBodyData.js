"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBodyData = void 0;
const parseBodyData = (req, res, next) => {
    if (req.body.bodyData) {
        // console.log(req.body.bodyData);
        try {
            req.body = JSON.parse(req.body.bodyData);
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid JSON format in bodyData",
            });
        }
    }
    next();
};
exports.parseBodyData = parseBodyData;
