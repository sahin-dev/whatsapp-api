"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoute = void 0;
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("./payment.controller");
const router = express_1.default.Router();
router.post("/create-portal-session", payment_controller_1.paymentControllers.stripePortalSession);
router.post("/create-subscription", payment_controller_1.paymentControllers.createSubcription);
router.post("/cancel-subscription", payment_controller_1.paymentControllers.cancelSubcription);
exports.paymentRoute = router;
