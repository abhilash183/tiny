var util = require('../utils/util.js');
var redisDAL = require('../utils/redisDAL.js');

// exports
exports.index = function(req, res){
	res.render('index');
}

exports.authenticate = function(req, res, next){

}

exports.verify =  function(req, res, next){
	var url = req.body.url;
	if(url && typeof(url) == 'string'){
		if(util.verify_url(url)){
			req.long_url = url;
			next();
		} else {
			req.has_errors = true;
			req.errors = {'error': 'invalid url'}
			exports.respond(req, res);
		}
	}
}

exports.tiny = function(req, res, next){
	var instance_num = util.compute_url_instance(req.long_url);


	next();
}

exports.untiny = function(req, res, next){

}

exports.respond = function(req, res){
	if(req.has_errors){
		res.json(req.errors);
	} else {
		//TODO:
		res.send('Success')
	}
}
