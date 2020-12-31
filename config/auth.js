const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.replace("Bearer ", "");
        const decoded = jwt.verify(token, "secret");
        req.userData = decoded;

        next();
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
};