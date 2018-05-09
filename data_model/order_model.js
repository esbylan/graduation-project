var mongodb = require('mongoose');
var orderModelSchema = new mongodb.Schema({
	userId:{type:String},
	subDate:{type:Date},
	state:{type:String},
	content:{type:Array}
})
var orderModel = mongodb.model('order',orderModelSchema);
module.exports = orderModel;
