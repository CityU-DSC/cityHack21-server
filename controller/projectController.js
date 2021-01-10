const _ = require('lodash');
const { copyFilter } = require('../util/lodashUtil');
const Project = require('../model/Project');
const User = require('../model/User');

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

exports.createProject = async req =>
{

    const body = copyFilter(req.body, [
        'pdfUrl', 'repositoryUrl',
        'description', 'motivation',
        'tech', 'name'
    ]);

    body.teamId = await findTeam(req, true);

    if (await Project.findOne({ teamId: team }))
    {
        throw new Error('Project has already created.');
    }

    const project = new Project(body);
    await project.save();

    return { project: await Project.findById(project._id).populate({
        path: 'team',
        populate: ['leader', 'members']
    }) };
}

exports.project = async req => {
    return { project: await Project.findOne({ teamId: await findTeam(req, false) }).populate({
        path: 'team',
        populate: ['leader', 'members']
    }) }
}

exports.projects = async req => {
    return { projects: await Project.find().populate({
        path: 'team',
        populate: ['leader', 'members']
    }) };
}

exports.editProject = async req =>
{

    const body = copyFilter(req.body, [
        'pdfUrl', 'repositoryUrl',
        'description', 'motivation',
        'tech', 'name'
    ]);
    const team = await findTeam(req, true);
    await Project.findOneAndUpdate(
        { teamId: team }, body
    )

}

exports.toogleProjectVote = async req =>
{
    let { voteProjectId } = req.body;
    const myId = req.userData._id;

    const user = await User.findById(myId);
    const project = await Project.findById(voteProjectId);

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
