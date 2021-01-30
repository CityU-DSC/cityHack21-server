const jwt = require("jsonwebtoken");

const User = require('../model/User')
module.exports = (raiseError=true) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization? req.headers.authorization.replace("Bearer ", ""): '';
            if (!token && raiseError){
                throw "Auth failed"
            } else if (!token && !raiseError) {
                return next();
            }
            const decoded = jwt.verify(token, "secret");
            const userData = await User.findById(decoded._id);
            if (!userData.tokens.map(x => x.token).includes(token)){
                throw "Auth failed";
            }
            req.userData = decoded;
    
            return next();
        } catch (err) {
            console.log(err)
            return res.status(401).json({
                message: "Authentication Failed",
                success: false,
                error: {
                    message:"Authentication Failed",
                    status: 401
                }
            });
        }
    }
}