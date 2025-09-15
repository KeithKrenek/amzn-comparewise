import cors_anywhere from 'cors-anywhere';

// Create a proxy server to bypass CORS restrictions
export const startProxyServer = (host = 'localhost', port = 8080) => {
  return new Promise((resolve, reject) => {
    try {
      const server = cors_anywhere.createServer({
        originWhitelist: [], // Allow all origins
        requireHeader: ['origin', 'x-requested-with'],
        removeHeaders: ['cookie', 'cookie2'],
        httpProxyOptions: {
          // Additional options for http-proxy
          xfwd: false, // Don't add x-forward headers
        }
      });
      
      server.listen(port, host, () => {
        console.log(`CORS Anywhere proxy running on ${host}:${port}`);
        resolve({
          server,
          url: `http://${host}:${port}/`
        });
      });
    } catch (error) {
      console.error('Failed to start proxy server:', error);
      reject(error);
    }
  });
};

// If this file is run directly, start the server
if (import.meta.url === import.meta.main) {
  startProxyServer().catch(console.error);
}