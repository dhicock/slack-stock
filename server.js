var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var SlackClient = require('@slack/client').WebClient;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/stock', function(req, res){
	res.status(200);
	if(res.body.challenge){
		res.send(challenge);
		res.end();
	}
})