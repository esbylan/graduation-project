var mongodb = require('mongoose');
var userInfoSchema = new mongodb.Schema({
	_id:{type:String,unique:true},
	pwd:{type:String},
	realname:{type:String},
	sex:{type:String},
	tel:{type:String},
	level:{type:Number},
	regDate:{type:Date}
})
var userInfo = mongodb.model('user_info',userInfoSchema);
module.exports = userInfo;
