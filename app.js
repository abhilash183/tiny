var express = require('express')
var routes = require('./routes');

var app = express();

app.configure(function() {
	app.set('port', 8080);
	app.set('host', '127.0.0.1');
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');

	app.use(express.logger('dev'));
	app.use(express.static(__dirname + '/public'));
	app.use(express.bodyParser());
	app.use(function(err, req, res, next){
		console.log(err);
		console.error(err.stack);
		res.err(err.toString());
	});
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

process.on('uncaughtException', function(err){
	console.log('got an error: %s', err.message);
	console.log('%s', err.stack);
});

//GET METHODS
app.get('/', routes.index);
app.get('/:tinyurl', routes.validate_tiny, routes.untiny, routes.respond);

//POST METHODS
app.post('/tiny', routes.validate_long, routes.tiny, routes.respond);

//PUT METHODS
app.put('/tiny', routes.validate_long, routes.tiny, routes.respond);

//DELETE METHODS
//TODO add delete methods

app.listen(app.get('port'), app.get('host'), function() {
	console.log('Express listening on ' + app.get('port') + ' on host ' + app.get('host'));
}); 
