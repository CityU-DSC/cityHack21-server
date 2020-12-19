const User = require("../model/User");
const _ = require('lodash');


exports.registerNewUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const user = new User({
            name, email, password
        });
        try {
            await user.save();
        } catch (err){
            console.error(err);
            return res.status(409).json({
                message: "email already in use",
                err: err
            });
        }
        
        await user.generateVerificationEmail();

        delete user.verificationToken;
        delete user.password;
        delete user.tokens;

        res.status(201).json({ user, token });
    } catch (err) {
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
        users = users.map(user => _.pick(user, ['_id', 'name', 'email', 'created_at', 'updated_at']));
        console.log("USERS>>>", users)
        res.status(200).json(users);
    });
}

exports.verifyUser = async (req, res) => {
    try {
        const { verificationToken, name } = req.body;

        const user = await User.findOne(name, verificationToken);
        if (!user) {
            return res.status(401).json({ 
                message: "Wrong verification code." })
        }
        
        const token = await user.generateAuthToken(); // here it is calling the method that we created in the model
        
        user.verified = true;
        await user.save();
        
        delete userData.password;

        return res.status(200).json({ userData, token });
    } catch (err) {
        return res.status(400).json({ err: err });
    }
}

exports.sendVerificaitonAgain = async (req, res) => {
    try {
        const { name } = req.body;

        const user = await User.findOne(name);
        
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
