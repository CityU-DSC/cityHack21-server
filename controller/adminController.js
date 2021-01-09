const User = require("../model/User");
const _ = require('lodash');
const crypto = require('crypto');
const emailController = require("./emailController")



exports.allUsers = async req => {

	let users = await Users();

	users = users.map(u => u.toObject());

	return { users };
}
