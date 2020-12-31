const _ = require('lodash');
const Team = require('../model/Team');
const User = require('../model/User');



exports.getAllTeam = async (req) =>
{
    const team = await Team.find().populate(['leader', 'members']);
    return { team };
}

exports.createTeam = async (req) =>
{
    let body = _.clone(req.body);
    body = _.pick(body, [
        'name', 'description', 'topic', 'needPhysicalSpace', 'privateTeam'
    ]);

    body['leader'] = req.userData._id
    body['members'] = [req.userData._id]

    const team = new Team(body);
    await team.save();
    return { team };
}


exports.leaveTeam = async (req) =>
{

    const myId = req.userData._id;

    const team = await Team.findOne({
        members: {
            $elemMatch: {
                $eq: myId
            }
        }
    });

    if (!team)
    {
        throw Error('You are not in any team');
    } else
    {

        team.members = team.members.filter(member => !member.equals(myId));

        if (team.leader == myId && team.members.length > 0)
        {
            team.leader = team.members[0];
        }

    }
    await team.save();
}

exports.searchTeam = async (req) =>
{
    const { teamName, teamLeaderAccountId } = req.body;

    let results = [];

    if (teamName)
    {
        const team = await Team.find({ name: teamName }).populate(['leader', 'members']);
        results.push(...team);
    }

    if (teamLeaderAccountId){
        const user = await User.findByAccountId(teamLeaderAccountId);
        const team = await Team.find({ leader: user }).populate(['leader', 'members']);
        results.push(...team);
    }

    results = _.uniqBy(results, '_id');

    return { teams: results }
}