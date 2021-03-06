const mongoose = require("mongoose");

const o = mongoose.Schema.Types.ObjectId;
const AWSVerificationSchema = mongoose.Schema({

    userId: {
        ref: "User",
        type: o,
        required: [true, "Please include user id"]
    },
    
    status: {
        type: String, // pending | success | reject
        default: "pending"
    },

    imageUrl: {
        type: String,
        required: [true, "Please include imageUrl"]
    },

    admin: {
        type: o,
        ref: "User"
    },

    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
});

AWSVerificationSchema.pre("save", async function(next) {
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


