var mongodb = require('mongoose');
var notifySchema = new mongodb.Schema({
	pubDate:{type:Date},
	content:{type:String}
})
var notify = mongodb.model('notify',notifySchema);
module.exports = notify;
