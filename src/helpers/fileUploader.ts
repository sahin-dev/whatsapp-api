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

import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads")); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    // Add a timestamp to the original filename
    const timestamp = Date.now(); // Get the current timestamp
    const ext = path.extname(file.originalname); // Extract the file extension
    const baseName = path.basename(file.originalname, ext); // Extract the base name (without extension)

    const newFilename = `${timestamp}${ext}`; // Combine timestamp and original file name
    cb(null, newFilename); // Pass the modified filename to multer
  },
});

const upload = multer({ storage: storage });

// Upload single images
const uploadprofileImage = upload.single("profileImage");
const updateProfileImage = upload.single("avatar");
const uploadGroupImage = upload.single("groupImage");
const uploadChanelImage = upload.single("channelImage");

// Upload multiple images for portfolio
const sendFiles = upload.fields([
  { name: "sendFiles", maxCount: 10 }, // Multiple files for portfolio images
  { name: "messageFiles", maxCount: 10 }, // Multiple files for message attachments
]);

export const fileUploader = {
  upload,
  uploadprofileImage,
  uploadGroupImage,
  uploadChanelImage,
  sendFiles,
  updateProfileImage,
};
