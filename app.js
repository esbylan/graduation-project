var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var uploader = require('./multer');
var events = require('events');
var cors = require('cors');
var app = express();
var mongodb = require('mongoose');
app.use(cors({
	origin: ['http://localhost:8080'],
	methods: ['GET', 'POST'],
	alloweHeaders: ['Conten-Type', 'Authorization']
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static('public'));
app.use(cookieParser());
mongodb.connect('mongodb://127.0.0.1:27017/Project_Calculator');
app.use(session({
	name: 'idk',
	secret: 'current_user',
	store: new MongoStore({
		url: 'mongodb://127.0.0.1:27017/Project_Calculator',
		ttl: 360
	}),
	cookie: {
		maxAge: 360 * 60 * 1000
	},
	resave: false,
	saveUninitialized: false
}))

app.all('*', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", ' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	if(req.method == 'OPTIONS') {
		res.send(200);
	} else {
		next();
	}
});

//检查登录
app.get('/isLogin', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	console.log(req.session.cur_user);
	console.log(req.session.id);
	var sessionModel = require('./data_model/session_model');
	var userInfo = require('./data_model/user_info');
	var userAvatar = require('./data_model/user_avatar');
	var userData = {
		userId: '',
		userName: '',
		userLvl: 0
	}
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(err) {
			return false
		};
		if(doc) {
			userData.userId = JSON.parse(doc.session).cur_user;
			userInfo.findOne({
				_id: userData.userId
			}, function(err, doc) {
				if(err) {
					return false
				}
				if(doc) {
					userData.userName = doc.realname;
					userData.userLvl = doc.level;
					req.session.cur_user = userData.userId;
					//					res.send({msg:'eUser',data:userData});
				} else {
					res.send({
						msg: 'error'
					})
				}
			})
			userAvatar.findOne({
				_id: userData.userId
			}, function(err, doc) {
				if(err) {
					return false
				}
				res.send(200, {
					msg: 'eUser',
					data: userData,
					avatar: doc
				})

			})
		} else {
			res.send({
				msg: 'noUser'
			})
		}
	})

})

//获取个人信息
app.get('/getProfile',function(req,res){
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var userInfo = require('./data_model/user_info');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc){
			let userId = JSON.parse(doc.session).cur_user;
			userInfo.findOne({_id:userId},function(err,doc){
				res.send({doc})
			})
		}
	})
})

//修改个人信息
app.post('/profileChange', function(req, res) {
	var userInfo = require('./data_model/user_info');

	userInfo.findOne({
		_id: req.body.userid
	}, function(err, doc) {
		if(err) {
			console.log(err);
			return;
		}
		console.log(req.body.pwd)
		if(doc.pwd!=req.body.oldpwd){
			res.send({msg:'密码错误'})
		}else{
			userInfo.update({_id:req.body.userid},{
				pwd:req.body.pwd,
				sex:req.body.sex,
				tel:req.body.tel
			},function(err,doc){})
			res.send({
				msg: 'success'
			})
		}
	})

})
//注销
app.get('/logout', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	sessionModel.remove({
		_id: req.session.id
	}, function(err, doc) {
		if(err) {
			return false
		};
	})
	res.json('');
})

//注册路由
app.post('/register', function(req, res) {
	console.log(req.body);
	var userInfo = require('./data_model/user_info');

	userInfo.find({
		_id: req.body.userid
	}, function(err, doc) {
		if(err) {
			console.log(err);
			return;
		}
		if(!doc.length) {
			var user = new userInfo({
				_id: req.body.userid,
				pwd: req.body.pwd,
				realname: req.body.realname,
				sex: req.body.sex,
				tel: req.body.tel,
				level: 0,
				regDate: new Date(Date.now() + (8 * 60 * 60 * 1000))
			});
			user.save();
			res.send({
				msg: 'success'
			})
		} else {
			res.send({
				msg: 'fail'
			})
		}
	})

})
//登录路由
app.post('/login', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var userInfo = require('./data_model/user_info');
	userInfo.find({
		_id: req.body.userid
	}, function(err, doc) {
		if(err) {
			console.log(err);
			return;
		}
		if(!doc.length) {
			res.send({
				msg: 'wrong_id'
			})
		} else {
			if(req.body.pwd == doc[0].pwd) {
				req.session.cur_user = req.body.userid;
				console.log(req.session.cur_user)
				res.send({
					msg: 'success'
				})
			} else {
				res.send({
					msg: 'wrong_pwd'
				})
			}
		}
	})
})

//获取难度
app.get('/difficulty', function(req, res) {
	var diff = require('./data_model/difficulty');
	var diffName = [];
	diff.find(function(err, doc) {
		doc.forEach(function(item, index) {
			diffName[index] = item._id
		})
		res.send(diffName);
	})
})

//获取难度信息
app.get('/difficulty_info', function(req, res) {
	var diff1 = require('./data_model/difficulty');
	diff1.findOne({
		_id: req.query.diffName
	}, function(err, doc) {
		if(err) {
			console.log(err);
		}
		res.send({
			msg: {
				content: doc.dComment,
				quantity: doc.quantity
			}
		});
	})
})

app.get('/difficulty_detail', function(req, res) {
	var diff1 = require('./data_model/difficulty');
	diff1.findOne({
		_id: req.query.diffName
	}, function(err, doc) {
		if(err) {
			console.log(err);
		}
		res.send({
			msg: doc
		});
	})
})

//设置难度
app.post('/diffSub', function(req, res) {
	var diff1 = require('./data_model/difficulty');
	//将数组转化为运算符 
	var ope = [];
	if((req.body.operator).indexOf('add') != -1) {
		ope.push('+');
	}
	if((req.body.operator).indexOf('subtract') != -1) {
		ope.push('-');
	}
	if((req.body.operator).indexOf('multiply') != -1) {
		ope.push('×');
	}
	if((req.body.operator).indexOf('divide') != -1) {
		ope.push('÷');
	}

	var diff = new diff1({
		_id: req.body.diffName,
		quantity: req.body.quantity,
		numRange: req.body.numRange,
		extraSetting: req.body.extraSetting,
		operator: ope,
		dComment: req.body.comment
	})
	diff.save();
	res.redirect(301, '/')
})
//上传头像
app.post('/avatar_sub', uploader.dataInput)
//考试提交
app.post('/finishHandle', function(req, res) {
	var rankModel = require('./data_model/rank_model');
	var userInfo = require('./data_model/user_info');
	var realname;
	console.log(req.body)
	userInfo.findOne({
		_id: req.body.userId
	}, function(err, doc) {
		realname = doc.realname;
	})
	rankModel.findOne({
		difficulty: req.body.diffName,
		userId: req.body.userId,
		accuracy: {
			$lte: req.body.accuracy
		}
	}, function(err, doc) {
		if(doc) {
			if(doc.accuracy == req.body.accuracy && doc.time > req.body.time) {
				rankModel.update(doc, {
					time: req.body.time,
					realname: realname
				}, function(err, res) {})
			} else if(doc.accuracy < req.body.accuracy) {
				rankModel.update(doc, {
					time: req.body.time,
					accuracy: req.body.accuracy,
					realname: realname
				}, function(err, res) {})
			}
			userInfo.update({_id:req.body.userId},{'$inc':{'level':req.body.time}},function(err,doc){})
		} else {
			rankModel.findOne({
				difficulty: req.body.diffName,
				userId: req.body.userId
			}, function(err, doc) {
				if(!doc) {
					(new rankModel({
						difficulty: req.body.diffName,
						userId: req.body.userId,
						time: req.body.time,
						accuracy: req.body.accuracy,
						realname: realname
					})).save();
				}
			})
			userInfo.update({_id:req.body.userId},{'$inc':{'level':req.body.time}},function(err,doc){})
		}
	})
	res.send({});
})
//排行榜查询
app.get('/rankQuery', function(req, res) {
	console.log(req.query.diffName);
	var myEventEmitter = new events.EventEmitter();
	var resData = {
		rank: [],
		arrAvatar: []
	}
	var rankModel = require('./data_model/rank_model');
	var userAvatar = require('./data_model/user_avatar');
	var obj;
	myEventEmitter.on('next', push);
	rankModel.find({
		difficulty: req.query.diffName
	}).sort({
		accuracy: -1,
		time: 1
	}).limit(10).exec(function(err, doc) {
		if(doc) {
			resData.rank = doc;
			for(let i = 0; i < 3; i++) {
				if(doc[i]) {
					userAvatar.findOne({
						_id: doc[i].userId
					}, function(err, doc) {
						obj = doc;
						myEventEmitter.emit('next');
					})
				} else {
					obj = undefined;
					myEventEmitter.emit('next');
				}
			}
		}

	})

	function push() {
		resData.arrAvatar.push(obj)
		console.log(resData.arrAvatar)
		if(resData.arrAvatar.length == 3) {
			res.send(resData);
		}
	}

})
//速算提交
app.post('/fastModeSub', function(req, res) {
	var fastModeRankModel = require('./data_model/fastModeRank_model');
	var userInfo = require('./data_model/user_info');
	console.log(req.body)
	var realname;
	userInfo.findOne({
		_id: req.body.userId
	}, function(err, doc) {
		realname = doc.realname;
	})
	fastModeRankModel.findOne({
		userId: req.body.userId
	}, function(err, doc) {
		if(doc && doc.rightNumb < req.body.rightNumb) {
			fastModeRankModel.update(doc, {
				rightNumb: req.body.rightNumb,
				achieveDate: new Date(Date.now() + (8 * 60 * 60 * 1000))
			}, function(err, res) {})
			userInfo.update({_id:req.body.userId},{'$inc':{'level':req.body.rightNumb}},function(err,doc){})
		} else if(!doc) {
			console.log(1)
			fastModeRankModel.findOne({
				userId: req.body.userId
			}, function(err, doc) {
				if(!doc) {
					(new fastModeRankModel({
						userId: req.body.userId,
						rightNumb: req.body.rightNumb,
						realname: realname,
						achieveDate: new Date(Date.now() + (8 * 60 * 60 * 1000))
					})).save();
				}
			})
			userInfo.update({_id:req.body.userId},{'$inc':{'level':req.body.rightNumb}},function(err,doc){})
		}
	})
	res.send({});
})

//速算排行榜查询
app.get('/fmRankQuery', function(req, res) {
	var myEventEmitter = new events.EventEmitter();
	var resData = {
		rank: [],
		arrAvatar: []
	}
	var fastModeRankModel = require('./data_model/fastModeRank_model');
	var userAvatar = require('./data_model/user_avatar');
	var obj;
	myEventEmitter.on('next', push);
	fastModeRankModel.find().sort({
		rightNumb: -1,
		achieveDate: 1
	}).limit(10).exec(function(err, doc) {
		if(doc) {
			resData.rank = doc;
			for(let i = 0; i < 3; i++) {
				if(doc[i]) {
					userAvatar.findOne({
						_id: doc[i].userId
					}, function(err, doc) {
						obj = doc;
						myEventEmitter.emit('next');
					})
				} else {
					obj = undefined;
					myEventEmitter.emit('next');
				}
			}
		}

	})

	function push() {
		resData.arrAvatar.push(obj)
		console.log(resData.arrAvatar)
		if(resData.arrAvatar.length == 3) {
			res.send(resData);
		}
	}

})

//聊天室登录/检查
app.get('/toChat', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var userInfo = require('./data_model/user_info');
	var userAvatar = require('./data_model/user_avatar');
	var chatMenber = require('./data_model/chatMenber_model');
	var userData = {
		userId: '',
		userName: '',
		isBanned: ''
	}
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(err) {
			return false;
		};
		if(doc) {
			userData.userId = JSON.parse(doc.session).cur_user;
			chatMenber.findOne({
				userId: userData.userId
			}, function(err, doc) {
				if(doc) {
					userData.isBanned = doc.isBanned;
					chatMenber.update(doc, {
						isOnline: true
					}, function(err, doc) {})
					chatMenber.find({}, function(err, doc) {
						if(doc) {
							res.send({
								msg: doc,
								userId: userData.userId,
								isBanned: userData.isBanned
							})
						}
					})
				} else {
					userInfo.findOne({
						_id: userData.userId
					}, function(err, doc) {
						if(err) {
							return false;
						}
						if(doc) {
							userData.userName = doc.realname;
							req.session.cur_user = userData.userId;
						} else {
							res.send({
								msg: 'error'
							})
						}
					})
					userAvatar.findOne({
						_id: userData.userId
					}, function(err, doc) {
						if(err) {
							return false
						}
						if(doc) {
							var menber = new chatMenber({
								userId: userData.userId,
								realname: userData.userName,
								isBanned: false,
								avatar: doc,
								lastSpeakDate: null,
								isOnline: true
							})
							menber.save();

						} else {
							var menber = new chatMenber({
								userId: userData.userId,
								realname: userData.userName,
								isBanned: false,
								avatar: null,
								lastSpeakDate: null,
								isOnline: true
							})
							menber.save();
						}
					})
					chatMenber.find({}, function(err, doc) {
						if(doc) {
							res.send({
								msg: doc,
								userId: userData.userId,
								isBanned: userData.isBanned
							})
						}

					})

				}
			})

		} else {
			res.send({
				msg: 'noUser'
			})
		}
	})

})

//聊天室发送消息
app.post('/chatMsg', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var chatMenber = require('./data_model/chatMenber_model');
	var chatLog = require('./data_model/chatLog');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			chatMenber.findOne({
				userId: JSON.parse(doc.session).cur_user
			}, function(err, doc) {
				if(doc) {

					var log = new chatLog({
						userId: doc.userId,
						realname: doc.realname,
						Date: new Date(Date.now() + (8 * 60 * 60 * 1000)),
						content: req.body.centent,
						fontSize: req.body.fontSize,
						fontColor: req.body.fontColor,
						fontFamily: req.body.fontFamily,
						content: req.body.content
					})
					log.save();
					//					console.log(doc)
					chatMenber.update({
						userId: doc.userId
					}, {
						lastSpeakDate: new Date(Date.now() + (8 * 60 * 60 * 1000))
					}, function(err, doc) {
						console.log(doc)
					})
				}
				res.send({
					msg: 'succ'
				})
			})
		} else {
			res.send({
				msg: 'fail'
			})
		}
	})
})
//接收聊天内容
app.get('/getChatContent', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var chatMenber = require('./data_model/chatMenber_model');
	var chatLog = require('./data_model/chatLog');
	var userAvatar = require('./data_model/user_avatar');
	var myEventEmitter = new events.EventEmitter();
	var dataArr = [];
	var obj;
	var dataLength = 0;
	let isBanned = true;
	let session = req.session.id
	myEventEmitter.on('next', push);
	chatLog.find({}, function(err, doc) {
		dataLength = doc.length
		for(let i = 0; i < doc.length; i++) {
			let log = doc[i]
			userAvatar.findOne({
				_id: doc[i].userId
			}, function(err, doc) {
				if(doc) {
					obj = {
						log: log,
						avatar: doc
					};
					myEventEmitter.emit('next');
				} else {
					obj = {
						log: log,
						avatar: null
					};
					myEventEmitter.emit('next');
				}
			})
		}
	})

	function push() {
		dataArr.push(obj)
		if(dataArr.length == dataLength) {
			
			sessionModel.findOne({
				_id: session
			}, function(err, doc) {
				if(doc) {
					let userId = JSON.parse(doc.session).cur_user;
					chatMenber.findOne({
						userId: userId
					}, function(err, doc) {
						if(doc) {
							isBanned = doc.isBanned;
						}
						res.send({
							data: dataArr,
							isBanned: isBanned
						});
					})
				}
			})

		}
	}

})

//建立五子棋局
app.get('/hostGame', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let doc_session = doc.session;
			gobangModel.findOne({
				'player.userId': JSON.parse(doc.session).cur_user
			}, function(err, doc) {
				if(doc) {
					res.send({
						msg: 'user exist'
					})
				} else {
					let arr = [
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[],
						[]
					];
					for(let i = 0; i < 19; i++) {
						for(let j = 0; j < 19; j++) {
							arr[i][j] = 0
						}
					}
					let gobang = new gobangModel({
						player: [{
								userId: JSON.parse(doc_session).cur_user,
								ready: false
							}]

							,
						gobangData: arr,
						current_player: JSON.parse(doc_session).cur_user,
						hoster: JSON.parse(doc_session).cur_user,
						winner: ''
					})
					gobang.save();
					res.send({
						msg: 'add game succ.'
					})
				}
			})

		}
	})
})

//游戏大厅检查
app.get('/lobbyCheck', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	var userAvatar = require('./data_model/user_avatar');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user
			gobangModel.findOne({
				'player.userId': userId
			}, function(err, doc) {
				if(doc) {
					res.send({
						msg: '存在于游戏中',
						action: 'redirect'
					})
				} else {
					gobangModel.find({}, function(err, doc) {
						if(doc) {
							let gameData = doc.map(function(item) {
								return {
									hoster: item.hoster,
									player: item.player
								}
							})
							res.send({
								msg: '获取成功',
								data: gameData
							})
						} else {
							res.send({
								msg: 'no game data'
							})
						}

					})
				}
			})
		}
	})

})

//游戏用户检测
app.get('/gameCheck', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	var userAvatar = require('./data_model/user_avatar');
	var userInfo = require('./data_model/user_info');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user
			gobangModel.findOne({
				'player.userId': userId
			}, function(err, doc) {
				if(doc) {
					let playerInfo = []
					let hoster = doc.hoster;
					let current_player = doc.current_player;
					let player = doc.player;
					let data = doc.gobangData;
					let winner = doc.winner
					for(let i = 0; i < player.length; i++) {
						userAvatar.findOne({
							_id: player[i].userId
						}).exec().then(function(doc) {
							let avatar = doc;
							userInfo.findOne({
								_id: player[i].userId
							}).then(function(doc) {
								playerInfo.push({
									avatar: avatar,
									realname: doc.realname,
									ready: player[i].ready,
									userId: player[i].userId
								})
								if(playerInfo.length == player.length) {
									res.send({
										playerInfo: playerInfo,
										hoster: hoster,
										userId: userId,
										current_player: current_player,
										data: data,
										winner: winner
									})
								}
							})
						})
					}
				} else {
					res.send({
						msg: '未在房间内',
						action: 'redirect'
					})
				}
			})
		}
	})

})

//游戏准备
app.get('/gameReady', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user
			gobangModel.update({
				'player.userId': userId
			}, {
				$set: {
					'player.$.ready': true
				}
			}, function(err, doc) {
				console.log(doc)
			})
			res.send({})
		}
	})
})

//游戏取消准备
app.get('/gameCancleReady', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user
			gobangModel.update({
				'player.userId': userId
			}, {
				$set: {
					'player.$.ready': false
				}
			}, function(err, doc) {
				console.log(doc)
			})
			res.send({})
		}
	})
})

//退出游戏
app.get('/gameExit', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user
			gobangModel.findOne({
				'player.userId': userId
			}, function(err, doc) {
				if(doc) {
					if(doc.hoster == userId) {
						gobangModel.remove({
							'player.userId': userId
						}, function(err, doc) {})
					} else {
						gobangModel.update({
							'player.userId': userId
						}, {
							$pull: {
								'player': {
									userId: userId
								}
							},
							current_player: doc.hoster
						}, function(err, doc) {})
					}
				}
			})
			res.send({})
		}
	})
})

//加入游戏
app.post('/joinGame', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user
			gobangModel.findOne({
				hoster: req.body.hoster
			}, function(err, doc) {
				if(doc) {
					if(doc.player.length < 2) {
						gobangModel.update({
							hoster: req.body.hoster
						}, {
							$push: {
								'player': {
									userId: userId,
									ready: false
								}
							}
						}, function(err, doc) {})
						res.send({
							msg: 'succ'
						})
					} else {
						res.send({
							msg: 'full'
						})
					}
				} else {
					res.send({
						msg: 'nogame'
					})
				}
			})
		}
	})
})

//下棋
app.post('/setPiece', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user;
			gobangModel.findOne({
				current_player: userId
			}, function(err, doc) {
				if(doc) {
					req.body.x = parseInt(req.body.x);
					req.body.y = parseInt(req.body.y)
					let data = doc.gobangData;
					let player = doc.player;
					let cp = '';
					let winFlag = false;
					doc.player.map(function(item) {
						if(item.userId != userId) {
							cp = item.userId
						}
					})

					if(data[req.body.x][req.body.y] != 0) {
						res.send({
							msg: 'piece exist',
							data: data
						})
					} else {
						if(doc.hoster == userId) {
							data[req.body.x][req.body.y] = 1;
							gobangModel.update({
								current_player: userId
							}, {
								gobangData: data,
								current_player: cp
							}, function(err, doc) {
								console.log(doc)
							});
							//五子棋胜利判断
							//横向
							if(req.body.x >= 4 && req.body.x <= 14) {
								let length = 0;
								for(i = -4; i < 5; i++) {
									if(data[req.body.x + i][req.body.y] == 1) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							} else if(req.body.x < 4) {
								let length = 0;
								for(i = -req.body.x; i < 5; i++) {
									if(data[req.body.x + i][req.body.y] == 1) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							} else if(req.body.x > 14) {
								let length = 0;
								for(i = -4; i <= 18 - req.body.x; i++) {
									if(data[req.body.x + i][req.body.y] == 1) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							}
							//纵向
							if(req.body.y >= 4 && req.body.y <= 14) {
								let length = 0;
								for(i = -4; i < 5; i++) {
									if(data[req.body.x][req.body.y + i] == 1) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							} else if(req.body.y < 4) {
								let length = 0;
								for(i = -req.body.y; i < 5; i++) {
									if(data[req.body.x][req.body.y + i] == 1) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							} else if(req.body.y > 14) {
								let length = 0;
								for(i = -4; i <= 18 - req.body.y; i++) {
									if(data[req.body.x][req.body.y + i] == 1) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							}
							//左斜
							if(Math.abs(req.body.x - req.body.y) <= 14) {
								let length = 0;
								for(i = -4; i < 5; i++) {
									if(req.body.x + i < 0 || req.body.y + i < 0) {
										continue;
									} else if(req.body.x + i > 18 || req.body.y + i > 18) {
										continue
									} else {
										if(data[req.body.x + i][req.body.y + i] == 1) {
											length += 1;
											if(length == 5) {
												winFlag = true;
												let loser = '';
												doc.player.map(function(item) {
													if(item.userId != userId) {
														loser = item.userId
													}
												})
												gobangRank(userId, loser);
												gobangModel.update({
													'player.userId': userId
												}, {
													winner: userId
												}, function(err, doc) {
													console.log(doc)
												});
												//五子连珠
												res.send({
													msg: '五子连珠',
													data: data
												});
												break;
											}
										} else {
											length = 0;
										}
									}
								}
							}
							//右斜
							if(Math.abs(req.body.x - req.body.y) >= 4) {
								let length = 0;
								for(i = -4; i < 5; i++) {
									if(req.body.x - i > 18 || req.body.y + i < 0) {
										continue
									} else if(req.body.x - i < 0 || req.body.y + i > 18) {
										continue
									} else {
										if(data[req.body.x - i][req.body.y + i] == 1) {
											length += 1;
											if(length == 5) {
												winFlag = true;
												let loser = '';
												doc.player.map(function(item) {
													if(item.userId != userId) {
														loser = item.userId
													}
												})
												gobangRank(userId, loser);
												gobangModel.update({
													'player.userId': userId
												}, {
													winner: userId
												}, function(err, doc) {
													console.log(doc)
												});
												//五子连珠
												res.send({
													msg: '五子连珠',
													data: data
												});
												break;
											}
										} else {
											length = 0;
										}
									}
								}

							}
						} else {
							data[req.body.x][req.body.y] = 2;
							gobangModel.update({
								current_player: userId
							}, {
								gobangData: data,
								current_player: cp
							}, function(err, doc) {
								console.log(doc)
							});
							//五子棋胜利判断
							//横向
							if(req.body.x >= 4 && req.body.x <= 14) {
								let length = 0;
								for(i = -4; i < 5; i++) {
									if(data[req.body.x + i][req.body.y] == 2) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							} else if(req.body.x < 4) {
								let length = 0;
								for(i = -req.body.x; i < 5; i++) {
									if(data[req.body.x + i][req.body.y] == 2) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							} else if(req.body.x > 14) {
								let length = 0;
								for(i = -4; i <= 18 - req.body.x; i++) {
									if(data[req.body.x + i][req.body.y] == 2) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							}
							//纵向
							if(req.body.y >= 4 && req.body.y <= 14) {
								let length = 0;
								for(i = -4; i < 5; i++) {
									if(data[req.body.x][req.body.y + i] == 2) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							} else if(req.body.y < 4) {
								let length = 0;
								for(i = -req.body.y; i < 5; i++) {
									if(data[req.body.x][req.body.y + i] == 2) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							} else if(req.body.y > 14) {
								let length = 0;
								for(i = -4; i <= 18 - req.body.y; i++) {
									if(data[req.body.x][req.body.y + i] == 2) {
										length += 1;
										if(length == 5) {
											winFlag = true;
											let loser = '';
											doc.player.map(function(item) {
												if(item.userId != userId) {
													loser = item.userId
												}
											})
											gobangRank(userId, loser);
											gobangModel.update({
												'player.userId': userId
											}, {
												winner: userId
											}, function(err, doc) {
												console.log(doc)
											});
											//五子连珠
											res.send({
												msg: '五子连珠',
												data: data
											});
											break;
										}
									} else {
										length = 0
									}
								}
							}
							//左斜
							if(Math.abs(req.body.x - req.body.y) <= 14) {
								let length = 0;
								for(i = -4; i < 5; i++) {
									if(req.body.x + i < 0 || req.body.y + i < 0) {
										continue;
									} else if(req.body.x + i > 18 || req.body.y + i > 18) {
										continue
									} else {
										if(data[req.body.x + i][req.body.y + i] == 2) {
											length += 1;
											if(length == 5) {
												winFlag = true;
												let loser = '';
												doc.player.map(function(item) {
													if(item.userId != userId) {
														loser = item.userId
													}
												})
												gobangRank(userId, loser);
												gobangModel.update({
													'player.userId': userId
												}, {
													winner: userId
												}, function(err, doc) {
													console.log(doc)
												});
												//五子连珠
												res.send({
													msg: '五子连珠',
													data: data
												});
												break;
											}
										} else {
											length = 0;
										}
									}
								}
							}
							//右斜
							if(Math.abs(req.body.x - req.body.y) >= 4) {
								let length = 0;
								for(i = -4; i < 5; i++) {
									if(req.body.x - i > 18 || req.body.y + i < 0) {
										continue
									} else if(req.body.x - i < 0 || req.body.y + i > 18) {
										continue
									} else {
										if(data[req.body.x - i][req.body.y + i] == 2) {
											length += 1;
											if(length == 5) {
												winFlag = true;
												let loser = '';
												doc.player.map(function(item) {
													if(item.userId != userId) {
														loser = item.userId
													}
												})
												gobangRank(userId, loser);
												gobangModel.update({
													'player.userId': userId
												}, {
													winner: userId
												}, function(err, doc) {
													console.log(doc)
												});
												//五子连珠
												res.send({
													msg: '五子连珠',
													data: data
												});
												break;
											}
										} else {
											length = 0;
										}
									}
								}
							}

						}
						if(winFlag == false) {
							res.send({
								msg: 'succ',
								data: data
							})
						}
					}
				} else {
					res.send({
						msg: 'not your turn'
					})
				}
			})
		}
	})
})

//重置游戏
app.get('/resetGame', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user;
			let arr = [
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[],
				[]
			];
			for(let i = 0; i < 19; i++) {
				for(let j = 0; j < 19; j++) {
					arr[i][j] = 0
				}
			}
			gobangModel.update({
				'player.userId': userId
			}, {
				winner: '',
				gobangData: arr
			}, function(err, doc) {})
		}
		res.send(200, {
			msg: 'reset succ'
		})
	})
})

//计时器结束
app.get('/timeUp', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user;
			gobangModel.findOne({
				'player.userId': userId
			}, function(err, doc) {
				let winner = '';
				let loser = '';
				doc.player.map(function(item) {
					if(item.userId != doc.current_player) {
						winner = item.userId
					}
				})
				doc.player.map(function(item) {
					if(item.userId == doc.current_player) {
						loser = item.userId
					}
				})
				gobangModel.update({
					'player.userId': userId
				}, {
					winner: winner
				}, function(err, doc) {})
				gobangRank(winner, loser);
			})
		}
		res.send({})
	})
})

//对局认输
app.get('/gameSurrender', function(req, res) {
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var gobangModel = require('./data_model/gobang_model');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc) {
			let userId = JSON.parse(doc.session).cur_user;
			gobangModel.findOne({
				'player.userId': userId
			}, function(err, doc) {
				let winner = '';
				let loser = '';
				doc.player.map(function(item) {
					if(item.userId != userId) {
						winner = item.userId
					}
				})
				doc.player.map(function(item) {
					if(item.userId == userId) {
						loser = item.userId
					}
				})
				gobangModel.update({
					'player.userId': userId
				}, {
					winner: winner
				}, function(err, doc) {})
				gobangRank(winner, loser);
			})
		}
		res.send({});
	})
})

//五子棋排行榜查询
app.get('/gobangRankQuery', function(req, res) {
	var myEventEmitter = new events.EventEmitter();
	var resData = {
		rank: [],
		arrAvatar: []
	}
	var gobangRankModel = require('./data_model/gobangRank_model');
	var userAvatar = require('./data_model/user_avatar');
	var obj;
	myEventEmitter.on('next', push);
	gobangRankModel.find().sort({
		winNumb: -1,
		loseNumb: 1
	}).limit(10).exec(function(err, doc) {
		if(doc) {
			resData.rank = doc;
			for(let i = 0; i < 3; i++) {
				if(doc[i]) {
					userAvatar.findOne({
						_id: doc[i].userId
					}, function(err, doc) {
						obj = doc;
						myEventEmitter.emit('next');
					})
				} else {
					obj = undefined;
					myEventEmitter.emit('next');
				}
			}
		}

	})

	function push() {
		resData.arrAvatar.push(obj)
		console.log(resData.arrAvatar)
		if(resData.arrAvatar.length == 3) {
			res.send(resData);
		}
	}

})

//管理员查询难度
app.get('/admin_diff_query', function(req, res) {
	var diff = require('./data_model/difficulty');
	diff.find({}, function(err, doc) {
		res.send(doc);
	})
})

//管理员删除难度
app.get('/admin_diff_delete', function(req, res) {
	var diff = require('./data_model/difficulty');
	diff.remove({
		_id: req.query.diffName
	}, function(err, doc) {
		res.send({
			msg: 'succ'
		})
	})

})

//管理员发布通知
app.post('/admin_notify_pub', function(req, res) {
	var notify = require('./data_model/notify_model');
	let no = new notify({
		pubDate: new Date(Date.now() + (8 * 60 * 60 * 1000)),
		content: req.body.content
	})
	no.save();
	res.send({
		msg: 'succ'
	});
})
//管理员获取通知
app.get('/admin_notify_query', function(req, res) {
	var notify = require('./data_model/notify_model');
	notify.find({}, function(err, doc) {
		res.send(doc);
	})
})

//管理员删除通知
app.get('/admin_notify_delete', function(req, res) {
	var notify = require('./data_model/notify_model');
	notify.remove({
		content: req.query.content
	}, function(err, doc) {
		res.send({
			msg: 'succ'
		})
	})
})

//管理员获取聊天室成员
app.get('/admin_chatMenber_query', function(req, res) {
	var chatMenber = require('./data_model/chatMenber_model');
	chatMenber.find({}, function(err, doc) {
		res.send(doc);
	})
})

//管理员聊天室操作
app.get('/admin_chatMenber_operate', function(req, res) {
	var chatMenber = require('./data_model/chatMenber_model');
	if(req.query.ope == 'ban') {
		chatMenber.update({
			userId: req.query.userId
		}, {
			isBanned: true
		}, function(err, doc) {
			res.send({
				msg: 'ban succ'
			})
		})
	} else if(req.query.ope == 'unban') {
		chatMenber.update({
			userId: req.query.userId
		}, {
			isBanned: false
		}, function(err, doc) {
			res.send({
				msg: 'unban succ'
			})
		})
	}
})

//管理员添加礼品
app.post('/admin_gift_pub',function(req,res){
	console.log(req.body)
	var giftModel = require('./data_model/gift_model');
	let gift = new giftModel({
		giftName:req.body.giftName,
		price:req.body.price
	})
	gift.save();
	res.send({msg:"succ"})
})

//查询礼品
app.get('/gift_query',function(req,res){
	var giftModel = require('./data_model/gift_model');
	giftModel.find({},function(err,doc){
		res.send(doc);
	})
})

//管理员礼品删除
app.get('/admin_gift_delete',function(req,res){
	var giftModel = require('./data_model/gift_model');
	giftModel.remove({giftName:req.query.giftName},function(err,doc){
		res.send({msg:'succ'})
	})
})

//用户提交礼品订单
app.post('/gift_order',function(req,res){
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Credentials', true);
	var sessionModel = require('./data_model/session_model');
	var orderModel = require('./data_model/order_model');
	var userInfo = require('./data_model/user_info');
	sessionModel.findOne({
		_id: req.session.id
	}, function(err, doc) {
		if(doc){
			let userId = JSON.parse(doc.session).cur_user;
			userInfo.findOne({_id:userId},function(err,doc){
				console.log(req.body)
				let data = JSON.parse(req.body.data)
				let level = doc.level-data.totalPrice;
				if(level>=0){
					userInfo.update({_id:userId},{level:level},function(err,doc){})
					let order = new orderModel({
						userId:userId,
						subDate:new Date(Date.now() + (8 * 60 * 60 * 1000)),
						state:'wait',
						content:data.content
					})
					order.save()
					res.send({msg:'succ'});
				}else{
					res.send({msg:'余额不足'});
				}
			})
			
		}else{
			res.send({msg:'noUser'});
		}
	})
})

//管理员订单查询
app.get('/order_query',function(req,res){
	var orderModel = require('./data_model/order_model');
	orderModel.find({},function(err,doc){
		res.send(doc);
	})
})

//管理员完成订单
app.post('/admin_order_finished',function(req,res){
	var orderModel = require('./data_model/order_model');
	console.log(req.body)
	orderModel.update(req.body,{state:'finished'},function(err,doc){
		res.send({msg:'succ'});
	})
})

//五子棋排行榜更新方法
function gobangRank(winner, loser) {
	var gobangRankModel = require('./data_model/gobangRank_model');
	var userInfo = require('./data_model/user_info');
	gobangRankModel.findOne({
		userId: winner
	}, function(err, doc) {
		if(doc) {
			gobangRankModel.update({
				userId: winner
			}, {
				'$inc': {
					'winNumb': 1
				}
			}, function(err, doc) {})
			userInfo.update({_id:winner},{'$inc':{'level':50}},function(err,doc){})
		} else {
			userInfo.findOne({
				_id: winner
			}, function(err, doc) {
				if(doc) {
					let rank = new gobangRankModel({
						userId: winner,
						winNumb: 1,
						loseNumb: 0,
						realname: doc.realname
					})
					rank.save();
				}
			})
			userInfo.update({_id:winner},{'$inc':{'level':50}},function(err,doc){})
		}
	})
	gobangRankModel.findOne({
		userId: loser
	}, function(err, doc) {
		if(doc) {
			gobangRankModel.update({
				userId: loser
			}, {
				'$inc': {
					'loseNumb': 1
				}
			}, function(err, doc) {})
		} else {
			userInfo.findOne({
				_id: loser
			}, function(err, doc) {
				if(doc) {
					let rank = new gobangRankModel({
						userId: loser,
						winNumb: 0,
						loseNumb: 1,
						realname: doc.realname
					})
					rank.save();
				}
			})
		}
	})
}

//通过一个定时触发器 定时检测聊天室内的人是否在线，否则移除聊天室
setInterval(function() {
	var sessionModel = require('./data_model/session_model');
	var chatMenber = require('./data_model/chatMenber_model');
	chatMenber.update({}, {
		isOnline: false
	}, {
		multi: true
	}, function(err, doc) {})
	sessionModel.find({}, function(err, doc) {
		for(let i = 0; i < doc.length; i++) {
			let userId = (doc[i].session.split('\"')[17])
			chatMenber.findOne({
				userId: userId
			}, function(err, doc) {
				if(doc) {
					chatMenber.update({
						userId: userId
					}, {
						isOnline: true
					}, function(err, doc) {})
				}
			})
		}
	})
}, 10000)

app.listen(3000, '0.0.0.0', function() {
	console.log('启动3000端口监听..');
})