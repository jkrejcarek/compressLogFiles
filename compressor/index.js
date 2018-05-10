const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const moment = require('moment');

class LogFilePacker {
    constructor(extension /* string */, logger) {
        this.extension = extension;
        this.logger = logger;
        this.dateString = moment().format('MMDDYYYY');
    }

    isTodayFile(filePath) {
        let baseFileName = path.basename(filePath, `.${this.extension}`);
        return baseFileName.endsWith(this.dateString);
    }

    isLogFile(fullPath) {
        let stat = fs.statSync(fullpath);
        return (stat.isFile() && path.extname(fullpath) == `.${this.extension}`);
    }

    pack(dirName, fileName /* fileName */) {
        let fullpath = dirName.endsWith(path.sep) ? dirName + fileName : dirName + path.sep + fileName;

        if (!isLogFile(fullPath)) {
            return
        };

        if (this.isTodayFile(fullpath)) {
            this.logger.info('Skipping today file ' + fullpath);
            return;
        }

        try {
            this.logger.info("Compressing " + fullpath);
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
                    this.logger.verbose("Remaining: " + this.remainingCount);
                }
            });

            this.remainingCount++;
            reader.pipe(gzip).pipe(writer);

        } catch (err) {
            this.logger.error("Error compressing and removing a fullpath: " + err);
        }
    }
}

module.exports = LogFilePacker;