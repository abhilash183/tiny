var config = {}


//Constant Strings
config.ERROR = 'error';
config.INTERNAL_SERVER_ERROR = 'Internal Server Error';
config.INVALID_URL = 'Invalid URL';
config.TINY = 'tiny';
config.LONG = 'long';
config.TINYURL_REQUIRED = 'Tiny URL invalid';
config.COLON = ':';
config.CURRENT = 'current';
config.URL = 'url';

//Config properties
config.localhost = '127.0.0.1'
config.redis_default_port = 6379;
config.domain_name = 'curt.be/'
config.tiny_max_length = 6;
config.max_instance = 10;
config.url_hash_encode = 'base64';
config.redis_tiny_key = 'tiny';
config.init_tiny = 'AAAA';

module.exports = config;
