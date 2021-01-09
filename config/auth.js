const jwt = require("jsonwebtoken");
module.exports = (raiseError=true, checkAdmin=false) => {
    return (req, res, next) => {
        try {
            const token = req.headers.authorization.replace("Bearer ", "");
            if (!token && raiseError){
                throw "Auth failed"
            } else if (!token && !raiseError) {
                return next();
            }
            const decoded = jwt.verify(token, "secret");
            req.userData = decoded;

            if (checkAdmin){
                if (!req.userData.admin){
                    throw 'Auth failed';
                }
            }
    
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