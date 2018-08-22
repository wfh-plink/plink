"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const __api_1 = require("__api");
const request = require("request");
const Url = require("url");
const fs = require("fs");
const AdmZip = require('adm-zip');
const log = require('log4js').getLogger(__api_1.default.packageName + '.fetch-remote');
let currVersion = Number.NEGATIVE_INFINITY;
let timer;
let stopped = false;
function start() {
    const setting = __api_1.default.config.get(__api_1.default.packageName);
    const fetchUrl = setting.fetchUrl;
    if (fetchUrl == null) {
        log.info('No fetchUrl configured, skip fetching resource.');
        return Promise.resolve();
    }
    return runRepeatly(setting);
}
exports.start = start;
/**
 * It seems ok to quit process without calling this function
 */
function stop() {
    stopped = true;
    if (timer) {
        clearTimeout(timer);
    }
}
exports.stop = stop;
function runRepeatly(setting) {
    if (stopped)
        return Promise.resolve();
    return run(setting)
        .catch(error => log.error(error))
        .then(() => {
        if (stopped)
            return;
        timer = setTimeout(() => {
            runRepeatly(setting);
        }, setting.fetchIntervalSec * 1000);
    });
}
function run(setting) {
    return __awaiter(this, void 0, void 0, function* () {
        let checksumObj = yield retry(fetch, setting.fetchUrl);
        if (checksumObj == null)
            return;
        if (checksumObj.changeFetchUrl) {
            setting.fetchUrl = checksumObj.changeFetchUrl;
            log.info('Change fetch URL to', setting.fetchUrl);
        }
        if (checksumObj.version != null && currVersion >= checksumObj.version)
            return;
        const resource = Url.resolve(setting.fetchUrl, checksumObj.path + '?' + Math.random());
        const downloadTo = __api_1.default.config.resolve('destDir', 'remote.zip');
        log.info('fetch', resource);
        yield retry(() => {
            return new Promise((resolve, rej) => {
                request.get(resource).on('error', err => {
                    rej(err);
                })
                    .pipe(fs.createWriteStream(downloadTo))
                    .on('finish', () => setTimeout(resolve, 100));
            });
        });
        const zip = new AdmZip(downloadTo);
        log.info('extract', resource);
        zip.extractAllTo(__api_1.default.config.resolve('staticDir'), true);
        __api_1.default.eventBus.emit(__api_1.default.packageName + '.downloaded');
        currVersion = checksumObj.version;
    });
}
function fetch(fetchUrl) {
    const checkUrl = fetchUrl + '?' + Math.random();
    log.info('request', checkUrl);
    return new Promise((resolve, rej) => {
        request.get(checkUrl, {}, (error, response, body) => {
            if (error) {
                return rej(error);
            }
            if (response.statusCode < 200 || response.statusCode > 302) {
                return rej(error);
            }
            if (typeof body === 'string')
                body = JSON.parse(body);
            resolve(body);
        });
    });
}
function retry(func, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let cnt = 0;;) {
            try {
                return yield func(...args);
            }
            catch (err) {
                cnt++;
                if (cnt === 3) {
                    throw err;
                }
                log.warn('Encounter error, will retry', err);
            }
            yield new Promise(res => setTimeout(res, 5000));
        }
    });
}

//# sourceMappingURL=fetch-remote.js.map