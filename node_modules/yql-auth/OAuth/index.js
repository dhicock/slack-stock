var OAuth = require('oauth'),
	Promise = require('es6-promise').Promise,
	auth = null,
	baseUrl = 'https://query.yahooapis.com/v1/yql/',
	version = '1.0',
	signatureMethod = 'HMAC-SHA1';

module.exports = {
	valid: false,
	init: function (options) {
		var data = options || {};

		if (!data.ID || !data.Secret) {
			this.valid = false;
			return;
		}

		if (data.version) {
			version = data.version;
		}

		if (data.signatureMethod) {
			signatureMethod = data.signatureMethod;
		}

		try {
			auth = new OAuth.OAuth(baseUrl, baseUrl, data.ID, data.Secret, version, null, signatureMethod);
			auth.setClientOptions({ requestTokenHttpMethod: 'POST' });
			this.valid = true;
		} catch (error) {
			this.valid = false;
		}
	},
	post: function (query, format) {
		return new Promise(function (fulfill, reject) {
			if (this.valid === false || auth == null) {
				reject(new Error('Invalid OAuth data provided. Could not make the query.'));
				return;
			}

			try {
				auth.post(baseUrl, '', '', { q: query, format: format || 'json' }, function (error, response) {
					if (error) {
						reject(error);
					} else {
						fulfill(response);
					}
				});
			} catch (error) {
				reject(error);
			}
		});
	}
}