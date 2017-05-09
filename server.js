var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var SlackClient = require('@slack/client').WebClient;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var port = process.env.PORT || 8081;
var token = process.env.SLACK_API_TOKEN;
var regexPattern = new RegExp(/\$[A-Za-z]+/);

app.post('/stock', function(req, res){
	res.status(200);
	console.log('Message received!\nMessage: '+JSON.stringify(req.body));
	var challenge = req.body.challenge;
	if(challenge){
		res.send(challenge);
	}
	var text = req.body.text;
	if(!text || text.len == 0){
		res.end();
		return;
	}
	var stockArr = text.match(regexPattern);
	if(!stockArr || stockArr.len == 0){
		res.end();
		return;
	}
	var channel = req.body.channel;
	res.send(text);
	res.end();
})

var server = app.listen(port, function() {
	var port = server.address().port;

	console.log("listening at port %s", port);
})