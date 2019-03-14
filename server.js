var express = require('express');
var app = express();
var rp = require('request-promise');
var bodyParser = require('body-parser');
var SlackClient = require('@slack/client').WebClient;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var port = process.env.PORT || 8081;
var token = process.env.SLACK_API_TOKEN;
var iexKey = process.env.IEX_PUBLISH_TOKEN;
var regexPattern = /\${2,}[A-Za-z\./-]+[A-Za-z]*/g;
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
		console.log(JSON.stringify(req.body));
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

	if(dhicock){
		//console.log('body:'+JSON.stringify(req.body.event));
	}
	var symbols = [];
	stockArr.forEach(function(element) {
		var elem = element.replace(/\$+/, '');
		if(dhicock){
			console.log('element: '+ element + ">" + elem);
		}
		symbols.push(elem);
	});

	symbols.forEach(async function(element){
		var price = await getStockPrice(element);
		var compData = await getCompanyData(element);
		var keyStats = await getKeyStats(element);
		formattedJson = formatForSlack(price, compData, keyStats);
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
	});
	res.end();
})

function formatForSlack(price, compData, keyStats){
	var formattedJson = {};
	formattedJson['as_user'] = false;
	formattedJson['attachments'] = [];
	formattedJson['reply_broadcast'] = "false";
	var attachment = processElement(price, compData, keyStats);
	formattedJson.attachments.push(attachment);
	return formattedJson;
}

function processElement(price, compData, keyStats){
	var attachment = {};
	var stockUrl = imgUrl + compData.symbol.replace(/[\./-]/,'');

	attachment['title'] = "Stock Information for " + compData.companyName;
	attachment['title_link'] = linkUrl + compData.symbol;
	attachment['fields'] = [
		{
			"title": "Symbol",
			"value": compData.symbol,
			"short": true
		},
		{
			"title": "Company Name",
			"value": compData.companyName,
			"short": true
		},
		{
			"title": "Description",
			"value": compData.description,
			"short": false
		},
		{
			"title": "Stock Price",
			"value": price,
			"short": true
		},
		{
			"title": "Next Earnings Date",
			"value": keyStats.nextEarningsDate,
			"short": true
		},
		{
			"title": "5 day change",
			"value": (keyStats.day5ChangePercent * 100).toFixed(2) + '%',
			"short":true
		},
		{
			"title": "Year To Date change",
			"value": (keyStats.ytdChangePercent * 100).toFixed(2) + '%',
			"short":true
		}
	];
	attachment['footer'] = 'Data from IEX Cloud';
	attachment["image_url"] = stockUrl;
	return attachment;
}

async function getStockPrice(symb){
	var url = 'https://cloud.iexapis.com/beta/stock/'+encodeURIComponent(symb)+'/price';
	//console.log(url);
	var options = {
		uri: url,
		qs: {
			token: iexKey
		},
		json: false
	}
	let data = undefined;
	await rp(options)
		.then(function (price) {
			//console.log('Price is: ' + price);
			data = price;
		})
		.catch(function (err) {
			console.log('There was a problem: ' + err)
		});
	return data;
}

async function getCompanyData(symb){
	var url = 'https://cloud.iexapis.com/beta/stock/'+encodeURIComponent(symb)+'/company';
	//console.log(url);
	var options = {
		uri: url,
		qs: {
			token: iexKey
		},
		json: true
	}
	let data = undefined;
	await rp(options)
		.then(function (compData) {
			//console.log('Company data is: ' + JSON.stringify(compData));
			data = compData;
		})
		.catch(function (err) {
			console.log('There was a problem: ' + err)
		});
	return data;
}

async function getKeyStats(symb){
	var url = 'https://cloud.iexapis.com/beta/stock/'+encodeURIComponent(symb)+'/stats';
	console.log(url);
	var options = {
		uri: url,
		qs: {
			token: iexKey
		},
		json: true
	}
	let data = undefined;
	await rp(options)
		.then(function (compData) {
			//console.log('Company stats are: ' + JSON.stringify(compData));
			data = compData;
		})
		.catch(function (err) {
			console.log('There was a problem: ' + err)
		});
	return data;
}

var server = app.listen(port, function() {
	var port = server.address().port;

	console.log("listening at port %s", port);
})