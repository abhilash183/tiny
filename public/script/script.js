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

/********* RPC functions *************/
function get_tinyurl(){
	var url = document.forms['tiny-form']['long-url'].value;
	var alias = document.forms['tiny-form']['longurl-alias'].value;
	var request = {};
	var args = [];

	//TODO check here -- var url_pattern = //;
	var alias_pattern = /[^\w]/;

	if(!url){
		//TODO
		return false;
	}

	if(!alias || !alias.match(/^[A-Za-z\-]+$/)){
		return false
	}

	request.url = url;
	request.alias = alias;

	args.push(request);
	args.push(callback);

	server.FetchTinyURL.apply(this, args);

	return false;
}

function callback(response){
	if(response && response.tiny_url){
		var tinyurl_doc = document.getElementById('tiny_url');
		if(tinyurl_doc){
			tinyurl_doc.href = 'http://' + response.tiny_url;
			tinyurl_doc.innerHTML = response.tiny_url;
		} else {
			create_tinyurl_doc(response);
		}
	} else {
		//TODO: invalid url
	}
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

//global setup
var server = {}
setup(server, 'FetchTinyURL');
