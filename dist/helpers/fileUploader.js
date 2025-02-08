"use strict";
// import multer from "multer";
// import path from "path";
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(process.cwd(), "uploads"));
//   },
//   filename: async function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploader = void 0;
// const upload = multer({ storage: storage });
// // upload single image
// const uploadprofileImage = upload.single("profileImage");
// const updateProfileImage = upload.single("avatar");
// const uploadGroupImage = upload.single("groupImage");
// const uploadChanelImage = upload.single("chanelImage");
// // upload multiple images for portifilo
// const sendFiles = upload.fields([
//   // { name: "companyLogo", maxCount: 1 }, // Single file for company logo
//   { name: "sendFiles", maxCount: 10 }, // Multiple files for company images
//   { name: "messageFiles", maxCount: 10 },
// ]);
// export const fileUploader = {
//   upload,
//   uploadprofileImage,
//   uploadGroupImage,
//   uploadChanelImage,
//   sendFiles,
//   updateProfileImage,
// };
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(process.cwd(), "uploads")); // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        // Add a timestamp to the original filename
        const timestamp = Date.now(); // Get the current timestamp
        const ext = path_1.default.extname(file.originalname); // Extract the file extension
        const baseName = path_1.default.basename(file.originalname, ext); // Extract the base name (without extension)
        const newFilename = `${timestamp}-${baseName}${ext}`; // Combine timestamp and original file name
        cb(null, newFilename); // Pass the modified filename to multer
    },
});
const upload = (0, multer_1.default)({ storage: storage });
// Upload single images
const uploadprofileImage = upload.single("profileImage");
const updateProfileImage = upload.single("avatar");
const uploadGroupImage = upload.single("groupImage");
const uploadChanelImage = upload.single("chanelImage");
// Upload multiple images for portfolio
const sendFiles = upload.fields([
    { name: "sendFiles", maxCount: 10 }, // Multiple files for portfolio images
    { name: "messageFiles", maxCount: 10 }, // Multiple files for message attachments
]);
exports.fileUploader = {
    upload,
    uploadprofileImage,
    uploadGroupImage,
    uploadChanelImage,
    sendFiles,
    updateProfileImage,
};
