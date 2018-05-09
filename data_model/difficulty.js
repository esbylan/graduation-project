var mongodb = require('mongoose');
var difficultyModelSchema = new mongodb.Schema({
	_id:{type:String,unique:true},
	quantity:{type:Number},
	numRange:{type:Number},
	extraSetting:{type:String},
	operator:{type:Array},
	dComment:{type:String}
})
var difficultyModel = mongodb.model('difficulty',difficultyModelSchema);
module.exports = difficultyModel;
