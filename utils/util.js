var url = require('url');
var MAX_INSTANCE = 10;

/**
 * This method parses url and confirms if url is valid. Possible check with
 * internet services line ALEXA ranking, Google DNS, so on.. 
 * @param long_url -- url to be processed
 * @return validity
 */
exports.verify_url = function(long_url){
	//TODO
	return true;
}

/**
 * This method generates an instance id for each url. Benefit of generating 
 * such id is division of urls into various database instances.
 * @param long_url -- url to be processed
 * @return instance_number
 */
exports.compute_url_instance = function(long_url){
	var parsed_url = url.parse(long_url, false, false);
	var instance_number = (long_url.length + parsed_url.pathname.length)%10;

	return instance_number;
}

/**
 * Each tiny url is a combination of [A-Za-z0-9] of few chars long. In order to 
 * avoid clashes while generating tiny_urls, I am rolling out in a incremental 
 * fashion. Starting from 0, 1, .. A, B .. 0A, .. zz, .. 000, 001, .. zzz, so on.
 * @param tiny_url -- tiny url to be incremented
 */
exports.increment_tiny = function(tiny_url){
	return "AAAAA1";
}
