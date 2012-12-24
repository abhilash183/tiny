var url = require('url');
var MAX_INSTANCE = 10;

exports.verify_url = function(long_url){
	//TODO
	return true;
}

exports.compute_url_instance = function(long_url){
	var parsed_url = url.parse(long_url, false, false);
	var instance_number = (long_url.length + parsed_url.pathname.length)%10 + 1;

	return instance_number;
}
