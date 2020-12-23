const user = require("express").Router();
const auth = require("../config/auth");
const userController = require("../controller/userController");
const { requestHandler } = require("../util/routeUtil");

//Api
user.post("/register", userController.registerNewUser);
user.post("/login", userController.loginUser);
user.get("/me", auth, userController.getUserDetails);
user.put("/me", auth, userController.updateUserDetails);

user.post('/reverifyEmail', userController.sendVerificaitonAgain);
user.post('/verifyEmail', userController.verifyUser);

user.post('/createAWSVerification', auth, userController.createAWSVerification)
user.get('/isAWSVerified', auth, userController.isAWSVerified)

user.post('/emailUsed', requestHandler(userController.emailUsed))
user.post('/accountIdUsed', requestHandler(userController.accountIdUsed))
// user.get('/emailUsed', )


// Admin Api
user.get('/listAllUsers', userController.listAllUsers);

module.exports = user;