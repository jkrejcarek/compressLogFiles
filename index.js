'use strict';

let winston = require('winston');
winston.cli();

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

fs.readdir(dirName, (err, files) => {

    if (err) {        
        winston.error(err);
    }

    for (let file of files) { 
        let fullpath = dirName.endsWith(path.sep) ? dirName + file : dirName + path.sep + file;

        let stat = fs.statSync(fullpath);
        if (stat.isFile() && path.extname(fullpath) == '.log') {
            winston.info("compressing " + fullpath);
                        
            try {
                const gzip = zlib.createGzip();
                const reader = fs.createReadStream(fullpath);
                const writer = fs.createWriteStream(fullpath + ".gz");

                writer.on('close', () => {
                    winston.verbose("GZip file closed, deleting original " + fullpath);
                    fs.unlinkSync(fullpath);
                });

                reader.pipe(gzip).pipe(writer);
            
            } catch (err) {
                winston.error("Error compressing and removing a fullpath: " + err);
            }
        }
    }
});
