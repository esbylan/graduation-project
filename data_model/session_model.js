var mongodb = require('mongoose');
var sessionModelSchema = new mongodb.Schema({
	_id:{type:String},
	session:{type:String},
	expires:{type:Date}
})
var sessionModel = mongodb.model('session',sessionModelSchema);
module.exports = sessionModel;
