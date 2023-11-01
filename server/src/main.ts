import {createServer} from 'http';

const server = createServer();
server.listen(3322);
console.log('Server listening on port 3322');

server.on('request', (req, res) => {
  console.log('Request received', req.url);

  res.setHeader('Content-Type', 'text/plain');
  res.statusCode = 200;
  res.end('Hello World');
});
