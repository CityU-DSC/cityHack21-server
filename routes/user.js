const userRouter = require("express").Router();
const auth = require("../config/auth");
const userController = require("../controller/userController");
const { requestHandler } = require("../util/routeUtil");


//Api
userRouter.post("/register", userController.registerNewUser);
userRouter.post("/login", userController.loginUser);
userRouter.get("/me", auth(), userController.getUserDetails);
userRouter.put("/me", auth(), userController.updateUserDetails);

userRouter.post('/reverifyEmail', userController.sendVerificaitonAgain);
userRouter.post('/verifyEmail', userController.verifyUser);

userRouter.post('/createAWSVerification', auth(), userController.createAWSVerification)
userRouter.get('/isAWSVerified', auth(), userController.isAWSVerified)

userRouter.post('/emailUsed', requestHandler(userController.emailUsed))
userRouter.post('/accountIdUsed', requestHandler(userController.accountIdUsed))
userRouter.post('/forgetPassword', requestHandler(userController.forgetPassword))

userRouter.get('/referrerCounts', requestHandler(userController.userReferrerCount))
userRouter.get('/awsVerifications', auth(), requestHandler(userController.getAWSVerifications))


userRouter.get('/awsVerification/all', auth(), requestHandler(userController.getAllAWSVerification))
userRouter.put('/awsVerification/status', auth(), requestHandler(userController.putAWSVerificationStatus))

// Admin Api
userRouter.get('/listAllUsers', userController.listAllUsers);

module.exports = userRouter;
