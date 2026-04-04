// Vercel Serverless Function Entry Point (Web-nested)
const app = require('../../server/src/index');

// Vercel expects the express app to be exported
module.exports = app;
