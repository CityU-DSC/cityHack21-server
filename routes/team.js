const teamRouter = require("express").Router();
const auth = require("../config/auth");
const teamController = require("../controller/teamController");
const { requestHandler } = require("../util/routeUtil");

//Api
teamRouter.get("/all", requestHandler(teamController.getAllTeam));
teamRouter.get("/my", auth, requestHandler(teamController.getAllTeam));
teamRouter.post("/create", auth, requestHandler(teamController.createTeam));
teamRouter.get("/leave", auth, requestHandler(teamController.leaveTeam));

teamRouter.post("/search", auth, requestHandler(teamController.searchTeam));

module.exports = teamRouter;