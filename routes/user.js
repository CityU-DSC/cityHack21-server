const user = require("express").Router();
const auth = require("../config/auth");
const userController = require("../controller/userController");

//Api
user.post("/register", userController.registerNewUser);
user.post("/login", userController.loginUser);
user.get("/me", auth, userController.getUserDetails);

user.get('/reverifyEmail', userController.sendVerificaitonAgain);
user.post('/verifyEmail', userController.verifyUser);

user.post('/createAWSVerification', auth, userController.createAWSVerification)



// Admin Api
user.get('/listAllUsers', userController.listAllUsers);

module.exports = user;