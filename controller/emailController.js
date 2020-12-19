const nodemailer = require('nodemailer');
const { google } = require('googleapis')


const oAuth2Client = new google.auth.OAuth2(
	process.env.ch21_clientId,
	process.env.ch21_clientSecret,
	'https://developers.google.com/oauthplayground'
)
oAuth2Client.setCredentials({refresh_token: process.env.ch21_refreshToken})

const transporterCredentials = {
	service:'gmail',
	auth: {
		type: 'OAuth2',
		user: 'cityhack21@gmail.com',
		clientId: process.env.ch21_clientId,
		clientSecret: process.env.ch21_clientSecret,
		refreshToken: process.env.ch21_refreshToken,
		accessToken: process.env.ch21_accessToken,
	}
}
const sender = 'cityhack21.com';
const defaultRecievers = ['lowzhao.com'];
const cc = ['lowzhao.com'];


async function sendEmail(
	recieverEmails
	,subject
	,message
	,attachments
)
{
	const accessToken = await oAuth2Client.getAccessToken()
	transporterCredentials.auth.accessToken = accessToken;
	const transporter = nodemailer.createTransport(transporterCredentials);

	const response = await transporter.sendMail({
		from: sender,
		to: [...defaultRecievers, ...recieverEmails],
		cc: cc,
		subject: subject,
		html: message,
		attachments: attachments
	});
	// if (response) {
	// 	console.log(response);
	// }
}

const emailReg = require('../emails/emailRegister');

// sendEmail(
// 	['lowzhao@gmail.com'],
// 	// [],
// 	emailReg.emailTitle,
// 	emailReg.emailTemplate('User', ['A','B','C','D','E']),
// 	emailReg.emailAttachment
// 	// 'aBc'
// )


const sendRegistrationEmail = async (emailAddress, name, verificationToken) => {
	await sendEmail(
		[emailAddress],
		emailReg.emailTitle,
		emailReg.emailTemplate(
			name,
			verificationToken
		),
		emailReg.emailAttachment
	);
}



module.exports = {
	sendEmail,
	sendRegistrationEmail
}
