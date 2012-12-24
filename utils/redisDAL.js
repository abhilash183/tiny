var redis = require('redis'),
		client = redis.createClient();

client.on('error', function (err) {
	console.log('Error ' + err);
});

client.on('ready', function(){
	console.log('Redis is ready');
});


//exports

