const user = require("express").Router();
const auth = require("../config/auth");
const userController = require("../controller/userController");

user.post("/register", userController.registerNewUser);
user.post("/login", userController.loginUser);
user.get("/me", auth, userController.getUserDetails);

module.exports = user;