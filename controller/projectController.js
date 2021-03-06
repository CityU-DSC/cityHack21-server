const _ = require('lodash');
const { copyFilter } = require('../util/lodashUtil');
const Project = require('../model/Project');
const Admin = require('../model/Admin');
const User = require('../model/User');
const Team = require('../model/Team');

async function findTeam(req, leaderOnly = false)
{

    let myId = req.userData._id;
    let team;
    if (leaderOnly)
    {
        team = await Team.findOne({
            leader: myId
        });
    } else
    {
        team = await Team.findOne(
            {
                members: { $elemMatch: { $eq: myId } }
            }
        );
    }
    return team;
}

exports.createProject = async req => {

    const body = copyFilter(req.body, [
        'pdfUrl', 'repositoryUrl',
        'description', 'motivation',
        'tech', 'name', 'logoUrl'
    ]);

    let team = await findTeam(req, true);
    if (!team){
        if ((await findTeam(req))) {
            throw {
                message: "Only leader can create project",
                status: 403
            }
        } else {
            throw {
                message: "Please create team before project. Team not found.",
                status: 404
            }
        }
    }
    body.team = team;

    if (await Project.findOne({ team }))
    {
        throw new Error('Project has already created.');
    }

    let project = new Project(body);
    await project.save();

    project = await Project.findById(project._id).populate({
        path: 'team',
        populate: ['leader', 'members']
    });
    if (project.team){
        const team = project.team;
        for (let member of team.members){
            delete member.password;
            delete member.verificationToken;
            delete member.tokens;
            delete member.__v;
        }
        delete team.leader.password;
        delete team.leader.verificationToken;
        delete team.leader.tokens;
        delete team.leader.__v;
    }

    return { project };
}

exports.project = async req => {
    const project = await Project.findOne({ team: await findTeam(req, false) }).populate({
        path: 'team',
        populate: ['leader', 'members']
    });
    if (project) {
        project.voted = false;
        if (project.team){
            const team = project.team;
            for (let member of team.members){
                delete member.password;
                delete member.verificationToken;
                delete member.tokens;
                delete member.__v;
            }
            delete team.leader.password;
            delete team.leader.verificationToken;
            delete team.leader.tokens;
            delete team.leader.__v;
        }
    }
    return { project };
}

exports.projects = async req => {
    const projects = await Project.find().populate({
        path: 'team',
        populate: ['leader', 'members']
    })


    for (let project of projects){
        project.voted = false;
        if (project.team){
            const team = project.team;
            for (let member of team.members){
                delete member.password;
                delete member.verificationToken;
                delete member.tokens;
                delete member.__v;
            }
            delete team.leader.password;
            delete team.leader.verificationToken;
            delete team.leader.tokens;
            delete team.leader.__v;
        }
    }

    if (req.userdata) {
        const myId = req.userData._id;
        const user = await User.findById(myId).select('projectVoted');

        for (let projectVoted_ of user.projectVoted){
            for (let project of projects){
                if (projectVoted_.equals(project._id)){
                    project.voted = true;
                }
            }
        }
    }


    return { projects };
}

exports.editProject = async req => {
    const body = copyFilter(req.body, [
        'pdfUrl', 'repositoryUrl',
        'description', 'motivation',
        'tech', 'name', 'logoUrl'
    ]);
    const team = await findTeam(req, true);
    const project = await Project.findOne({ team: team });
    if (!project){
        throw {
            message:"Project not found",
            status: 404
        }
    }

    for (let bodyKey in body){
        project[bodyKey] = body[bodyKey];
    }
    await project.save();

    project.voted = false;

    return { project };
}

exports.toggleProjectVote = async req =>
{
    let { voteProjectId } = req.body;
    if (!voteProjectId){
        throw {
            message: "Please provide voteProjectId",
            status: 400
        }
    }
    const myId = req.userData._id;

    const user = await User.findById(myId);
    const team = await findTeam(req);

    const project = await Project.findById(voteProjectId);

    if (team){
        const myProject = await Project.findOne({team: team});

        if (myProject && project._id.equals(myProject._id)){
            throw {
                message: "Cannot vote yourself. Please go look at the mirror XD.",
                status: 403
            }
        }
    }


    const projectVoted = user.projectVoted.filter(x => x.equals(voteProjectId)).length > 0;
    if (projectVoted)
    {
        user.projectVoted = user.projectVoted.filter(x => !x.equals(voteProjectId));
        project.votes -= 1;
    } else
    {
        user.projectVoted.push(voteProjectId);
        project.votes += 1;
        if (user.projectVoted.length > 3)
        {
            throw {
                message: "You can only vote maximum 3 projects.",
                status: 403
            }
        }
    }

    await user.save();
    await project.save();
}

exports.setProjectStatus = async req => {
    let myId = req.userData._id;
    let { projectId, status } = req.body;

    if (!await Admin.userIsAdmin(myId)){
        throw {
            message: 'Forbidden.',
            status: 403
        };
    }

    await Project.findByIdAndUpdate(projectId, { status });
}
