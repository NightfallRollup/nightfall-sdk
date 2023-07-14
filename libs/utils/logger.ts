import pino from "pino";

const LOGGER_DEFAULT_LEVEL = globalThis.process?.env.LOG_LEVEL ?? "info";
const LOGGER_TIME_STRING = "yyyy-mm-dd HH:MM:ss";

// https://getpino.io/#/docs/transports?id=typescript-compatibility
export const logger = pino({
  level: LOGGER_DEFAULT_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname,filename",
      translateTime: LOGGER_TIME_STRING,
    },
  },
});
