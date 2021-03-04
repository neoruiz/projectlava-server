const pug = require('pug');

const options = {
    pretty: false
};

// render
var html = pug.render('string of pug', options);

// renderFile
var html = pug.renderFile('./views/time-entry.pug', options);

module.exports = html;