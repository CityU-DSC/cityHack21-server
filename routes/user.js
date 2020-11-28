const user = require("express").Router();
const auth = require("../config/auth");
const userController = require("../controller/userController");

//Api
user.post("/register", userController.registerNewUser);
user.post("/login", userController.loginUser);
user.get("/me", auth, userController.getUserDetails);


// Admin Api
user.get('/listAllUsers', userController.listAllUsers);

module.exports = user;