var url = require('url');
var check = require('validator').check();
var config = require('../config.js');

/**
 * This method validates a url. 
 * @param long_url -- url to be validated
 * @return validity
 */
exports.validate_long = function(long_url){
	if(check(long_url).isUrl()){
		return true;
	} else {
		return false;
	}
}

/**
 * This method validates tiny_url.
 * @param tiny -- tiny url path(not entire url);
 */
exports.validate_tiny = function(tiny){
	if(tiny && typeof(tiny) === 'string'
		&& tiny.length <= config.tiny_max_length
		&& (!isNaN(parseInt(tiny[tiny.length - 1])))) {
		return true;	
	} else {
		return false;
	}
}

/**
 * This method generates an instance id for each url. Benefit of generating 
 * such id is division of urls into various database instances.
 * @param long_url -- url to be processed
 * @return instance_number -- a db number under which each url lands into 
 */
exports.compute_url_instance = function(long_url){
	var parsed_url = url.parse(long_url, false, false);
	
	return (long_url.length + parsed_url.pathname.length)%10;
}

/**
 * Each tiny url is a combination of [A-Za-z0-9] of few chars long. In order to 
 * avoid clashes while generating tiny_urls, I am rolling out in a incremental 
 * fashion. Starting from 0, 1, .. A, B .. 0A, .. zz, .. 000, 001, .. zzz, so on.
 * @param tiny_url -- tiny url to be incremented
 */
exports.get_next_tiny = function(tiny_url){
	return "AAAAA8";
}
