'use strict';

const fs = require('fs');
let winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ 'level': 'info' }),
    new (winston.transports.File)({ 'level': 'verbose', 'filename': 'compress.log', 'maxsize': 1024 * 1024, 'zippedArchive': true, 'json': false })
  ]
});

logger.cli();

const dirName = process.argv[2];
if (!dirName) {
  throw Error('Directory must be specified');
}

try {
  let dirStat = fs.statSync(dirName);
  if (!dirStat.isDirectory()) {
    throw Error(dirName + " must be a directory");
  }
} catch (err) {
  logger.error("Error reading " + dirName);
  return;
}

let compressor = require("./compressor");
let packer = new compressor("log", logger);

fs.readdir(dirName, (err, files) => {
  if (!err) {
    for (let file of files) {
      packer.pack(dirName, file);
    }
  } else {
    logger.error(err);
  }
});
