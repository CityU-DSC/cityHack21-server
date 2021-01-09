const adminRouter = require("express").Router();
const auth = require("../config/auth");
const adminController = require("../controller/adminController");
const { requestHandler } = require("../util/routeUtil");


const raiseError = true;
const checkAdmin = true;
const rh = requestHandler;

//Api
adminRouter
	.get('/allUsers', auth(raiseError, checkAdmin), rh())


module.exports = adminRouter;