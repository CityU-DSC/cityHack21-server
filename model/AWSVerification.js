const mongoose = require("mongoose");

const AWSVerificationSchema = mongoose.Schema({

    userId: {
        ref: "User",
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Please include user id"]
    },
    
    verificationState: {
        type: String, // pending | confirmed, reject
        default: "pending"
    },

    imageURL: {
        type: String,
        required: [true, "Please include imageURL"]
    },

    // adminId: {}

    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
});

AWSVerificationSchema.pre("save", async function(next) {
    // Hash the password before saving the user model
    now = new Date();
    this.updated_at = now;
    if(!this.created_at) this.created_at = now;
    next();
});

const AWSVerification = mongoose.model("AWSVerification", AWSVerificationSchema);
// AWSVerification.collection.reIndex(async function(finished,c,d){
//     console.log("finished re indexing")
//     console.log(await AWSVerification.collection.getIndexes());
// })
module.exports = AWSVerification;


