var mongodb = require('mongoose');
var giftSchema = new mongodb.Schema({
	giftName:{type:String},
	price:{type:Number}
})
var gift = mongodb.model('gift',giftSchema);
module.exports = gift;
