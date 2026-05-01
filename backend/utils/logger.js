const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../server.log');

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function formatMessage(args) {
  return args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
}

console.log = function(...args) {
  const message = `[INFO] ${new Date().toISOString()} - ${formatMessage(args)}\n`;
  fs.appendFileSync(logFilePath, message);
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  const message = `[ERROR] ${new Date().toISOString()} - ${formatMessage(args)}\n`;
  fs.appendFileSync(logFilePath, message);
  originalConsoleError.apply(console, args);
};
