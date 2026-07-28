const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const username = process.env.PROTECT_USER || 'reader';
const password = process.env.PROTECT_PASS || 'private-book-log';
const rootDir = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendResponse(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

function authenticate(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Basic ')) return false;

  const encoded = authHeader.slice('Basic '.length);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');

  return user === username && pass === password;
}

function getFilePath(requestPath) {
  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const resolvedPath = path.normalize(safePath).replace(/^([.]{1,2}[\/])+/, '');
  return path.join(rootDir, resolvedPath);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      sendResponse(res, 404, 'Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    sendResponse(res, 200, content, contentType);
  });
}

const server = http.createServer((req, res) => {
  if (!authenticate(req)) {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="Private Book Tracker"',
      'Content-Type': 'text/plain; charset=utf-8'
    });
    res.end('Authentication required.');
    return;
  }

  const requestPath = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  const filePath = getFilePath(requestPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallback = path.join(rootDir, 'index.html');
      serveFile(res, fallback);
      return;
    }

    serveFile(res, filePath);
  });
});

server.listen(port, host, () => {
  console.log(`Private book tracker available at http://${host}:${port}`);
  console.log(`Use username: ${username}`);
  console.log(`Use password: ${password}`);
});
