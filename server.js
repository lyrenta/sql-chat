const http = require('http');
const fs = require('fs');
const path = require('path');

const pathToIndex = path.join(__dirname, 'static', 'index.html');
const indexHtmlFile = fs.readFileSync(pathToIndex);

const pathToStyle = path.join(__dirname, 'static', 'style.css');
const styleCssFile = fs.readFileSync(pathToStyle);

const pathToScript = path.join(__dirname, 'static', 'script.js');
const scriptJsFile = fs.readFileSync(pathToScript);

const server = http.createServer((req, res) => {
    if(req.url === '/') {
        return res.end(indexHtmlFile);
    }
    if(req.url === '/style.css') {
        res.setHeader('Content-Type', 'text/css');
        return res.end(styleCssFile);
    }
    if(req.url === '/script.js') {
        res.setHeader('Content-Type', 'application/javascript');
        return res.end(scriptJsFile);
    }
    res.statusCode = 404;
    return res.end('error 404')
});

server.listen(3000);