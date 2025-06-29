import morgan, { StreamOptions } from 'morgan';

import logger from '../utils/logger';


// Override the stream method to use our Winston logger
const stream: StreamOptions = {
  write: (message: string) => {
    // Remove trailing newline from morgan
    logger.http(message.trim());
  },
};

// Skip all the Morgan http log if the application is not running in development mode
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'development';
};

// Build the morgan middleware with custom format and stream
const httpLogger = morgan(
  // Define message format string (this is the default one)
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

// Extended format for production with more details
const httpLoggerDetailed = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  { stream }
);

// JSON format for structured logging
const httpLoggerJSON = morgan((tokens, req, res) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTime: Number(tokens['response-time'](req, res)),
    remoteAddr: tokens['remote-addr'](req, res),
    userAgent: tokens['user-agent'](req, res),
    referrer: tokens.referrer(req, res),
  });
}, { stream });

export { httpLogger, httpLoggerDetailed, httpLoggerJSON };

export default httpLogger;