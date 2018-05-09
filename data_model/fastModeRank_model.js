var mongodb = require('mongoose');
var fastModeRankModelSchema = new mongodb.Schema({
	userId:{type:String},
	rightNumb:{type:Number},
	realname:{type:String},
	achieveDate:{type:Date}
})
var fastModeRankModel = mongodb.model('fastModeRank',fastModeRankModelSchema);
module.exports = fastModeRankModel;