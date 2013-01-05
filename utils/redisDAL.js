var redis = require('redis');
var events = require('events');
var crypto = require('crypto');
var logger = require('tracer').colorConsole();
var util = require('./util.js');
var config = require('../config.js');

/**
 * This function is redis access layer. 
 * @param redis_host 
 * @param redis_port
 */
function redisDAL(redis_host, redis_port){
	var self = this;
	this.redis_host = redis_host || config.localhost;
	this.redis_port = redis_port || config.redis_default_port;
	this.client = redis.createClient();

	this.client.on('error', function (err) {
		console.error('Redis Error: ' + err);
	});

	this.client.on('ready', function(){
		logger.info('Redis is ready. Connected to ' + self.redis_host + ':' + self.redis_port);
	});
}

redisDAL.super_ = events.EventEmitter;
redisDAL.prototype = Object.create(events.EventEmitter.prototype, {
	constuctor: {
		value: redisDAL,
		enumerable: false
	}
});

/**
 * This method fetches currently stored tinyurl, so as to increment to the next 
 * one before storing next url.
 * @param instance -- database number;
 */
redisDAL.prototype.get_current_tinyurl = function(instance, callback){
	var self = this;
	var key = String(instance) + config.COLON + config.CURRENT;

	self.client.get(key, function(err, curr_tiny){
		if(err){
			logger.error('Error: ' + err);
			callback(err, null);
		} else {
			if(!curr_tiny){
				curr_tiny = config.init_tiny + String(instance);
				logger.warn('Current tiny_url not found: Init with ' + config.init_tiny);
			}
			callback(null, curr_tiny);
		}
	});
}

/**
 * This method stores url with its tiny_url. And stores currently used tinyurl
 * so that next tinyurl will be an increment of current one
 * @param url -- url to be stored
 * @param tiny_url -- tiny_url to be stored as
 * @param instance -- database number
 * @param url_hash -- md5sum hash of url
 */
redisDAL.prototype.store_url = function(url, tiny_url, instance, url_hash, callback){
	//TODO: Error checks
	var key = String(instance) + config.COLON + config.CURRENT;
	if(!tiny_url){
		callback('Error', null);
		return;
	}

	this.client.multi([
		['SET', key, tiny_url],
		['HMSET', String(instance) + config.COLON + config.TINY + config.COLON
																							+ String(tiny_url), config.URL, url],
		['SET', String(instance) + config.COLON + String(url_hash), tiny_url]
	]).exec(function(err, results){
		if(err){
			logger.error('Error: ' + err);
			callback(err, null);
		} else {
			callback(null, true);
		}
	});
}

			//new_tiny = util.get_next_tiny(curr_tiny) + String(instance);

/**
 * This method fetches long_url from tiny_url from redis
 * @param tiny_url
 * @param instance -- instance of database // depends on how it is implemented
 */
redisDAL.prototype.find_tinyurl = function(tiny_url, instance, callback){
	var self = this;
	var key = String(instance) + config.COLON + config.redis_tiny_key 
																	+ config.COLON + String(tiny_url);

	logger.info('Searching for tiny_url ' + tiny_url + ' on instance ' + instance);
	self.client.hgetall(key, function(err, results){
		if(err){
			logger.error('Error: ' + err);
			callback(err, null);	
		} else {
			if(results && results.url){
				callback(null, results.url);	
			} else {
				logger.warn('No tiny found for query: ' + key + ' returning empty results');
				callback(null, null);
			}
		}
	})
}

/**
 * This function checks to see if url already exists, to avoid any duplication
 * @param long_hash -- hash of the url
 * @param instance -- instance number of url
 */
redisDAL.prototype.check_url_exists = function(long_hash, instance, callback){
	var self = this;
	var key = String(instance) + config.COLON + long_hash; 

	self.client.get(key, function(err, results){
		if(err) {
			logger.error('Error: ' + err);
			callback(err, null);
		} else if(results) {
			callback(null, results);
		} else {
			callback(null, null);	
		}
	});
}

/**
 * This method checks if tinyurl already exists on specified instance
 * @param tiny_url -- tiny_url looking for;
 * @param instance -- instance number for database
 */
redisDAL.prototype.check_tinyurl_exists = function(tiny_url, instance, callback){
	var self = this;
	var key = String(instance) + config.COLON + config.TINY + config.COLON + tiny_url;

	self.client.hgetall(key, function(err, results){
		if(err){
			logger.error('Error: ' + err);
			callback(err, null);
		} else if (results){
			callback(null, true);
		} else {
			callback(null, false);
		}
	});
}

module.exports = redisDAL;
