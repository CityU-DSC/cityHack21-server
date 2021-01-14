const _ = require('lodash');

function copyFilter(obj, lis) {
	return _.pick(_.clone(obj), lis);
}

module.exports = {
	copyFilter
}