import pino from 'pino';
const normalizePath = (filePath) => {
    return filePath.replace(/\\/g, "/").replace(/\/+/g, "/").trim();
};

// --- Base Logger Configuration ---
const isProd = process.env.NODE_ENV === 'production';

const   baselogger = pino({
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    redact: ['req.headers.authorization', 'password'],
    timestamp: pino.stdTimeFunctions.isoTime,

    serializers: {
        err: (error) => {
            // If stack is not required, return only message
            if (!error || error.showStack === false) {
                return error?.message;
            }

            // If stack is required, include it
            return {
                message: error.message,
                stack: error.stack,
            };
        },
    },

    transport: !isProd
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                ignore: 'headers,query,params,body,pid,hostname',
                singleLine: true,
            },
        } : {
            target: 'pino/file',
            options: { destination: './logs/app.log' },
        },
});

// --- Child Loggers for Core Modules ---
const childLoggers = {
    ai: baselogger.child({ module: 'AI' }),
    database: baselogger.child({ module: 'Database' }),
    http: baselogger.child({ module: 'HTTP' }),
    socket: baselogger.child({ module: 'Socket.IO' }),
};

// --- Dynamic Child Logger Factory ---
const getChildLogger = (module, meta = {}) => baselogger.child({ module, ...meta });

// --- Express Middleware ---
const requestLogger = (req, res, next) => {
    baselogger.info(
        {
            method: req.method,
            url: req.url,
            headers: req.headers,
            query: req.query,
            params: req.params,
        },
        'Incoming request'
    );
    next();
};

const responseLogger = (req, res, next) => {
    const oldSend = res.send;
    res.send = function (...args) {
        baselogger.info(
            {
                statusCode: res.statusCode,
                body: args[0],
            },
            'Response sent'
        );
        oldSend.apply(res, args);
    };
    next();
};

const errorLogger = (err, req, res, next, stackenabled = true) => {
    let cleanStack = '';

    if (err.stack && stackenabled) {
        cleanStack = err.stack
            .split('\n')
            .filter(
                (line) =>
                    line.includes('src/') &&
                    !line.includes('node_modules') &&
                    !line.includes('(internal') &&
                    !line.includes('bootstrap_node')
            )
            .map((line) => normalizePath(line))
            .join('\n');
    }

    baselogger.error(
        {
            message: err.message,
            stack: cleanStack,
            url: req.url,
            method: req.method,
        },
        'Error occurred'
    );

    next(err);
};

// --- Helper Functions ---
const logPerformance = (operation, duration, meta = {}) => {
    baselogger.info({ operation, duration, ...meta }, 'Performance metrics');
};

const logExternalApi = (url, method, statusCode, duration, meta = {}) => {
    baselogger.info({ url, method, statusCode, duration, ...meta }, 'External API call');
};

const logUserAction = (userId, action, meta = {}) => {
    baselogger.info({ userId, action, ...meta }, 'User action');
};

const logSystemEvent = (event, meta = {}) => {
    baselogger.info({ event, ...meta }, 'System event');
};

const logDebug = (message, meta = {}) => {
    if (!isProd) baselogger.debug(meta, message);
};

const logWarning = (message, meta = {}) => {
    baselogger.warn(meta, message);
};

const logError = (message, meta = {}) => {
    baselogger.error(meta, message);
};

// --- Exported Structure ---
const logger = {
    base: baselogger,
    ...childLoggers,
    getChildLogger,
    express: {
        requestLogger,
        responseLogger,
        errorLogger,
    },
    helpers: {
        logPerformance,
        logExternalApi,
        logUserAction,
        logSystemEvent,
        logDebug,
        logWarning,
        logError,
    },
};

export default logger;
