'use strict';

let winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ 'level': 'verbose' }),
    new (winston.transports.File)({ 'level': 'verbose', 'filename': 'compress.log', 'maxsize': 1024 * 1024, 'zippedArchive': true, 'json': false })
  ]
});

logger.cli();

const dirName = process.argv[2];
if (!dirName) {
  throw Error('Directory must be specified');
}

const fs = require('fs');
const path = require('path');

let dirStat = fs.statSync(dirName);
if (!dirStat.isDirectory()) {
  throw Error(dirName + " must be a directory");
}

const zlib = require('zlib');
let remainingCount = 0;

const moment = require('moment');
let dateString = moment().format('MMDDYYYY');

fs.readdir(dirName, (err, files) => {

  if (err) {
    logger.error(err);
  }

  for (let file of files) {
    let fullpath = dirName.endsWith(path.sep) ? dirName + file : dirName + path.sep + file;

    let stat = fs.statSync(fullpath);
    if (stat.isFile() && path.extname(fullpath) == '.log') {
      let baseFileName = path.basename(fullpath, '.log');
      if (!baseFileName.endsWith(dateString)) {
        logger.info("compressing " + fullpath);

        try {
          const gzip = zlib.createGzip();
          const reader = fs.createReadStream(fullpath);
          const writer = fs.createWriteStream(fullpath + ".gz");

          writer.on('close', () => {
            logger.verbose("GZip file closed, deleting original " + fullpath);
            fs.unlinkSync(fullpath);
            remainingCount--;

            if (remainingCount == 0) {
              logger.info("Done zipping all files");
            } else {
              logger.verbose("Remains: " + remainingCount);
            }
          });

          remainingCount++;
          reader.pipe(gzip).pipe(writer);

        } catch (err) {
          logger.error("Error compressing and removing a fullpath: " + err);
        }
      } else {
        logger.info('Skipping today file ' + fullpath);
      }
    }
  }
});
