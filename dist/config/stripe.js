"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../config"));
const stripe = new stripe_1.default(config_1.default.stripe.stripe_secret_key, {
    apiVersion: "2024-11-20.acacia",
});
exports.default = stripe;
