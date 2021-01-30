const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

const emailController = require('../controller/emailController');

const dateUtil = require('../util/dateUtil');

const o = mongoose.Schema.Types.ObjectId;


const userSchema = mongoose.Schema({

    accountId: {
        type: String,
        index: true,
        unique: true,
        required: [true, "Please Include your accountId"],
    },
    email: {
        type: String,
        index: true,
        unique: true,
        required: [true, "Please Include your email"],
    },

    nickName: String,
    firstName: {
        type: String,
        required: [true, 'Please include your firstname']
    },
    lastName: {
        type: String,
        required: [true, 'Please include your lastname']
    },

    university: {
        type: String,
        required: [true, 'Please include your university']
    },
    majorProgram: {
        type: String,
        required: [true, 'Please include your major']
    },
    year: {
        type: String,
        required: [true, 'Please include your academic year information']
    },
    sid: String,

    number: {
        type: String,
        required: [true, 'Please include your phone number for communication']
    },
    schoolEmail: {
        type: String,
        required: [true, 'Please include your school email.']
    },
    avatarUrl: String,

    password: {
        type: String,
        default: () =>
        {
            return (new Date() / 1000) + ''
        },
        required: [true, "Please Include your password"]
    },

    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ],
    verified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
    },

    hasAWSAccount: {
        type: Boolean,
        default: false,
    },
    needAWSExtraCredit: {
        type: Boolean,
        default: false
    },
    about: String,
    awsEducateReason: String,
    // needAtlas: {
    //     type: Boolean,
    //     default: false
    // }
    referrer: {
        type: o,
        ref: "User",
        set: function(referrer) {
            this._referrer = this.referrer;
            return referrer;
        }
    },
    referrerCount: { type: Number, default: 0 },
    promoCode: { type: String },
    address: { type: String },

    team: { type: o, ref: "Team" },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },

    projectVoted: [{
        type: o,
        ref: 'Project',
    }]
});

userSchema.pre("save", async function (next)
{
    // Hash the password before saving the user model
    now = new Date();
    this.updated_at = now;
    const user = this;
    if (user.isModified("password"))
    {
        user.password = await bcrypt.hash(user.password, 8);
    }
    if (user.isModified('referrer')){

        const user2 = await User.findById(user.referrer).select('referrerCount');

        const user1 = await User.findById(user._referrer).select('referrerCount')
        
        if (user2){
            user2.referrerCount += 1;
            await user2.save();
        };
        if (user1){
            user1.referrerCount -= 1;
            await user1.save();
        };
    }
    next();
});

//this function generates an auth token for the user
userSchema.methods.generateAuthToken = async function ()
{
    const user = this;
    const token = jwt.sign(
        { _id: user._id, accountId: user.accountId, email: user.email },
        "secret"
    );
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

userSchema.methods.generateVerificationEmail = async function ()
{
    const user = this;

    const generateCode = () =>
    {
        return crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    const code = generateCode();
    user.verificationToken = code;
    const arr = [];
    for (let char of user.verificationToken)
    {
        arr.push(char);
    }
    await emailController.sendRegistrationEmail(
        [user.email, user.schoolEmail],
        user.nickName,
        arr
    );

    await user.save();
}

userSchema.methods.toJSON = function ()
{
    var obj = this.toObject();
    delete obj.password;
    delete obj.verificationToken;
    delete obj.tokens;
    delete obj.__v;
    return obj;
}

//this method search for a user by email and password.
userSchema.statics.findByCredentials = async (email, password) =>
{
    const user = await User.findOne({ email });
    if (!user)
    {
        throw new Error({ error: "Invalid login details" });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch)
    {
        throw new Error({ error: "Invalid login details" });
    }
    return user;
};


userSchema.statics.sendAWSEducateReminderEmails = async (email, password) =>
{
    // const users = await User.find({ verified: false });
    // for (let user of users)
    // {
    //     if (
    //         (
    //             [3, 7, 14, 21].indexOf(
    //                 parseInt(
    //                     dateUtil.dateToDay(new Date()) -
    //                     dateUtil.dateToDay(user.created_at)
    //                 )
    //             ) != -1
    //         ) || (
    //             [7, 3, 1].indexOf(
    //                 parseInt(
    //                     dateUtil.dateToDay(dateUtil.hackathonDate) -
    //                     dateUtil.dateToDay(new Date())
    //                 )
    //             ) != -1
    //         )
    //     )
    //     {
    //         await emailController.sendAWSReminderEmail(
    //             [user.email, user.schoolEmail].filter(x => x),
    //             user.nickName,
    //             user.created_at
    //         );
    //     }
    // }
}

userSchema.statics.findByAccountId = async accountId =>
{
    return User.findOne({ accountId });
}

userSchema.statics.referrerCount = () => {
    return User.find().select(['accountId', 'referrerCount']).sort({ referrerCount: -1 })
}

const User = mongoose.model("User", userSchema);
// User.collection.reIndex(async function(finished,c,d){
//     console.log("finished re indexing")
//     console.log(await User.collection.getIndexes());
// })
module.exports = User;


