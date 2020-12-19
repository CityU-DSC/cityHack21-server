const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

const emailController = require('./emailController');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Include your name"],
        unqiue: true,
        index: true
    },
    email: {
        type: String,
        required: [true, "Please Include your email"],
        unqiue: true,
        index: true
    },
    password: {
        type: String,
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
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
});

userSchema.pre("save", async function(next) {
    // Hash the password before saving the user model
    now = new Date();
    this.updated_at = now;
    if(!this.created_at) this.created_at = now;
    const user = this;
    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

//this function generates an auth token for the user
userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign(
        { _id: user._id, name: user.name, email: user.email },
        "secret"
    );
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

//this method search for a user by email and password.
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error({ error: "Invalid login details" });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error({ error: "Invalid login details" });
    }
    return user;
};



userSchema.methods.generateVerificationEmail = async function() {
    const user = this;

    const generateCode = () => {
        return crypto.randomBytes(3).toString('hex').toUpperCase();
    }

    user.verificationToken = generateCode();

    await emailController.sendRegistrationEmail(
        user.email, 
        user.name, 
        user.verificationToken
    );

    await user.save();

}

const User = mongoose.model("User", userSchema);
module.exports = User;
