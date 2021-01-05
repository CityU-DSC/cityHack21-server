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

    return { team: await Team.findById(team._id).populate(['leader', 'members']) };
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
        const user = await User.findOne({accountId: { $regex: '.*' + teamLeaderAccountId.split(' ').join('.*') + '.*', $options: 'i' }});
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

    for (let team of results){
        if (
            !req.userData || 
            team.members
                .map(m => m._id)
                .filter(m => m._id.equals(req.userData._id))
                .length == 0
        ){
            delete team['teamCode'];
        }
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
        throw Error("Unauthorized.");
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
        
        for (let key in body ){
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
    return { team: await Team.findOne({
        leader: myId
    }).populate(['leader', 'members']) }
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
