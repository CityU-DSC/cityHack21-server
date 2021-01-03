const User = require("../model/User");
const _ = require('lodash');
const AWSVerification = require("../model/AWSVerification");


exports.registerNewUser = async (req, res) => {
    try {
        const { nickName, 
            accountId, firstName, lastName,
            university, majorProgram, year,
            sid, number, schoolEmail, personalEmail,
            avatarUrl, password, about, 
            hasAWSAccount, needAWSExtraCredit, awsEducateReason, referrerAccountId, promoCode
        } = req.body;

        const referrer = await User.findByAccountId(referrerAccountId);

        const user = new User({ 
            nickName, accountId, 
            firstName, lastName, university, 
            majorProgram, year, sid, 
            number, schoolEmail, email: personalEmail,
            avatarUrl, password, about, 
            hasAWSAccount, needAWSExtraCredit, awsEducateReason,
            referrer, promoCode
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
        const user = await User.findByCredentials(email, password);
        if (!user)
        {
            return res
                .status(401)
                .json({ error: "Login failed! Check authentication credentials" });
        }
        if (!user.verified){
            return res 
                .status(401)
                .json({ error: "This email is registered but not verified, please verify it.", reverify: true})
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
        "phoneNumber", "awsEducateReason", "referrerAccountId", "promoCode"
    ]);
    if (body.academicYear){
        body.year = body.academicYear;
    } 
    if (body.phoneNumber){
        body.number = body.phoneNumber;
    }

    if (!req.userData){
        return res.status(400).json(
            {
                success: true,
                error: "Not logged in"
            }
        )
    }

    const user = await User.findByIdAndUpdate(req.userData._id, body);

    if (!user) {
        return res.status(404).json(
            {
                success: true,
                error: "User not exist"
            }
        )
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

    User.find({...searchQuery}, function (err, users)
    {
        // users = users.map(user => _.pick(user, ['_id', 'accountId', 'email', 'created_at', 'updated_at']));
        console.log("USERS>>>", users)
        res.status(200).json(users);
    }).populate('team');
}

exports.verifyUser = async (req, res) => {
    try {
        console.log(req.body);
        const { verificationCode, email } = req.body;

        const user = await User.findOne({ email, verificationToken: verificationCode });
        if (!user) {
            return res.status(401).json({ 
                message: "Wrong verification code." })
        }
        
        const token = await user.generateAuthToken(); // here it is calling the method that we created in the model
        
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
    console.log(accountId);
    const user = await User.findByAccountId(accountId);
    return { accountIdUsed: !!user };
}

exports.forgetPassword = async req => {



    return {  }
}

