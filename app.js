var express = require('express'),
	routes = require('./routes'),
	config = require('./config.js');

var app = express();

app.configure(function() {
	app.set('port', 8081);
	app.set('host', '127.0.0.1');
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');

	app.use(express.logger('dev'));
	app.use(express.static(__dirname + '/public'));
	app.use(express.bodyParser());
	app.use(function(err, req, res, next){
		console.log(err);
		console.error(err.stack);
		res.send(500, config.INTERNAL_SERVER_ERROR);
	});
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

process.on('uncaughtException', function(err){
	console.log('got an error: %s', err.message);
	console.log('%s', err.stack);
});

//Web calls
app.get('/', routes.index);
app.get('/:tinyurl', routes.validate_tinyurl, routes.find_tinyurl, routes.redirect);

//API calls
app.get('/dev/:tinyurl', routes.api_request, routes.validate_tinyurl, routes.find_tinyurl, routes.respond);
app.put('/dev/tiny', routes.api_request, routes.validate_url, routes.check_url_exists, routes.get_next_tinyurl, routes.store_url, routes.respond);

app.listen(app.get('port'), app.get('host'), function() {
	console.log('Express listening on ' + app.get('port') + ' on host ' + app.get('host'));
}); 
