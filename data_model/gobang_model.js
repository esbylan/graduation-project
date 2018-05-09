var mongodb = require('mongoose');
var gobangModelSchema = new mongodb.Schema({
	player:{type:Array},
	gobangData:{type:Array},
	current_player:{type:String},
	hoster:{type:String},
	winner:{type:String}
})
var gobangModel	 = mongodb.model('gobang',gobangModelSchema);
module.exports = gobangModel;