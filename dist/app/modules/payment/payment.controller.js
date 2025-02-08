"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const payment_service_1 = require("./payment.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const stripePortalSession = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const customerId = req.body.customerId;
    const result = yield payment_service_1.paymentSevices.stripePortalSessionInStripe(customerId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "return url successfully",
        data: result,
    });
}));
const createSubcription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield payment_service_1.paymentSevices.createSubcriptionInStripe(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Payment successfull",
        data: result,
    });
}));
const cancelSubcription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subscriptionId = req.body.subscriptionId;
    yield payment_service_1.paymentSevices.cancelSubscriptionInStripe(subscriptionId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "cancel subscription successfully",
    });
}));
const handelPaymentWebhook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield payment_service_1.paymentSevices.handelPaymentWebhook(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "done",
        data: result,
    });
}));
const handleSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userEmail } = req.body;
    const result = yield payment_service_1.paymentSevices.handleSubscriptionInAuth(userEmail);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "done",
        data: result,
    });
}));
exports.paymentControllers = {
    stripePortalSession,
    createSubcription,
    handelPaymentWebhook,
    cancelSubcription,
    handleSubscription,
};
