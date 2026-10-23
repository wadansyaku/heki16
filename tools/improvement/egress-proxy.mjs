// Runs in a separate disposable container. No credentials, content logs, or generic forward proxy.
import http from 'node:http';
import net from 'node:net';
import {pathToFileURL} from 'node:url';
export const allowedTarget = target => target === 'api.anthropic.com:443';
export function createProxy({connect = options => net.connect(options)} = {}) {
  const server = http.createServer((_request, response) => { response.writeHead(403); response.end(); });
  server.on('connect', (request, client, head) => {
    if (!allowedTarget(request.url)) { client.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
    const upstream = connect({host: 'api.anthropic.com', port: 443});
    client.setTimeout(120000, () => client.destroy());
    upstream.setTimeout(120000, () => upstream.destroy());
    upstream.once('connect', () => {
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) upstream.write(head);
      client.pipe(upstream); upstream.pipe(client);
    });
    upstream.on('error', () => client.destroy());
    client.on('error', () => upstream.destroy());
    client.on('close', () => upstream.destroy());
  });
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) createProxy().listen(8787, '0.0.0.0');
