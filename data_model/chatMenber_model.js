var mongodb = require('mongoose');
var chatMenberSchema = new mongodb.Schema({
	userId:{type:String,unique:true},
	realname:{type:String},
	lastSpeakDate:{type:Date},
	isBanned:{type:Boolean},
	avatar:{type:Object},
	isOnline:{type:Boolean}
})
var chatMenber = mongodb.model('chat_menber',chatMenberSchema);
module.exports = chatMenber;