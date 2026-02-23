/**
 * Minimal HTTP CONNECT proxy that runs on the host.
 * Lets containers reach external hosts that are unreachable from the
 * container VM's NAT network (e.g. Minimax / Alibaba Cloud IPs).
 *
 * Usage: set HTTPS_PROXY=http://192.168.65.1:8128 in the container env.
 */
import http from 'http';
import net from 'net';

import { logger } from './logger.js';

export const HOST_PROXY_PORT = 8128;

export function startHostProxy(): void {
  const server = http.createServer();

  server.on('connect', (req, clientSocket, head) => {
    const [host, portStr] = (req.url ?? '').split(':');
    const port = parseInt(portStr, 10) || 443;

    const serverSocket = net.connect(port, host, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });

    serverSocket.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => serverSocket.destroy());
  });

  server.on('error', (err) => {
    logger.warn({ err: err.message }, 'Host proxy error');
  });

  server.listen(HOST_PROXY_PORT, '0.0.0.0', () => {
    logger.info({ port: HOST_PROXY_PORT }, 'Host proxy started');
  });
}
