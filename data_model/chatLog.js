var mongodb = require('mongoose');
var chatLogSchema = new mongodb.Schema({
	userId:{type:String},
	realname:{type:String},
	Date:{type:Date},
	content:{type:String},
	fontSize:{type:String},
	fontColor:{type:String},
	fontFamily:{type:String}
})
var chatLog = mongodb.model('chat_log',chatLogSchema);
module.exports = chatLog;