const cron = require('node-cron');
const User = require('../model/User');

const sendAWSEducateReminderEmails = () => {
	cron.schedule('0 0 * * *', async () => {
		console.log(`Now is: ${new Date()}`);
		console.log(`Running task email sending.`);
		await User.sendAWSEducateReminderEmails();
	});
}

module.exports = {
	startCrons: () => {
		sendAWSEducateReminderEmails();
	}
}