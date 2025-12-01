const express = require('express');
const complaintSchema  = require('../validations/zod');
const validateWithZod = require('../middleware/middlewares');
const {submitForm} = require('../controllers/controllers');
const upload = require('../config/multer');
const userRouter = express.Router();


userRouter.post("/submit", upload.single("image"), submitForm);
module.exports = userRouter;






