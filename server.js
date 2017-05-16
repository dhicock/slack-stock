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
var linkUrl = 'https://finance.yahoo.com/quote/';
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
		//console.log(tickers);
	}
	var url = getApiUrl(tickers);
	request(url, function(error, response, body){
		if(error){
			console.log('error yahooapi=%s', error);
			res.status(500).end();
			return;
		}
		if(response){
			if(dhicock){
				console.log(response.body);
			}
			var json = JSON.parse(response.body);
			if(!json || !json.query || !json.query.results || !json.query.results.quote){
				return;
			}
			var formattedJson = formatForSlack(json.query.results.quote);
			formattedJson['channel']=channel;
			formattedJson['thread_ts']=ts;
			if(dhicock){
				console.log('ts:'+ts);
			}
			//console.log(formattedJson);
			var web = new SlackClient(token);
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

function formatForSlack(json, response_type){
	var formattedJson = {};
	formattedJson['as_user'] = false;
	formattedJson['attachments'] = [];
	formattedJson['reply_broadcast'] = "false";
	if(json.constructor === Array){
		json.forEach(function(element){
			var attachment = processElement(element);
			formattedJson.attachments.push(attachment);
		});
	}else{
		var attachment = processElement(json);
			formattedJson.attachments.push(attachment);
	}
	return formattedJson;
}

function processElement(element){
	var attachment = {};
	var change = element.Change;
	var changePerc = element.PercentChange;
	var price = element.LastTradePriceOnly;
	var ticker = element.symbol;
	var compName = element.Name;
	var dayOpen = element.Open;

	var stockUrl = imgUrl + ticker.replace(/[\./-]/,'');

	if(changePerc <= 0){
		attachment['color'] = 'danger';
	} else{
		attachment['color'] = 'good';
	}
	attachment['title'] = "Stock Information for " + compName;
	attachment['title_link'] = linkUrl + ticker;
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
	attachment['footer'] = 'Data from Yahoo Finance';
	attachment["image_url"] = stockUrl;
	return attachment;
}

function getApiUrl(symb){
	var query = 'select * from yahoo.finance.quotes where symbol in ("'+symb+'")';
	var url = 'http://query.yahooapis.com/v1/public/yql?q='+encodeURIComponent(query)+'&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&format=json&diagnostics=true';
	return url;
}

var server = app.listen(port, function() {
	var port = server.address().port;

	console.log("listening at port %s", port);
})