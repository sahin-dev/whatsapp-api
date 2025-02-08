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
exports.homeContentController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const home_service_1 = require("./home.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const createHomeContent = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield home_service_1.homeContentServices.createHomeContentInDB(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: "Home content created successfully",
        data: result,
    });
}));
const getHomeContent = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const contentId = req.params.id;
    const homeContent = yield home_service_1.homeContentServices.getHomeContentFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Home content retrived successfully",
        data: homeContent,
    });
}));
exports.homeContentController = {
    createHomeContent,
    getHomeContent,
};
