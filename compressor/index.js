const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

class LogFilePacker {
    constructor(extension /* string */, logger) {
        this.extension = extension;
        this.logger = logger;
        const moment = require('moment');
        let dateString = moment().format('MMDDYYYY');
    }

    pack(dirName, file /* fileName */) {
        let fullpath = dirName.endsWith(path.sep) ? dirName + file : dirName + path.sep + file;
  
        let stat = fs.statSync(fullpath);
        if (stat.isFile() && path.extname(fullpath) == `.${this.extension}`) {
          let baseFileName = path.basename(fullpath, `.${this.extension}`);
          if (!baseFileName.endsWith(this.dateString)) {
            this.logger.info("compressing " + fullpath);
      
            try {
              const gzip = zlib.createGzip();
              const reader = fs.createReadStream(fullpath);
              const writer = fs.createWriteStream(fullpath + ".gz");
      
              writer.on('close', () => {
                this.logger.verbose("GZip file closed, deleting original " + fullpath);
                fs.unlinkSync(fullpath);
                this.remainingCount--;
      
                if (this.remainingCount == 0) {
                  this.logger.info("Done zipping all files");
                } else {
                  this.logger.verbose("Remains: " + this.remainingCount);
                }
              });
      
              this.remainingCount++;
              reader.pipe(gzip).pipe(writer);
      
            } catch (err) {
              this.logger.error("Error compressing and removing a fullpath: " + err);
            }
          } else {
            this.logger.info('Skipping today file ' + fullpath);
          }
        }
    }
}

module.exports = LogFilePacker;
