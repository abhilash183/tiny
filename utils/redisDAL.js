var redis = require('redis');
var events = require('events');
var util = require('./util.js');
var crypto = require('crypto');
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
 * This method stores long_url on specific instance of database by generating a
 * tiny url.
 * @param long_url -- long_url to be made tiny
 * @param instance_num -- instance of db
 */
redisDAL.prototype.store_tiny = function(long_url, instance_num, callback){
	var self = this;
	var curr_tiny_query = String(instance_num) + ':current';
	var new_tiny = '';
	var shasum = crypto.createHash('md5');
	shasum.update(long_url);
	var url_hash = shasum.digest('base64')

	self.client.get(curr_tiny_query, function(err, results){
		if(err){
			//TODO:	
		} else {
			new_tiny = util.get_next_tiny(results);
			console.log(new_tiny);
			//TODO: tiny redundancies 
			self.client.multi([
				['HMSET', String(instance_num) + ':tiny:' + String(new_tiny), 'url', long_url],
				['SET', String(instance_num) + ':hash:' + String(url_hash), new_tiny]
			]).exec(function(err, results2){
				if(err){
					console.log(err);
				} else {
					console.log(results2)	
				}
			});
		}
	});
	callback(null, 123);
}

redisDAL.prototype.fetch_tiny = function(tiny_url, instance_num, callback){
	var self = this;

	self.client.hgetall(String(instance_num) + ':tiny:' + String(tiny_url), function(err, results){
		if(err){
			//TODO
		} else {	
			callback(null, results.url);
		}
	});
}

module.exports = redisDAL;
