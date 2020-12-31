const teamRouter = require("express").Router();
const auth = require("../config/auth");
const teamController = require("../controller/teamController");
const { requestHandler } = require("../util/routeUtil");

//Api
teamRouter
	.get("/all", requestHandler(teamController.getAllTeam))
	.get("/my", auth, requestHandler(teamController.getAllTeam))
	.post("/search", requestHandler(teamController.searchTeam))
	.get('/teamCode', auth, requestHandler(teamController.getTeamCode))

	.post("/create", auth, requestHandler(teamController.createTeam))

	.delete("/leave", auth, requestHandler(teamController.leaveTeam))
	.put("/join", auth, requestHandler(teamController.joinTeam))

	.put("/tooglePrivate", auth, requestHandler(teamController.toogleTeamPrivate))
	.put('/edit', auth, requestHandler(teamController.editTeam))
	;


module.exports = teamRouter;