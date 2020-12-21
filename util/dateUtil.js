
const daysToString = days => {
	let count;
	let result = '';
	if (days / 30 > 1) {
		count = parseInt(days / 30);
		result += count + ' month';
	} else if (days / 7 > 1) {
		count = parseInt(days / 7);
		result += count + ' week';
	} else {
		days = parseInt(days);
		count = days;
		result += count + ' day';
	}
	result += (count > 1? 's':'');
	return result;
}
const dateToDay = date => date / (1000*3600*24)

const hackathonDate = new Date('2021-01-30')

module.exports = {
	daysToString,
	dateToDay,
	hackathonDate
}
