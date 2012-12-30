var util = require('../utils/util.js');
var redisDAL = require('../utils/redisDAL.js');
var logger = require('tracer').colorConsole();
var config = require('../config.js');

var redis = new redisDAL();

exports.index = function(req, res){
	res.render('index');
}

/**
 * This method sets the response params which used by exports.respond to send the 
 * response
 * @param req -- request
 * @param level -- type of message to respond
 * @param message -- message to be responded
 */
function set_response(req, level, message) {
	if(level === 'error'){
		req.has_errors = true;
		req.errors = {};
		req.errors[level] = message;
	} else {
		req.response = {};
		req.response[level] = message;
	}
}

/**
 * Method to verify if the url passed to tiny is valid 
 * @param url -- url to be shortened
 */
exports.validate_long = function(req, res, next) {
	var url = req.body.url;
	if(url && typeof(url) == 'string'
				&& util.validate_long(url)){
		logger.info('Url requested to tiny: ' + url);
		req.long_url = url;	
		req.instance = util.compute_url_instance(req.long_url);
		next();
	} else {
		logger.error('Url requested to tiny doesn\'t seem to be valid: ' + url);
		set_response(req, config.ERROR, config.INVALID_URL);
		exports.respond(req, res);
	}
}

/**
 * This method validates the tiny_url 
 * @param req.params.tinyurl -- expects tinyurl to be present in the request
 */
exports.validate_tiny = function(req, res, next){
	var tiny_url = req.params.tinyurl;
	var is_invalid = true;
	if(util.validate_tiny(tiny_url)){
		req.tiny_url = tiny_url;	
		req.instance = parseInt(req.tiny_url[req.tiny_url.length - 1]);
		if(!isNaN(req.instance)){
			logger.info('Tiny url requested: ' + tiny_url);
			is_invalid = false;
			next();
		}
	}

	if(is_invalid){
		logger.warn('Tiny url requested isn\'t a valid construct: ' + tiny_url);
		set_response(req, config.ERROR, config.TINYURL_INVALID);
		exports.respond(req, res);
	}
}

/**
 * This method converts the long_url to tiny_url and requests the redis server
 * to store it.
 * @param req.long_url -- expects long_url to be present from verify() function
 * @param req.instance -- instance number for the url
 */
exports.tiny = function(req, res, next){
	var url_hash = util.hash_url(req.long_url);

	if(url_hash) {
		redis.check_url_exists(url_hash, req.instance, function(err1, tiny1){
			if(err1){
				set_response(req, config.ERROR, config.INTERNAL_SERVER_ERROR);
				next();
			} else if (tiny1) { 
				logger.info('Found existing tiny for url ' + req.long_url);
				set_response(req, config.TINY_URL, config.domain_name + tiny1);	
				next();
			} else {
				redis.store_tiny(req.long_url, req.instance, url_hash, function(err2, tiny2){
					if(err2 || !tiny2){
						set_response(req, config.ERROR, config.INTERNAL_SERVER_ERROR);
					} else {
						set_response(req, config.TINY_URL, config.domain_name + tiny2);
					}
					next();
				});
			}
		});
	} else {
		set_response(req, config.ERROR, config.INTERNAL_SERVER_ERROR);
		next();
	}
}

/**
 * This method serves the purpose of converting tiny_url to long_url 
 * @param req.tiny_url -- expects tinyurl to be present in the request
 * @param req.instance -- instance number for the tiny_url;
 */
exports.untiny = function(req, res, next){
	redis.fetch_tiny(req.tiny_url, req.instance, function(err, long_url){
		if(err){
			set_response(req, config.ERROR, config.INTERNAL_SERVER_ERROR);
		} else if(long_url){
			set_response(req, config.URL, long_url);
		} else {
			set_response(req, config.ERROR, config.INVALID_URL);
		}
		next();
	});
}

/**
 * This method exports respond function, which is the end point for every
 * API call. Returns error in case of errors, appropriate response otherwise 
 * @param req.has_errors -- indicates if response include errors
 * @param req.errors -- json object which includes errors if at all 
 * @param req.response -- json response wrt the request
 * TODO: check if the response objects are valid
 */
exports.respond = function(req, res){
	if(req.has_errors){
		logger.error('Sending error response: ' + JSON.stringify(req.errors));
		res.json(req.errors);
	} else {
		logger.info('Sending response: ' + JSON.stringify(req.response));
		res.json(req.response);
	}
}
