//
// NODE.JS server which acts as a proxy for ADT and BLOB storage
//
const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const utils = require('./utils');
const { createProxyMiddleware } = require("http-proxy-middleware");

// fn to create express server
const create = async () => {
  // server
  const app = express();
  app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));

  // Log request
  app.use(utils.appLogger);

  // eslint-disable-next-line
  const pathRewrite = async function (path, _req) {
    return path.replace('/api/proxy', '');
  };

  const validAdtHostSuffixes = [
    'digitaltwins.azure.net',
    'azuredigitaltwins-ppe.net',
    'azuredigitaltwins-test.net',
  ];
  const validBlobHostSuffixes = ['blob.core.windows.net'];

  const validProxyRequestHeaders = [
    'Accept',
    'Accept-Encoding',
    'Accept-Language',
    'authorization',
    'Content-Length',
    'content-type',
    'Host',
    'x-ms-client-request-id',
    'x-ms-useragent',
    'User-Agent',
    'x-ms-version',
    'x-ms-blob-type',
  ];

  const proxyResponseHeaders = {
    'Content-Security-Policy':
      "default-src 'self' data: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none'",
  };
  const retryNumber = 3;

  app.use(
    '/api/proxy',
    createProxyMiddleware({
      changeOrigin: true,
      headers: {
        connection: 'keep-alive',
      },
      secure: true,
      target: '/',
      onProxyReq: (proxyReq) => {
        // remove all unnecessary headers
        let newHeaderMap = {};
        validProxyRequestHeaders.forEach((header) => {
          let headerValue = proxyReq.getHeader(header);
          if (headerValue !== undefined) {
            newHeaderMap[header] = headerValue;
          }
        });
        Object.keys(proxyReq.getHeaders()).forEach((header) => {
          proxyReq.removeHeader(header);
        });
        Object.keys(newHeaderMap).forEach((header) => {
          proxyReq.setHeader(header, newHeaderMap[header]);
        });
      },
      onProxyRes: (proxyRes) => {
        Object.keys(proxyResponseHeaders).forEach((header) => {
          // eslint-disable-next-line
          proxyRes.headers[header] = proxyResponseHeaders[header];
        });
      },
      pathRewrite,
      router: (req) => {
        // validate ADT environment URL
        let xAdtHostHeader = req.headers['x-adt-host'].toLowerCase();
        let adtUrl = `https://${xAdtHostHeader}/`;
        let adtUrlObject = new URL(adtUrl);
        if (
          validAdtHostSuffixes.some((suffix) =>
            adtUrlObject.host.endsWith(suffix)
          )
        ) {
          return adtUrl;
        } else {
          throw new Error('Invalid ADT Environment URL');
        }
      },
    })
  );

  app.use(
    '/proxy/adt',
    createProxyMiddleware({
      changeOrigin: true,
      headers: {
        connection: 'keep-alive',
      },
      secure: true,
      target: '/',
      onProxyReq: (proxyReq) => {
        // Remove all unnecessary headers
        const newHeaderMap = {};
        validProxyRequestHeaders.forEach((header) => {
          const headerValue = proxyReq.getHeader(header);
          // eslint-disable-next-line no-undefined
          if (headerValue !== undefined) {
            newHeaderMap[header] = headerValue;
          }
        });
        Object.keys(proxyReq.getHeaders()).forEach((header) => {
          proxyReq.removeHeader(header);
        });
        Object.keys(newHeaderMap).forEach((header) => {
          proxyReq.setHeader(header, newHeaderMap[header]);
        });
      },
      onProxyRes: (proxyRes) => {
        Object.keys(proxyResponseHeaders).forEach((header) => {
          // eslint-disable-next-line
          proxyRes.headers[header] = proxyResponseHeaders[header];
        });
      },
      pathRewrite: {
        '/proxy/adt': '',
      },
      router: (req) => {
        // Validate ADT environment URL
        const xAdtHostHeader = req.headers['x-adt-host'].toLowerCase();
        const adtUrl = `https://${xAdtHostHeader}/`;
        const adtUrlObject = new URL(adtUrl);
        if (
          validAdtHostSuffixes.some((suffix) =>
            adtUrlObject.host.endsWith(suffix)
          )
        ) {
          return adtUrl;
        }
        throw new Error('Invalid ADT Environment URL');
      },
    })
  );

  const blobProxy = createProxyMiddleware({
    changeOrigin: true,
    headers: {
      connection: 'keep-alive',
    },
    secure: true,
    target: '/',
    onProxyReq: (proxyReq) => {
      // Remove all unnecessary headers
      const newHeaderMap = {};
      validProxyRequestHeaders.forEach((header) => {
        const headerValue = proxyReq.getHeader(header);
        // eslint-disable-next-line no-undefined
        if (headerValue !== undefined) {
          newHeaderMap[header] = headerValue;
        }
      });
      Object.keys(proxyReq.getHeaders()).forEach((header) => {
        proxyReq.removeHeader(header);
      });
      Object.keys(newHeaderMap).forEach((header) => {
        proxyReq.setHeader(header, newHeaderMap[header]);
      });
    },
    onProxyRes: (proxyRes) => {
      Object.keys(proxyResponseHeaders).forEach((header) => {
        // eslint-disable-next-line
        proxyRes.headers[header] = proxyResponseHeaders[header];
      });
    },
    pathRewrite: {
      '/proxy/blob': '',
    },
    router: (req) => {
      const blobHost = req.headers['x-blob-host'];
      const blobHostUrl = `https://${blobHost}/`;
      const blobHostUrlObject = new URL(blobHostUrl);
      if (
        validBlobHostSuffixes.some((suffix) =>
          blobHostUrlObject.host.endsWith(suffix)
        )
      ) {
        return blobHostUrl;
      }
      throw new Error('Invalid Blob URL');
    },
    onError: (err, req, res) => {
      const code = err.code;
      if (code === 'ECONNRESET') {
        if (
          !req.currentRetryAttempt ||
          req.currentRetryAttempt <= retryNumber
        ) {
          req.currentRetryAttempt = req.currentRetryAttempt
            ? (req.currentRetryAttempt += 1)
            : 1;
          console.log(
            'Proxy server retry request attempt number: ' +
              req.currentRetryAttempt
          );
          blobProxy.call(blobProxy, req, res); // resend the original request to proxy middleware again
        } else {
          console.log(
            'All proxy server retry attempts failed, returning error...'
          );
          res.status(504);
          res.send(err.message);
        }
      } else {
        switch (code) {
          case 'ENOTFOUND':
          case 'ECONNREFUSED':
            res.status(504);
            break;
          default:
            res.status(500);
        }
        res.send(err.message);
      }
    },
  });

  app.use('/proxy/blob', (req, res, next) =>
    blobProxy.call(blobProxy, req, res, next)
  );

  // sanity endpoint
  app.get('/api/hello', (req, res) => {
    res.json({ hello: 'goodbye' });
    res.end();
  });

  app.use(express.static(path.join(__dirname, '../public/build')));

  // Route local React routing back to the index.html
  app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, '../public/build/index.html'), function(err) {
      if (err) {
        res.status(500).send(err)
      }
    })
  })
  
  // Catch errors
  app.use(utils.logErrors);
  app.use(utils.clientError404Handler);
  app.use(utils.clientError500Handler);
  app.use(utils.errorHandler);

  return app;
};

module.exports = {
  create,
};
