const mongoose = require("mongoose");

const projectSchema = mongoose.Schema({
    name: String,
    pdfUrl: {
        type: String,
        required: [true, 'Please include pdf.']
    },

    repositoryUrl: {
        type: String,
        required: [true, 'Please include repository.']
    },

    teamId: {
        type: o, 
        ref: "Team", 
        required: [true, 'Please include team.'], 
        unique: true,
    },

    description: String,
    motivation: String,
    tech: [String],
    
    votes: number,

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

