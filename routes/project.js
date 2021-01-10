const projectRouter = require('express').Router();
const auth = require('../config/auth');
const projectController = require('../controller/projectController');
const { requestHandler } = require('../util/routeUtil');

const rh = requestHandler;

//Api
projectRouter
	.get('/me', auth(), rh(projectController.project))
	.get('/all', auth(false),rh(projectController.projects))

	.put('/toogleVote', auth(), rh(projectController.toogleProjectVote))

	.post('/create', auth(), rh(projectController.createProject))
	.put('/edit', auth(), rh(projectController.editProject))
;


module.exports = projectRouter;