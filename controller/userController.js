const User = require("../model/User");
const Admin = require("../model/Admin");
const _ = require('lodash');
const AWSVerification = require("../model/AWSVerification");
const crypto = require('crypto');
const emailController = require("./emailController")


exports.registerNewUser = async (req, res) => {
    try {
        const { nickName,
            accountId, firstName, lastName,
            university, majorProgram, year,
            sid, number, schoolEmail, personalEmail,
            avatarUrl, password, about,
            hasAWSAccount, needAWSExtraCredit, awsEducateReason, referrerAccountId, promoCode,
            address
        } = req.body;

        const referrer = await User.findByAccountId(referrerAccountId);

        const user = new User({
            nickName, accountId,
            firstName, lastName, university,
            majorProgram, year, sid,
            number, schoolEmail, email: personalEmail,
            avatarUrl, password, about,
            hasAWSAccount, needAWSExtraCredit, awsEducateReason,
            referrer, promoCode,
            address
        });
        try {
            await user.save();
        } catch (err){
            console.log(err);
            let errorMessage;
            if (err.code == 11000) {
                errorMessage = "Email or AccountId not provided or has already exist."
            } else {
                errorMessage = "Unknown error."
            }
            return res.status(409).json({
                message: errorMessage,
                err: err,
                emailUsed: !!err.keyPattern.email,
            });
        }

        await user.generateVerificationEmail();
        res.status(201).json({ user: user });
    } catch (err) {
        console.log(err);
        res.status(400).json({ err: err });
    }
};

exports.loginUser = async (req, res) =>
{
    try
    {
        const email = req.body.email;
        const password = req.body.password;
        const userNotVerified = await User.findOne({ email, verified: false });
        if (userNotVerified)
        {
            return res
                .status(401)
                .json({ error: "This email is registered but not verified, please verify it.", reverify: true})
        }
        const user = await User.findByCredentials(email, password);
        if (!user && userNotVerified)
        {
            return res
                .status(401)
                .json({ error: "Login failed! Check authentication credentials" });
        }

        const token = await user.generateAuthToken();
        res.status(201).json({ user, token });
    } catch (err)
    {
        console.log(err)
        res.status(400).json({ err: err });
    }
};

exports.getUserDetails = async (req, res) =>
{
    const user = await User.findById(req.userData._id);
    return res.status(200).json(user);
};

exports.updateUserDetails = async (req, res) => {
    let body = _.clone(req.body);
    body = _.pick(body, ["nickName", "accountId", "firstName", "lastName",
        "university", "majorProgram", "year", "sid", "number",
        "schoolEmail", "avatarUrl", "hasAWSAccount", "needAWSExtraCredit", "about", "academicYear",
        "phoneNumber", "awsEducateReason", "referrerAccountId", "promoCode", "address"
    ]);
    if (body.academicYear){
        body.year = body.academicYear;
    }
    if (body.phoneNumber){
        body.number = body.phoneNumber;
    }

    if(body.referrerAccountId){
        body.referrer = await User.findByAccountId(body.referrerAccountId);
    }

    if (!req.userData){
        return res.status(400).json(
            {
                success: true,
                error: "Not logged in"
            }
        )
    }

    const user = await User.findById(req.userData._id);

    if (!user) {
        return res.status(404).json(
            {
                success: true,
                error: "User not exist"
            }
        )
    } else {

        for (let key in body){
            user[key] = body[key]
        }

        await user.save();
    }
    return res.status(200).json({success: true});

};

exports.listAllUsers = async (req, res) =>
{
    const searchQuery = _.pickBy(req.query,_.identity)
    if (searchQuery.email){
        searchQuery.$or = [{
            email: searchQuery.email
        }, {
            schoolEmail: searchQuery.email}]
        delete searchQuery.email
    }
    if (searchQuery.noTeam){
        searchQuery['team'] = null;
    }
    if ('noTeam' in searchQuery){
        delete searchQuery['noTeam'];
    }

    User.find({...searchQuery}, function (err, users)
    {
        // users = users.map(user => _.pick(user, ['_id', 'accountId', 'email', 'created_at', 'updated_at']));
        res.status(200).json(users);
    }).populate('team');
}

exports.verifyUser = async (req, res) => {
    try {
        console.log(req.body);
        const { verificationCode, email, password } = req.body;

        const user = await User.findOne({ email, verificationToken: verificationCode });
        if (!user) {
            return res.status(401).json({
                message: "Wrong verification code." })
        }

        const token = await user.generateAuthToken(); // here it is calling the method that we created in the model
        if (password){
            user.password = password;
        }
        user.verified = true;
        await user.save();

        return res.status(200).json({ user, token });
    } catch (err) {
        return res.status(400).json({ err: err });
    }
}

exports.sendVerificaitonAgain = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user){
            return res.status(401).json({
                success: false,
                error: "No such user"
            });
        } else if (!user.verified){
            await user.generateVerificationEmail();
        } else {
            return res.status(401).json({
                success: false,
                error: "User have verified"
            });
        }
        return res.status(200).json({
            success: true
        })

    } catch (err) {
        return res.status(400).json({ err });
    }
}



// == AWS Vertfication ==
exports.createAWSVerification = async (req, res) => {
    try {

        const { imageUrl } = req.body;

        const awsVerification = new AWSVerification();
        awsVerification.imageUrl = imageUrl;
        awsVerification.userId = req.userData._id;

        await awsVerification.save();

        // const user = await AWSVerification.findOne({ imgURL });

        return res.status(200).json({
            success: true,
            message: "successfully updated"
        });

    } catch (err) {
        return res.status(400).json({ err });
    }
}

exports.getAWSVerifications = async (req) => {
    const myId = req.userData._id;
    return { awsVerifications: await AWSVerification.find({userId: myId}).sort('-created_at').limit(1) };
}

exports.isAWSVerified = async (req, res) => {
    const awsVerification = await AWSVerification.find({
        userId: req.userData._id
    }).sort({'created_at': -1});
    if (!awsVerification.length) {
        return res.status(200).json({
            success: true,
            status: "not submitted"
        })
    } else {
        return res.status(200).json({
            success: true,
            status: awsVerification[0].status,
            imgURL: awsVerification[0].imgURL
        });
    }
}

exports.emailUsed = async (req) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    return { emailUsed: !!user };
}

exports.accountIdUsed = async (req) => {
    const { accountId } = req.body;
    const user = await User.findByAccountId(accountId);
    return { accountIdUsed: !!user };
}

exports.forgetPassword = async req => {

    const { email } = req.body;

    if (!email){
        throw {
            message: 'No input',
            status: 400
        }
    }
    const user = await User.findOne({ $or: [{ email: email }, { schoolEmail: email }] });

    if (!user) {
        throw {
            message: 'No such user.',
            status: 404
        }
    } else {
        const generateCode = () => {
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
}

exports.userReferrerCount = async req => {
    let users = await User.find().sort('-referrerCount').limit(30);
    users = users.map( (val, idx) => {
        val = val.toJSON();
        val.rank = idx+1;
        return val;
    })
    
    return { 'referrers' :  users};
}

const genricForbidden = {
    message: 'Forbidden.',
    status: 403
};

exports.getAllAWSVerification = async req => {
    const myId = req.userData._id;
    console.log(myId);
    if (!await Admin.userIsAdmin(myId)){
        throw genricForbidden;
    }
    return { awsVerifications: await AWSVerification.find() };
}

exports.putAWSVerificationStatus = async req => {
    const myId = req.userData._id;
    const { awsId, status } = req.body;

    if (!await Admin.userIsAdmin(myId)){
        throw genricForbidden;
    }

    await AWSVerification.findByIdAndUpdate(awsId, { status, adminId: myId });
}

