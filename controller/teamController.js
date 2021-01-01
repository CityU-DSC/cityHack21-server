const _ = require('lodash');
const Team = require('../model/Team');
const User = require('../model/User');

const crypto = require('crypto');


exports.getAllTeam = async (req) =>
{
    const teams = await Team.find().populate(['leader', 'members']);
    return { teams };
}

exports.createTeam = async (req) =>
{
    let body = _.clone(req.body);
    body = _.pick(body, [
        'name', 'description', 'topic', 'needPhysicalSpace', 'private'
    ]);

    body['leader'] = req.userData._id
    body['members'] = [req.userData._id]

    const team = new Team(body);


    try
    {
        await team.save();
    } catch (err)
    {
        let errorMessage;
        if (err.code == 11000)
        {
            errorMessage = "Name has already exist."
            throw {
                message: errorMessage,
                status: 409,
                nameUsed: !!err.keyPattern.name
            }
        } else
        {
            errorMessage = "Unknown error."
            throw err
        }

    }

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

    await User.findByIdAndUpdate(myId, { team: null });

}

exports.searchTeam = async (req) =>
{
    const { name, teamLeaderAccountId, useAtlas, useSagemaker } = req.body;

    const query = {};

    if (name)
    {
        query['name'] = name;
    }

    if (teamLeaderAccountId)
    {
        const user = await User.findByAccountId(teamLeaderAccountId);
        query['leader'] = user;
    }


    query['topic'] = {
        $in: ['Others']
    }
    if (useAtlas)
    {
        query['topic']['$in'].append('Atlas')
    }
    if (useSagemaker)
    {
        query['topic']['$in'].append('SageMake')
    }

    const results = await Team.find(query).populate(['leader', 'members']);

    return { teams: results }
}

exports.joinTeam = async req =>
{
    const { teamId, teamCode } = req.body;
    const myId = req.userData._id;

    const team = await Team.findById(teamId);
    if (team.private && teamCode != team.teamCode)
    {
        throw Error("Unauthorized.");
    }

    team.members.push(myId);

    await team.save();
    return { team }
}

exports.toogleTeamPrivate = async req =>
{
    const myId = req.userData._id;

    const team = await Team.findOne({ leader: myId });
    if (!team)
    {
        throw Error('You are not in any team');
    }
    team.private = !team.private;

    const generateCode = () =>
    {
        return crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    const code = generateCode();
    team.teamCode = code;

    await team.save();
    return { teamCode: team.teamCode }
}

exports.editTeam = async req =>
{

    const myId = req.userData._id;

    let body = _.clone(req.body);
    body = _.pick(body, ["name", "topic", "description", "leader", "needPhysicalSpace"]);

    try
    {
        await Team.findOneAndUpdate(
            {
                leader: myId
            },
            body
        );
    } catch (err)
    {
        let errorMessage;
        if (err.code == 11000)
        {
            errorMessage = "Name has already exist."
            throw {
                message: errorMessage,
                status: 409,
                nameUsed: !!err.keyPattern.name
            }
        } else
        {
            errorMessage = "Unknown error."
            throw err
        }

    }
}

exports.getTeamCode = async req =>
{
    const myId = req.userData._id;

    const team = await Team.findOne({ members: { $elemMatch: { $eq: myId } } }).select('teamCode');
    if (!team)
    {
        throw Error('You are not in any team');
    }
    return { teamCode: team.teamCode }
}

exports.getMyTeam = async req =>
{
    const myId = req.userData._id;
    const team = await Team.findOne(
        { 
            members: { $elemMatch: { $eq: myId } } 
        }
    ).populate(['leader', 'members']);
    return { team }

}