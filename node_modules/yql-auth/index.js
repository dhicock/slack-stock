var got = require('got'),
	Promise = require('es6-promise').Promise,
	stringFormat = require('string-format'),
	oauth = require('./OAuth'),
	baseUrl = 'https://query.yahooapis.com/v1/public/yql/',
	format = 'json';

module.exports = {
	options: function (options) {
		var data = options || {};

		if (data.OAuth) {
			oauth.init(data.OAuth);
		}

		if (options.format) {
			if (options.format === 'json' || options.format === 'xml') {
				format = options.format;
			}
		}
		
		return this;
	},
	query: function (query) {
		return new Promise(function (fulfill, reject) {
			if (oauth.valid) {
				oauth.post(query, format).then(function (response) {
					fulfill(response);
				}).catch(function (error) {
					reject(error);
				});
			} else {
				got(stringFormat('{url}?q={query}&format={format}', { url: baseUrl, query: query, format: format })).then(function (response) {
					try {
						fulfill(response.body);
					} catch (e) {
						reject(e);
					}
				}).catch(function (error) {
					reject(error);
				})
			}
		});
	}
}