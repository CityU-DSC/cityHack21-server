const mongoose = require("mongoose");

const o = mongoose.Schema.Types.ObjectId;


const projectSchema = mongoose.Schema({
    name: String,
    pdfUrl: {
        type: String,
        required: [true, 'Please include pdf presentation.']
    },
    logoUrl: {
        type: String,
        required: [true, 'Please include logo Image.']
    },

    repositoryUrl: {
        type: String,
        required: [true, 'Please include repository.']
    },

    team: {
        type: o,
        ref: "Team",
        required: [true, 'Please include team.'],
        unique: true,
    },

    description: String,
    motivation: String,
    tech: [String],

    votes: { type: Number, default: 0},
    status: { type: String, default: 'all' },

    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
});

projectSchema.pre("save", async function(next) {
    now = new Date();
    this.updated_at = now;
    if(!this.created_at) this.created_at = now;
    next();
});

const Project = mongoose.model("Project", projectSchema);
// Project.collection.reIndex(async function(finished,c,d){
//     console.log("finished re indexing")
//     console.log(await Project.collection.getIndexes());
// })
module.exports = Project;


