var util = require('../utils/util.js');
var redisDAL = require('../utils/redisDAL.js');
var logger = require('tracer').colorConsole();
var config = require('../config.js');

var redis = new redisDAL();

exports.index = function(req, res){
	res.render('index', {title: 'curt.be - a URL shortener', tiny_url: req.tiny_url});
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
 * This method sets type of call to api. Which is useful since both
 * web and api are treated by same code base
 */
exports.api_request = function(req, res, next){
	req.is_api = true;
	next();
}

/**
 * Method to verify if the url passed to tiny is valid 
 * @param url -- url to be shortened
 */
exports.validate_url = function(req, res, next) {
	var url = req.body.url;
	var alias = req.body.alias;
	var valid_alias = true;

	if(url && typeof(url) === 'string'
				&& util.validate_long(url)){
		logger.info('Url requested to tiny: ' + url);
		if(alias){
			if(util.validate_alias(alias)){
				req.url_alias = alias;
				req.instance = 0;
			} else {
				logger.error('Url Alias requested isn\'t in correct format: ' + alias);
				set_response(req, config.ERROR, config.INVALID_ALIAS);
				exports.respond(req, res);
				valid_alias = false;
			}
		}
		if(valid_alias){
			req.long_url = url;	
			if(!alias) {
				req.instance = util.compute_url_instance(req.long_url);
			}
			next();
		}
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
exports.validate_tinyurl = function(req, res, next){
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

exports.check_url_exists = function(req, res, next){
	req.url_hash = util.hash_url(req.long_url);

	if(req.url_hash) {
		redis.check_url_exists(req.url_hash, req.instance, function(err, tiny_url){
			if(err){
				set_response(req, config.ERROR, config.INTERNAL_SERVER_ERROR);
				next();
			} else if (tiny_url) {
				logger.info('Found existing tiny: ' + tiny_url + ' for url: ' + req.long_url);
				set_response(req, config.TINY_URL, config.domain_name + tiny_url);	
				req.tiny_url = tiny_url;
				next();
			} else if(req.url_alias){
				redis.check_tinyurl_exists(req.url_alias, req.instance, function(err, flag) {
        	if(err) {
						set_response(req, config.ERROR, config.INTERNAL_SERVER_ERROR);
					} else if(flag){
						set_response(req, config.ERROR, config.ALIAS_ALREADY_EXISTS);
						res.tiny_url = req.url_alias;
					} else {
						req.tiny_url = req.url_alias;	
					}
					next();
				})
			} else {
				next();
			}
		});
	} else { 
		set_response(req, config.ERROR, config.INTERNAL_SERVER_ERROR);
		next();
	}
}

exports.get_next_tinyurl = function(req, res, next){
	if(req.tiny_url || req.has_errors || req.url_alias){
		next();
	} else {
		redis.get_current_tinyurl(req.instance, function(err, curr_tinyurl) {
			if(err || !curr_tinyurl){
				set_response(req, config.ERROR, config.INTERNAL_SERVER_ERROR);
			} else {
				req.tiny_url = util.get_next_tiny(curr_tinyurl) + String(req.instance);
			}
			next();
		});
	}
}

exports.store_url = function(req, res, next) {
	if(req.has_errors){
		next();
	} else {
		redis.store_url(req.long_url, req.tiny_url, req.instance, req.url_hash, function(err2, flag){
			if(err2 || !flag){
				set_response(req, config.ERROR, config.INTERNAL_SERVER_ERROR);
			} else {
				set_response(req, config.TINY_URL, config.domain_name + req.tiny_url);
			}
			next();
		});
	}
}

/**
 * This method serves the purpose of converting tiny_url to long_url 
 * @param req.tiny_url -- expects tinyurl to be present in the request
 * @param req.instance -- instance number for the tiny_url;
 */
exports.find_tinyurl = function(req, res, next){
	redis.find_tinyurl(req.tiny_url, req.instance, function(err, long_url){
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
		if(req.is_api){
			logger.info('Sending response: ' + JSON.stringify(req.response));
			res.json(req.response);
		} else {
			req.tiny_url = req.response.tiny_url
			exports.index(req, res)
		}
	}
}

/**
 *
 *
 */
exports.redirect = function(req, res) {
	res.redirect(req.response.url);
}
