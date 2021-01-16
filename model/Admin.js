const mongoose = require('mongoose');
const User = require('./User');

const o = mongoose.Schema.Types.ObjectId;

const adminSchema = mongoose.Schema({
	user: {
		ref: 'User',
		type: o,
		index: true,
	},
	
	deleted: { type: Boolean, required: true, default: false },
	deletedAt: { type: Date },

	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});

adminSchema.pre('save', async function (next)
{
	const now = new Date();
	this.updated_at = now;
	if (!this.created_at) this.created_at = now;

	if (this.deleted)
	{
		this.deletedAt = Date.now();
	}

	next();
});


adminSchema.pre(['find', 'findOne'], async function (next)
{
	if (!('deleted' in this.getQuery()))
	{
		this.where({ deleted: false });
	}

	next();
})

adminSchema.statics.userIsAdmin = async userId => {
	console.log(await Admin.find());
	if (await Admin.findOne({user: userId})){
		return true;
	} else {
		return false;
	}
}

const Admin = mongoose.model('Admin', adminSchema);
// Admin.collection.reIndex(async function(finished,c,d){
//     console.log('finished re indexing')
//     console.log(await Admin.collection.getIndexes());
// })
module.exports = Admin;


