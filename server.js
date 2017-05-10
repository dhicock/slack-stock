var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var SlackClient = require('@slack/client').WebClient;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var port = process.env.PORT || 8081;
var token = process.env.SLACK_API_TOKEN;
var regexPattern = /\$[A-Za-z]+/g;
var apiUrl = 'http://finance.google.com/finance/info?client=ig&q=NASDAQ%3A';
var linkUrl = 'https://finance.yahoo.com/quote/';
var imgUrl = 'http://markets.money.cnn.com/services/api/chart/snapshot_chart_api.asp?symb=';

app.post('/stock', function(req, res){
	res.status(200);
	//console.log('Message received!\nMessage: '+JSON.stringify(req.body));
	var challenge = req.body.challenge;
	if(challenge){
		res.send(challenge);
	}
	var text = req.body.event.text;
	if(!text || text.len == 0){
		//console.log('no text found');
		res.end();
		return;
	}
	var stockArr = text.match(regexPattern);
	if(!stockArr || stockArr.length == 0){
		//console.log('no stocks found');
		res.end();
		return;
	}
	var channel = req.body.event.channel;
	var ts = req.body.event.thread_ts;
	var symbols = [];
	stockArr.forEach(function(element) {
		symbols.push(element.substring(1));
	});
	var tickers = symbols.join(',');
	var url = apiUrl + tickers;
	request(url, function(error, response, body){
		if(error){
			console.log('error googleapi=%s', error);
			res.status(500).end();
			return;
		}
		if(response){
			//console.log(response.body);
			var json = JSON.parse(response.body.replace('//', ''));
			var formattedJson = formatForSlack(json);
			formattedJson['channel']=channel;
			formattedJson['thread_ts']=ts;
			//console.log(formattedJson);
			var web = new SlackClient(token);
			web.chat.postMessage(channel, '', formattedJson, function(err, res){
				if(err){
					console.log('Error: ' + err);
				}else {
					//console.log('Message Sent: ', res);
				}
			});
		}
	})
	res.end();
})

function formatForSlack(json, response_type){
	var formattedJson = {};
	formattedJson['as_user'] = false;
	formattedJson['attachments'] = [];
	//formattedJson['response_type'] = response_type || 'in_channel';
	json.forEach(function(element){
		var attachment = {};
		var change = element.c;
		var changePerc = element.cp;
		var price = element.l;
		var afterHoursPrice = element.el;
		var ticker = element.t;

		var stockUrl = imgUrl + element.t;

		if(changePerc >= 0){
			attachment['color'] = 'good';
		} else{
			attachment['color'] = 'danger';
		}
		attachment['title'] = "Stock Information for " + ticker;
		attachment['title_link'] = linkUrl + ticker;
		attachment['text'] = "5 day chart";
		attachment['fields'] = [
			{
				"title": "Ticker",
				"value": ticker,
				"short": true
			},
			{
				"title": "Current Price",
				"value": price,
				"short": true
			},
			{
				"title": "Change",
				"value": change,
				"short": true
			},
			{
				"title": "Percent Change",
				"value": changePerc,
				"short": true
			}
		];
		attachment['footer'] = 'Data from Google Finance';
		if(afterHoursPrice){
			attachment['fields'].push({
				"title": "After Hours Price",
				"value": afterHoursPrice,
				"short":true
			});
		}
		attachment["image_url"] = stockUrl;
		formattedJson.attachments.push(attachment);
	});
	return formattedJson;
}

var server = app.listen(port, function() {
	var port = server.address().port;

	console.log("listening at port %s", port);
})