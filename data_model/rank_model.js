var mongodb = require('mongoose');
var rankModelSchema = new mongodb.Schema({
	difficulty:{type:String},
	userId:{type:String},
	accuracy:{type:Number},
	time:{type:Number},
	realname:{type:String}
})
var rankModel = mongodb.model('rank',rankModelSchema);
module.exports = rankModel;
