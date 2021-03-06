const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const uuidv1 = require('uuid/v1');
const Moniker = require('moniker');
const names = Moniker.generator([Moniker.adjective, Moniker.noun, Moniker.verb]);
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const spreadsheetId = '1iwRoeADvmNZ-6gdFQDIqt4f_4SBJL0uBmLLJZt4oyO4';

app.set('view engine', 'pug');

app.use(cookieParser());

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

/* GOOGLE SPREADSHEET */
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
let gCredentials;

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  gCredentials = JSON.parse(content);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      
      callback(oAuth2Client);
    });
  });
}
/* END OF SPREADSHEET */

app.get('/', function (request, response) {
	authorize(gCredentials, function(auth){
		const sheets = google.sheets({version: 'v4', auth});
		sheets.spreadsheets.get({
			spreadsheetId: spreadsheetId
		}, (err, res) => {
			if (err) return console.log('The API returned an error: ' + err);
			response.render('qa-links', {
				REFERRAL : request.query.referrer || '',
				COLLECTIONS : res.data.sheets
					.filter(sheet => ['Apps', 'Config'].indexOf(sheet.properties.title) < 0)
					.map(sheet => sheet.properties.title)
			});
		});
	});
});

app.get('/urls/:collection', function (request, response) {
	/* Create new room with the selected Deck */
	authorize(gCredentials, function(auth){
		const sheets = google.sheets({version: 'v4', auth});

		sheets.spreadsheets.values.get({
		  spreadsheetId: spreadsheetId,
		  range: request.params.collection + '!A2:B',
		}, (err, res) => {
		  if (err) return console.log('The API returned an error: ' + err);
		  const rows = res.data.values;
		  if (rows.length) {
			response.send({ 
				'results': rows.map((row, index) => {
								return {
									'name' : row[0],
									'url': row[1]
								}
							})
			});
		  } else {
			response.send({ 
				'results': []
			});
		  }
		});

	  });
	  /* End of Create new room with the selected Deck */
});

app.get('/collections', function (request, response) {
	/* Create new room with the selected Deck */

	authorize(gCredentials, function(auth){
		const sheets = google.sheets({version: 'v4', auth});
		sheets.spreadsheets.get({
			spreadsheetId: spreadsheetId
		}, (err, res) => {
			if (err) return console.log('The API returned an error: ' + err);
			response.send({ 
				'results': res.data.sheets
							.filter(sheet => ['Config'].indexOf(sheet.properties.title) < 0)
							.map(sheet => sheet.properties.title)
						});
		});
	});
	  /* End of Create new room with the selected Deck */
});


app.get('/verticals', function (request, response) {
	/* Create new room with the selected Deck */
	authorize(gCredentials, function(auth){
		const sheets = google.sheets({version: 'v4', auth});

		sheets.spreadsheets.values.get({
		  spreadsheetId: spreadsheetId,
		  range: 'Apps!A2:B',
		}, (err, res) => {
		  if (err) return console.log('The API returned an error: ' + err);
		  const rows = res.data.values;
		  if (rows.length) {
			response.send({ 
				'results': rows.map((row, index) => {
								return {
									'name' : row[0] ? row[0].trim() : '',
									'url': row[1] ? row[1].trim() : ''
								}
							})
			});
		  } else {
			console.log('No data found.');
		  }
		});

	  });
	  /* End of Create new room with the selected Deck */
});


app.use(express.static('public'));
const server = http.createServer(app);

server.listen(process.env.PORT || 3002, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('[WEB] listening at http://%s:%s', host, port);
});