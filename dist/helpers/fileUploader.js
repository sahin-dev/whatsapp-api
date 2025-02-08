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
exports.fileUploader = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(process.cwd(), "uploads"));
    },
    filename: function (req, file, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            cb(null, file.originalname);
        });
    },
});
const upload = (0, multer_1.default)({ storage: storage });
// upload single image
const uploadprofileImage = upload.single("profileImage");
const uploadGroupImage = upload.single("groupImage");
const uploadChanelImage = upload.single("chanelImage");
// upload multiple images for portifilo
const sendFiles = upload.fields([
    // { name: "companyLogo", maxCount: 1 }, // Single file for company logo
    { name: "sendFiles", maxCount: 10 }, // Multiple files for company images
    { name: "messageFiles", maxCount: 10 },
]);
exports.fileUploader = {
    upload,
    uploadprofileImage,
    uploadGroupImage,
    uploadChanelImage,
    sendFiles,
};
