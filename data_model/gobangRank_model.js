var mongodb = require('mongoose');
var gobangRankModelSchema = new mongodb.Schema({
	userId:{type:String},
	winNumb:{type:Number},
	loseNumb:{type:Number},
	realname:{type:String}
})
var gobangRankModel = mongodb.model('gobangRank',gobangRankModelSchema);
module.exports = gobangRankModel;