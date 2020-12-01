const nodemailer = require('nodemailer');

const transporterCredentials = {
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		type: 'OAuth2',
		user: 'lowzhao@gmail.com',
		scope : "https://www.googleapis.com/auth/gmail.send",
		clientId: process.env.ch21_clientId,
		clientSecret: process.env.ch21_clientSecret,
		refreshToken: process.env.ch21_refreshToken,
		accessToken: process.env.ch21_accessToken,
	}
}
const sender = 'lowzhao.com';
const defaultRecievers = ['lowzhao.com'];
const cc = ['lowzhao.com'];


async function sendEmail(
	recieverEmails
	,subject
	,message
)
{
	const transporter = nodemailer.createTransport(transporterCredentials);

	const response = await transporter.sendMail({
		from: sender,
		to: [...defaultRecievers, ...recieverEmails],
		cc: cc,
		subject: subject,
		html: message
	});
	if (response) {
		console.log(response);
	}
}

module.exports = {
	sendEmail
}
