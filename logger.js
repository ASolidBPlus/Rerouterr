const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const logFormat = printf(({ level, message, timestamp }) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    const localTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    return `${localTime} ${level}: ${message}`;
});

const logger = createLogger({
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        new transports.Console(),
    ]
});

module.exports = logger;
