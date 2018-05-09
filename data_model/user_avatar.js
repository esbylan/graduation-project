var mongodb = require('mongoose');
var userAvatarSchema = new mongodb.Schema({
	_id:{type:String,unique:true},
	avatar_data:{type:String},
	avatar_src:{type:String},
	_user:{type:mongodb.Schema.Types.ObjectId,ref:'user_info'}
})
var userAvatar = mongodb.model('user_avatar',userAvatarSchema);
module.exports = userAvatar;
