# YQL-Auth
[![NPM](https://nodei.co/npm/yql-auth.png)](https://nodei.co/npm/yql-auth/)

A YQL helper with OAuth support for Node.js

## Installation
`npm install yql-auth --save`

## Usage
### Public YQL API (No Authentication Provided)
```javascript
var yql = require('yql-auth');

yql.query('select * from geo.concordance where namespace="iata" and text="sfo"').then(function (response) {
	console.dir(response);
}).catch(function (error) {
	console.error(error);
});
```

### Logged In Using Your APP ID and Secret
```javascript
var yql = require('yql-auth').options({
	OAuth: {
		ID: '[CLIENT_ID]',
		Secret: '[CLIENT_SECRET]'
	}
});

yql.query('SELECT * FROM pm.finance.articles WHERE symbol="EURUSD"').then(function (response) {
	console.dir(response);
}).catch(function (error) {
	console.error(error);
});
```

### Additional Options
```javascript
// Besides OAuth {ID: ID, Secret: Secret}, you can define the format of the response.
// It supports JSON and XML (in lowercase)
.options({
  format: 'xml'
})
```

## Licence
[MIT] (https://github.com/AlbinDidic/yql-auth/blob/master/LICENSE)

## Release History
* 0.1.4 Bug fixes
* 0.1.0 Initial release
