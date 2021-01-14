const routes = require('express').Router();
const userRouter = require('./user');
const teamRouter = require('./team');
const projectRouter = require('./project');

routes.use('/user', userRouter);
routes.use('/team', teamRouter);
routes.use('/project', projectRouter);

routes.get('/', (req, res) => {
    res.status(200).json({message: 'connected to api'});
});

module.exports = routes;
