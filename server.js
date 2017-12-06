var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var SlackClient = require('@slack/client').WebClient;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var port = process.env.PORT || 8081;
var token = process.env.SLACK_API_TOKEN;
var regexPattern = /\${2,}[A-Za-z\./-]+[A-Za-z]+/g;
var linkUrl = 'https://finance.google.com/finance?q=';
var imgUrl = 'http://markets.money.cnn.com/services/api/chart/snapshot_chart_api.asp?symb=';


app.post('/stock', function(req, res){
	res.status(200);
	//console.log('Message received!\nMessage: '+JSON.stringify(req.body));
	var challenge = req.body.challenge;
	var user = req.body.event.user;
	var dhicock = user === 'U4PB2SH28';
	if(challenge){
		res.send(challenge);
	}
	var text = req.body.event.text;
	if(dhicock){
		console.log(text);
	}
	if(!text || text.len == 0){
		//console.log('no text found');
		if(dhicock){
			console.log('no text');
		}
		res.end();
		return;
	}
	var stockArr = text.match(regexPattern);
	if(!stockArr || stockArr.length == 0){
		//console.log('no stocks found');
		if(dhicock){
			console.log('no stocks');
		}
		res.end();
		return;
	}
	var channel = req.body.event.channel;
	var ts = req.body.event.ts;

	var web = new SlackClient(token);
	web.chat.postMessage(channel, '', loading(), function(err, res){
		if(err){
			console.log('Error: ' + err);
			console.log('message: ' + JSON.stringify(loading()));
		}else {
			//console.log('Message Sent: ', res);
		}
	});

	if(dhicock){
		//console.log('body:'+JSON.stringify(req.body.event));
	}
	var symbols = [];
	stockArr.forEach(function(element) {
		var elem = element.replace(/\$+/, '').replace(/[\./]/, '-');
		if(dhicock){
			//console.log('element: '+ element + ">" + elem);
		}
		symbols.push(elem);
	});
	var tickers = symbols.join(',');
	if(dhicock){
		console.log(tickers);
	}

	var url = getApiUrl(tickers);
	request(url, function(error, response, body){
		if(error){
			console.log('error=%s', error);
			res.status(500).end();
			return;
		}
		if(response){
			if(dhicock){
				//console.log(response.body);
			}
			var json = JSON.parse(response.body);
			if(!json){
				return;
			}
			var formattedJson = formatForSlack(json);
			formattedJson['channel']=channel;
			formattedJson['thread_ts']=ts;
			if(dhicock){
				console.log('ts:'+ts);
			}
			//console.log(formattedJson);
			//var web = new SlackClient(token);
			web.chat.postMessage(channel, '', formattedJson, function(err, res){
				if(err){
					console.log('Error: ' + err);
					console.log('message: ' + JSON.stringify(formattedJson));
				}else {
					//console.log('Message Sent: ', res);
				}
			});
		}
	})
	res.end();
})

function loading(){
	var formattedJson = {};
	formattedJson['as_user'] = false;
	formattedJson['attachments'] = [];
	formattedJson['reply_broadcast'] = "false";
	formattedJson['text'] = 'Looking that up for you';
	return formattedJson;
}

function formatForSlack(json, response_type){
	var formattedJson = {};
	formattedJson['as_user'] = false;
	formattedJson['attachments'] = [];
	formattedJson['reply_broadcast'] = "false";
	var attachment = processElement(json);
	formattedJson.attachments.push(attachment);
	return formattedJson;
}

function processElement(element){
	var attachment = {};
	var stockdata = element["Time Series (1min)"];
	var metadata = element["Meta Data"];
	var ticker = metadata["2. Symbol"];
	var lastRefresh = metadata["3. Last Refreshed"];
	var close = stockdata[lastRefresh]["4. close"];
	var volume = stockdata[lastRefresh]["5. volume"];
	var open = stockdata[lastRefresh]["1. open"];

	var stockUrl = imgUrl + ticker.replace(/[\./-]/,'');

	attachment['title'] = "Stock Information for " + lastRefresh;
	attachment['title_link'] = linkUrl + ticker;
	attachment['fields'] = [
		{
			"title": "Ticker",
			"value": ticker,
			"short": true
		},
		{
			"title": "Open",
			"value": open,
			"short": true
		},
		{
			"title": "Close",
			"value": close,
			"short": true
		},
		{
			"title": "Volume",
			"value": volume,
			"short": true
		}
	];
	attachment['footer'] = 'Data from Alpha Vantage';
	attachment["image_url"] = stockUrl;
	return attachment;
}

function getApiUrl(symb){
	var url = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol='+encodeURIComponent(symb)+'&interval=1min&apikey=BKGR63Q1T8ZE2YTF';
	return url;
}

var server = app.listen(port, function() {
	var port = server.address().port;

	console.log("listening at port %s", port);
})