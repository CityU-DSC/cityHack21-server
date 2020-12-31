const mongoose = require("mongoose");
const User = require("./User");

const o = mongoose.Schema.Types.ObjectId;

const teamSchema = mongoose.Schema({
	name: { type: String, unique: true, required: true },
	topic: { type: String, enum: ['Atlas', 'SageMaker', 'Others'], required: true, default: 'Others' },
	description: String,
	members: [{ type: o, ref: 'User', index: true }],
	leader: { required: true, type: o, ref: 'User', index: true }, // accountId of user in member
	needPhysicalSpace: { type: Boolean, required: true, default: false },
	private: { type: Boolean, required: true, default: false },
	teamCode: String,

	deleted: { type: Boolean, required: true, default: false },
	deletedAt: { type: Date },

	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});

teamSchema.pre("save", async function (next)
{
	// Hash the password before saving the user model
	now = new Date();
	this.updated_at = now;
	if (!this.created_at) this.created_at = now;

	if (this.members.length == 0)
	{
		this.deleted = true;
		this.deletedAt = Date.now();
		this.name = this.name + '_' + Date.now().toString();
	}

	const membersInOtherTeam = await Team.findOne({
		members: {
			$elemMatch: {
				$in: this.members
			}
		},
		_id: {
			$ne: this._id
		}
	});
	if (membersInOtherTeam)
	{
		throw Error('Member is in other teams')
	}

	await User.update({_id: {$in: this.members}}, {team: this._id});


	let isLeaderAMember = this.members.length == 0;
	for (let member of this.members)
	{
		if (member.equals(this.leader))
		{
			isLeaderAMember = true;
		}
	}
	if (!isLeaderAMember)
	{
		throw Error('Leader is not a member');
	}


	if (this.private && !this.teamCode){
		throw Error("No team code when the team is private.");
	}

	next();
});


teamSchema.pre("find", async function (next)
{
	console.log(this.getQuery());
	if (!('deleted' in this.getQuery()))
	{
		this.where({ deleted: false });
	}

	// if (!('private' in this.getQuery()))
	// {
	// 	this.where({ private: false })
	// }

	next();
})


teamSchema.methods.toJSON = async function() {
    var obj = this.toObject();
    delete obj.teamCode;
    delete obj.__v;
    return obj;
}

// //this function generates an auth token for the user
// userSchema.methods.generateAuthToken = async function ()
// {
// 	const user = this;
// 	const token = jwt.sign(
// 		{ _id: user._id, accountId: user.accountId, email: user.email },
// 		"secret"
// 	);
// 	user.tokens = user.tokens.concat({ token });
// 	await user.save();
// 	return token;
// };

// userSchema.methods.generateVerificationEmail = async function ()
// {
// 	const user = this;

// 	const generateCode = () =>
// 	{
// 		return crypto.randomBytes(3).toString('hex').toUpperCase();
// 	}
// 	const code = generateCode();
// 	user.verificationToken = code;
// 	const arr = [];
// 	for (let char of user.verificationToken)
// 	{
// 		arr.push(char);
// 	}
// 	await emailController.sendRegistrationEmail(
// 		[user.email, user.schoolEmail],
// 		user.nickName,
// 		arr
// 	);

// 	await user.save();
// }

// userSchema.methods.toJSON = function ()
// {
// 	var obj = this.toObject();
// 	delete obj.password;
// 	delete obj.verificationToken;
// 	delete obj.tokens;
// 	delete obj.__v;
// 	return obj;
// }

// //this method search for a user by email and password.
// userSchema.statics.findByCredentials = async (email, password) =>
// {
// 	const user = await User.findOne({ email });
// 	if (!user)
// 	{
// 		throw new Error({ error: "Invalid login details" });
// 	}
// 	const isPasswordMatch = await bcrypt.compare(password, user.password);
// 	if (!isPasswordMatch)
// 	{
// 		throw new Error({ error: "Invalid login details" });
// 	}
// 	return user;
// };


// userSchema.statics.sendAWSEducateReminderEmails = async (email, password) =>
// {
// 	const users = await User.find({ verified: false });
// 	for (let user of users)
// 	{
// 		if (
// 			(
// 				[3, 7, 14, 21].indexOf(
// 					parseInt(
// 						dateUtil.dateToDay(new Date()) -
// 						dateUtil.dateToDay(user.created_at)
// 					)
// 				) != -1
// 			) || (
// 				[7, 3, 1].indexOf(
// 					parseInt(
// 						dateUtil.dateToDay(dateUtil.hackathonDate) -
// 						dateUtil.dateToDay(new Date())
// 					)
// 				) != -1
// 			)
// 		)
// 		{
// 			await emailController.sendAWSReminderEmail(
// 				[user.email, user.schoolEmail].filter(x => x),
// 				user.nickName,
// 				user.created_at
// 			);
// 		}
// 	}
// }

const Team = mongoose.model("Team", teamSchema);
// Team.collection.reIndex(async function(finished,c,d){
//     console.log("finished re indexing")
//     console.log(await Team.collection.getIndexes());
// })
module.exports = Team;


