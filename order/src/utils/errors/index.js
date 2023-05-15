const Sentry = require("@sentry/node");
const _ = require("@sentry/tracing");
const logger = require("../logger");
const {
  NotFoundError,
  ValidationError,
  AuthorizeError,
} = require("./app-errors");

Sentry.init({
  dsn: "https://4431121af5e745828331836232f44d11@o4505118424236032.ingest.sentry.io/4505118540103680",
  tracesSampleRate: 1.0,
});

module.exports = (app) => {
  app.use((error, req, res, next) => {
    let reportError = true;

    // skip common / known errors
    [NotFoundError, ValidationError, AuthorizeError].forEach((typeOfError) => {
      if (error instanceof typeOfError) {
        reportError = false;
      }
    });

    if (reportError) {
      Sentry.captureException(error);
    }
    logger.info(`${new Date()}-${JSON.stringify(error.message)}`);
    const statusCode = error.statusCode || 500;
    const data = error.data || error.message;
    return res.status(statusCode).json({ message : data });
  });
};
