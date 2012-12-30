var redis = require('redis');
var events = require('events');
var crypto = require('crypto');
var logger = require('winston');
var util = require('./util.js');
var config = require('../config.js');

/**
 * This function is redis access layer. 
 * @param redis_host 
 * @param redis_port
 */
function redisDAL(redis_host, redis_port){
	this.redis_host = redis_host || config.localhost;
	this.redis_port = redis_port || config.redis_default_port;
	this.client = redis.createClient();

	this.client.on('error', function (err) {
		console.log('Error ' + err);
	});

	this.client.on('ready', function(){
		console.log('Redis is ready');
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
 * This method stores long_url on specific instance of database by generating
 * a tiny url;
 * @param long_url -- long_url to be made tiny
 * @param instance -- instance of db
 */
redisDAL.prototype.store_tiny = function(long_url, instance, callback){
	var self = this;
	var url_hash = util.hash_url(long_url);
	var key1 = String(instance) + config.COLON + config.CURRENT;
	var key2 = String(instance) + config.COLON + config.HASH + config.COLON;
	var new_tiny;

	self.client.get(key1, function(err, curr_tiny){
		if(err){
			logger.error('Error: ' + err);
			callback(err, null);	
		} else {
			if(!curr_tiny){
				curr_tiny = config.init_tiny;
				logger.warn('Current tiny_url not found: Init with ' + config.init_tiny);
			} else {
				logger.warn('Current tiny_url found:' + curr_tiny);
			}
			new_tiny = util.get_next_tiny(curr_tiny) + String(instance);
			if(new_tiny) { 
				logger.info('Newly generated tiny: ' + new_tiny);
				self.client.multi([
					['SET', key1, new_tiny],
					['HMSET', String(instance) + config.COLON + config.TINY + config.COLON
																							+ String(new_tiny), config.URL, long_url],
					['SET', String(instance) + config.COLON + config.HASH + config.COLON 
																							+ String(url_hash), new_tiny]
				]).exec(function(err, results){
					if(err){
						logger.error('Error: ' + err);
						callback(err, null);
					} else {
						//TODO  error checking
						callback(null, curr_tiny);	
					}
				});
			} else {
				logger.error('Error while generating new tiny: ' + new_tiny);
				callback('Error in generating next tiny', null);
			}
		}
	});

}

/**
 * This method fetches long_url from tiny_url from redis
 * @param tiny_url
 * @param instance -- instance of database // depends on how it is implemented
 */
redisDAL.prototype.fetch_tiny = function(tiny_url, instance, callback){
	var self = this;
	var key = String(instance) + config.COLON + config.redis_tiny_key 
																	+ config.COLON + String(tiny_url);

	logger.info('Redis query: ' + key);
	self.client.hgetall(key, function(err, results){
		if(err || !results || !(results.url)){
			logger.error('Error: ' + err);
			callback(err, null);	
		} else {
			logger.info(results.url);
			callback(null, results.url);	
		}
	})
}

module.exports = redisDAL;
