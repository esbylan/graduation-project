var multer = require('multer');
var mongodb = require('mongoose');
var fs = require('fs');
var storage = multer.diskStorage({
	//设置上传后文件路径，uploads文件夹会自动创建。
	destination: function(req, file, cb) {
		cb(null, './public/static/avatar')
	},
	//给上传文件重命名，获取添加后缀名
	filename: function(req, file, cb) {
		var sessionModel = require('./data_model/session_model');
		var userId = '';
		var fileFormat = (file.originalname).split(".");
		sessionModel.findOne({
			_id: req.session.id
		}, function(err, doc) {
			if(err) {
				return false;
			};
			if(doc) {
				userId = JSON.parse(doc.session).cur_user;
				cb(null, 'avartar-' + userId + "." + fileFormat[fileFormat.length - 1]);
			} else {
				return false;
			}
		})

	}
});
//添加配置文件到muler对象。
var upload = multer({
	storage: storage
});

var uploader = upload.single('avatar_file');
exports.dataInput = function(req, res) {
		
		
	uploader(req, res, function(err) {
		
		if(err) {
			return console.log(err);
		}
		//文件信息在req.file或者req.files中显示。
		var arrName = req.file.filename.split('.');
		//删除同名的其他格式头像图片
		fs.exists('public/avatar/' + arrName[0] + '.jpg', function(exists) {
			if(exists && arrName[1] != 'jpg') {
				fs.unlink('public/avatar/' + arrName[0] + '.jpg', function(err) {})
			}
		})
		fs.exists('public/avatar/' + arrName[0] + '.png', function(exists) {
			if(exists && arrName[1] != 'png') {
				fs.unlink('public/avatar/' + arrName[0] + '.png', function(err) {})
			}
		})
		fs.exists('public/avatar/' + arrName[0] + '.jpeg', function(exists) {
			if(exists && arrName[1] != 'jpeg') {
				fs.unlink('public/avatar/' + arrName[0] + '.jpeg', function(err) {})
			}
		})
		var userAvatar = require('./data_model/user_avatar');
		var sessionModel = require('./data_model/session_model');
		sessionModel.findOne({
			_id: req.session.id
		}, function(err, doc) {
			console.log(req.file)
			if(err) {
				return false
			};
			if(doc) {
				var userId = JSON.parse(doc.session).cur_user
				userAvatar.findOne({
					_id: userId
				}, function(err, doc) {
					if(err) {
						return false
					}
					if(doc) {
						userAvatar.findByIdAndUpdate(userId, {
							avatar_data: req.body.avatar_data,
							avatar_src: req.file.filename
						}, function(err, docs) {
							if(err) console.log(err);
							console.log('头像数据更新成功');
						})
					} else {
						var ava = new userAvatar({
							_id: userId,
							avatar_data: req.body.avatar_data,
							avatar_src: req.file.filename
						})
						ava.save();
					}
				})
			}
		})
		res.json({
			"result": '/avatar/' + req.file.filename
		})
	});
}