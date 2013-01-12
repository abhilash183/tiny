/*** XMLHTTPRequest Call ***/
function Request(function_name, opt_argv){
	var callback = null;
	var len;
	var async;
	var params;
	var body;
	var req;

	if(!opt_argv)
		opt_argv = new Array();
	
	len = opt_argv.length;
	if(len > 0 && typeof opt_argv[len-1] == 'function'){
		callback = opt_argv[len-1];
		opt_argv.length--;
	}

	async = (callback != null);

	body = JSON.stringify(opt_argv[0]);

	req = new XMLHttpRequest();
	req.open('POST', '/rpc/tiny', async); 

	req.setRequestHeader('Content-type', 'application/json');


	if(async){
		req.onreadystatechange = function(){
			if(req.readyState == 4 && req.status == 200){
				var response = null;
				try {
					response = JSON.parse(req.responseText);
				} catch(e){
					response = req.responseText;
				}
				callback(response);
			}
		}
	}

	req.send(body);
}

function setup(obj, name){
	obj[name] = function(){ Request(name, arguments)}
}


/** client side functions ***/
function get_tinyurl(){
	var url_doc = document.forms['tiny-form']['long-url'],
		alias_doc = document.forms['tiny-form']['longurl-alias'],
		url = url_doc.value,
		alias = alias_doc.value,
		alias_pattern = /^[A-Za-z\-]+$/,
		error_classname = 'error1234445',
		request = {},
		args = [];

	//TODO check here -- var url_pattern = //;

	if(!url){
		add_error('url cannot be empty!!')
		return false;
	}

	if(alias && !alias.match(alias_pattern)){
		add_error('Only alphabets and `-` are allowed for alias')
		return false
	}

	request.url = url;
	request.alias = alias;

	args.push(request);
	args.push(callback);

	server.FetchTinyURL.apply(this, args);

	//make rpc instead of post via form
	return false;
}

function add_error(message){
	var error_elem = document.getElementById('tiny-form-head').getElementsByClassName('input-error')[0];
	error_elem.innerHTML = message;
}

function create_tinyurl_doc(response){
	var form_doc = document.forms['tiny-form'];

	var anchor_elem = document.createElement('a');
	anchor_elem.id = 'tiny_url';
	anchor_elem.href = 'http://' + response.tiny_url;
	anchor_elem.innerHTML = response.tiny_url;

	var center_elem = document.createElement('center');
	center_elem.appendChild(anchor_elem);

	form_doc.appendChild(center_elem);
}

/** RPC Callbacks ***/
function callback(response){
	//clear any errors
	add_error('');

	if(response){
		if(response.tiny_url){
			var tinyurl_doc = document.getElementById('tiny_url');
			if(tinyurl_doc){
				tinyurl_doc.href = 'http://' + response.tiny_url;
				tinyurl_doc.innerHTML = response.tiny_url;
			} else {
				create_tinyurl_doc(response);
			}
		} else if(response.error){
			add_error(response.error);
		}
	} else {
		add_error('Internal Server Error');
	}
}

//global setup
var server = {}
setup(server, 'FetchTinyURL');
