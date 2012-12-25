var redis = require('redis');
var events = require('events');
var util = require('./util.js');

function redisDAL(redis_host, redis_port){
	this.redis_host = redis_host || '127.0.0.1';
	this.redis_port = redis_port || 6379;
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

redisDAL.prototype.store_tiny = function(long_url, instance_num, callback){
	var self = this;
	var curr_tiny_query = String(instance_num) + ':current';
	var new_tiny = '';
	self.client.get(curr_tiny_query, function(err, results){
		if(err){
			//TODO:	
		} else {
			new_tiny = util.get_next_tiny(results);
			/*self.client.multi([
			]).exec(function(err, results){
				if(err){
				
				} else {
				
				}
			});*/
		}
	});



	callback(null, 123);
}

module.exports = redisDAL;
