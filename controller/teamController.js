const _ = require('lodash');
const Team = require('../model/Team');
const User = require('../model/User');

const crypto = require('crypto');


exports.createTeam = async (req) =>
{
    let body = _.clone(req.body);
    body = _.pick(body, [
        'name', 'description', 'topic', 'needPhysicalSpace', 'private'
    ]);

    body['leader'] = req.userData._id
    body['members'] = [req.userData._id]

    let team = new Team(body);


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
    team = await Team.findById(team._id).populate(['leader', 'members']);

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
        query['name'] = { $regex: '.*' + name.split(' ').join('.*') + '.*', $options: 'i' };
    }

    if (teamLeaderAccountId)
    {
        const user = await User.findOne({ accountId: { $regex: '.*' + teamLeaderAccountId.split(' ').join('.*') + '.*', $options: 'i' } });
        query['leader'] = user;
    }


    query['topic'] = {
        $in: ['Others']
    }
    if (useAtlas)
    {
        query['topic']['$in'].push('Atlas')
    }
    if (useSagemaker)
    {
        query['topic']['$in'].push('SageMaker')
    }
    // console.log(query)

    let results = await Team.find(query).populate(['leader', 'members']);
    results = results.map(result => result.toJSON());

    for (let team of results)
    {
        if (
            !req.userData ||
            team.members
                .map(m => m._id)
                .filter(m => m._id.equals(req.userData._id))
                .length == 0
        )
        {
            delete team['teamCode'];
        }
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
    return { teams: results }
}

exports.joinTeam = async req =>
{
    const { teamId, teamCode } = req.body;
    const myId = req.userData._id;

    const team = await Team.findById(teamId);
    if (team.private && teamCode != team.teamCode)
    {
        throw {
            message: "Unauthorized.",
            status: 401,
        }
    }

    team.members.push(myId);

    await team.save();
    return { team }
}

exports.editTeam = async req =>
{
    const myId = req.userData._id;

    let body = _.clone(req.body);
    body = _.pick(body, ["name", "topic", "description", "leader", "needPhysicalSpace", "private"]);

    try
    {
        const team = await Team.findOne(
            {
                leader: myId
            }
        );

        for (let key in body)
        {
            team[key] = body[key];
        }

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

    const team = await Team.findOne({
        leader: myId
    }).populate(['leader', 'members'])
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
    return {
        team
    }
}

exports.getMyTeam = async req =>
{
    const myId = req.userData._id;
    const team = await Team.findOne(
        {
            members: { $elemMatch: { $eq: myId } }
        }
    ).populate(['leader', 'members']);

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
    return { team }

}
exports.kickMember = async req =>
{
    const myId = req.userData._id;
    const { kickMemberId } = req.body;
    const team = await Team.findOne({ leader: myId });

    if (!team)
    {
        throw {
            message: "You are not in any team or you are not the leader.",
            status: 404,
        };
    } else
    {
        if (myId == kickMemberId) {
            throw {
                message: "You cannot kick yourself.",
                status: 403,
            };
        }
        let tmp = team.members.filter(member => !member.equals(kickMemberId));
        if (tmp.length == team.members.length){
            throw {
                message: "Member not found in team.",
                status: 404,
            };
        }
        team.members = tmp;

        await team.save();

        await User.findByIdAndUpdate(kickMemberId, { team: null });
    }

}
