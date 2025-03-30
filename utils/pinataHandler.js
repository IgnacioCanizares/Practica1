const multer = require("multer");

const memory = multer.memoryStorage();
const uploadMiddlewareMemory = multer({ storage: memory });
module.exports = {uploadMiddlewareMemory, uploadMiddleware};