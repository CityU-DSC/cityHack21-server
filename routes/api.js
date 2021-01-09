const routes = require('express').Router();
const userRouter = require('./user');
const adminRouter = require('./admin');
const teamRouter = require('./team');

routes.use('/user', userRouter);
routes.use('/admin', adminRouter);
routes.use('/team', teamRouter);

routes.get('/', (req, res) => {
    res.status(200).json({message: 'connected to api'});
});

module.exports = routes;
