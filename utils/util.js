var url = require('url');
var crypto = require('crypto');
var config = require('../config.js');
var chars = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

//TODO: rethink
function incr_next(tiny, position){
	var item = tiny[position];
	if(position < 0){
		return tiny.substr(0, position) + chars[0] + tiny.substr(position + 1, tiny.length)
	} else if (chars.indexOf(item) === (chars.length - 1)){
		tiny = tiny.substr(0, position) + chars[0] + tiny.substr(position + 1, tiny.length)
		return incr_next(tiny, position - 1)
	} else { 
		tiny = tiny.substr(0, position) + chars[chars.indexOf(item) + 1] + tiny.substr(position + 1, tiny.length)
		return tiny;
	}
}

/**
 * This method validates a url. 
 * @param long_url -- url to be validated
 * @return validity
 */
exports.validate_long = function(long_url){
	var parsed_url = url.parse(long_url);
	if(parsed_url && parsed_url.host){
		//TODO: check for valid string
		return true;
	} else {
		return false;
	}
}

/**
 * This method validates tiny_url.
 * @param tiny -- tiny url path(not entire url);
 * @return validity
 */
exports.validate_tiny = function(tiny){
	if(tiny && typeof(tiny) === 'string'
		&& tiny.length <= config.tiny_max_length
		&& (!isNaN(parseInt(tiny[tiny.length - 1])))) {
		//TODO: check for valid string
		return true;	
	} else {
		return false;
	}
}

exports.validate_alias = function(tiny){
	//TODO: check for valid string
	return false;
}

/**
 * This method generates md5 hash of url
 * @param url -- to hash
 * @return md5hash
 */
exports.hash_url = function(url){
	var md5sum = crypto.createHash('md5');
	md5sum.update(url);
	return md5sum.digest(config.url_hash_encode);
}


/**
 * This method generates an instance id for each url. Benefit of generating 
 * such id is division of urls into various database instances.
 * @param long_url -- url to be processed
 * @return instance_number -- a db number under which each url lands into 
 */
exports.compute_url_instance = function(long_url){
	var parsed_url = url.parse(long_url, false, false);
	
	//1 - 9, 0 is reserved for alias
	return (long_url.length + parsed_url.pathname.length)%9 + 1;
}

/**
 * Each tiny url is a combination of [A-Za-z0-9] of few chars long. In order to 
 * avoid clashes while generating tiny_urls, I am rolling out in a incremental 
 * fashion. Starting from 0, 1, .. A, B .. 0A, .. zz, .. 000, 001, .. zzz, so on.
 * @param tiny_url -- tiny url to be incremented
 */
exports.get_next_tiny = function(tiny_url){
	var i = 0;
	if(!tiny_url){
		return null;
	}

	tiny_url = tiny_url.slice(0, tiny_url.length - 1);
	return incr_next(tiny_url, tiny_url.length - 1);
}
