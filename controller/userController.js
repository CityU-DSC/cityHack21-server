const User = require("../model/User");
const _ = require('lodash');


exports.registerNewUser = async (req, res) => {
    try {
        const { nickName, 
            accountId, firstName, lastName,
            university, majorProgram, year,
            sid, number, schoolEmail, personalEmail,
            avatarUrl, password
        } = req.body;

        const user = new User({ 
            nickName, accountId, 
            firstName, lastName, university, 
            majorProgram, year, sid, 
            number, schoolEmail, email: personalEmail,
            avatarUrl, password
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
                err: err
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
    await res.json(req.userData);
};

exports.listAllUsers = async (req, res) =>
{
    User.find({}, function (err, users)
    {
        users = users.map(user => _.pick(user, ['_id', 'accountId', 'email', 'created_at', 'updated_at']));
        console.log("USERS>>>", users)
        res.status(200).json(users);
    });
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
        
        if (!user.verified){
            await user.generateVerificationEmail();
        } else {
            return res.status(401).json({
                error: "User have verified"
            });
        }
        
    } catch (err) {
        return res.status(400).json({ err });
    }
}
