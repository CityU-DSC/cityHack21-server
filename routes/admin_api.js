const routes = require('express').Router();
const user = require('./user');

routes.use('/user', user);

routes.get('/', (req, res) => {
    res.status(200).json({message: 'connected to admin api'});
});

module.exports = routes;