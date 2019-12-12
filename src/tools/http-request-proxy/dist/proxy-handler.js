"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
var request = require('request');
const __api_1 = tslib_1.__importDefault(require("__api"));
const _ = tslib_1.__importStar(require("lodash"));
// import {BodyHandler, HeaderHandler} from './server';
const proxy_instance_1 = require("../isom/proxy-instance");
const url_1 = tslib_1.__importDefault(require("url"));
const fs = tslib_1.__importStar(require("fs"));
var log = require('log4js').getLogger(__api_1.default.packageName + '.msg');
var logBody = require('log4js').getLogger(__api_1.default.packageName + '.body');
var chalk = require('chalk');
var trackRequestStream = __api_1.default.config.get(__api_1.default.packageName + '.trackRequestStream');
var countRequest = 0;
var SKIP_RES_HEADERS = [
    'transfer-encoding',
    'content-encoding',
    'cache-control',
    'access-control-allow-origin'
];
var SKIP_RES_HEADERS_SET = SKIP_RES_HEADERS.reduce((set, name) => {
    set[name.toLowerCase()] = true;
    return set;
}, {});
/**
 * @param {*} target {string} URL of proxying target
 * @param {*} req {request}
 * @param {*} res {response}
 * @param {*} proxyInstance
 * @param {*} proxyName {string} proxy sub path which should not starts with '/'
 * @return undefined
 */
function doProxy(target, req, res, proxyInstance, proxyName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        var requestNum = ++countRequest;
        var toUrl = target + req.url.replace(/\/\//g, '/');
        if (req.method === 'GET')
            toUrl += (req.url.indexOf('?') >= 0 ? '#' : '?') + 'random=' + Math.random();
        // ------------hack begins ------
        var toHeaders = hackHeaders(target, req);
        // ----------- hack ends ----------
        let requestDebugInfo = `\n[#${requestNum}] REQUEST ${chalk.yellow(req.method)} ${chalk.cyan(toUrl)}\n` +
            `OriginalUrl: ${req.originalUrl}\n` +
            // `Host: ${req.headers.host}\n` +
            // `request headers: ${JSON.stringify(req.headers, null, 2)}\n` +
            `Hacked header: ${JSON.stringify(toHeaders, null, 2)}\n`;
        // log.info('hacked request headers: \n%s', JSON.stringify(toHeaders, null, 2));
        var opts = {
            url: toUrl,
            method: req.method,
            headers: toHeaders,
            strictSSL: false,
            time: false,
            timeout: __api_1.default.config.get(__api_1.default.packageName + '.timeout', 20000),
            // "request" will not automatically do gzip decoding on incomingMessage,
            // must explicitly set `gzip` to true
            gzip: toHeaders['accept-encoding'] && toHeaders['accept-encoding'].indexOf('gzip') >= 0
        };
        try {
            const mockBody = yield proxy_instance_1.intercept(req, toHeaders, req.body, proxyInstance.mockHandlers, proxyName);
            if (mockBody != null) {
                log.info(requestDebugInfo);
                const msg = yield Promise.resolve(doBodyAsync(requestNum, req, req.body, opts));
                log.info(msg);
                log.info('Mock response:\n' + chalk.blue(_.isString(mockBody) ? mockBody : JSON.stringify(mockBody)));
                res.status(200).send(mockBody);
            }
            else {
                const result = yield proxy_instance_1.intercept(req, toHeaders, req.body, proxyInstance.reqHandlers, proxyName);
                const reqBody = result == null ? req.body : result;
                const msg = yield Promise.resolve(doBodyAsync(requestNum, req, reqBody, opts));
                requestDebugInfo += msg;
                const data = yield send(req, opts, requestDebugInfo, requestNum, res, proxyInstance);
                const body = yield proxy_instance_1.intercept(req, data.headers, data.body, proxyInstance.resHandlers, proxyName);
                if (body)
                    logBody.info(`Hacked Response body:\n${chalk.green(_.isString(body) ? body :
                        (Buffer.isBuffer(body) ? 'buffer' : JSON.stringify(body)))}`);
                if (data.res.statusCode)
                    res.status(data.res.statusCode).send(body == null ? data.body : body);
            }
        }
        catch (err) {
            log.error(err);
            res.status(500).send(err.message);
        }
    });
}
exports.default = doProxy;
function send(req, opts, requestDebugInfo, requestNum, res, proxyInstance) {
    return new Promise((resolve, reject) => {
        var bufArray = [];
        request(opts, (err, msg, body) => {
            log.info(requestDebugInfo);
            var responseDebugInfo = `[#${requestNum}] RESPONSE:`;
            if (err) {
                log.error(`Request error ${err}`);
                reject(err);
                return;
            }
            if (msg.statusCode && (msg.statusCode > 299 || msg.statusCode < 200))
                log.warn('Status: %d %s', msg.statusCode, msg.statusMessage);
            else
                responseDebugInfo += `Status: ${msg.statusCode} ${msg.statusMessage}\n`;
            responseDebugInfo += 'Response headers:\n' + JSON.stringify(msg.headers, null, 2);
            hackResponseHeaders(req, msg.headers, res, proxyInstance);
            log.info(responseDebugInfo);
            var contentType = _.get(msg.headers, 'content-type');
            if (contentType && (contentType.indexOf('xml') >= 0 || contentType.indexOf('text') >= 0 ||
                contentType.indexOf('json') >= 0)) {
                logBody.info(`Response body:\n${chalk.blue(body)}`);
                return resolve({ headers: msg.headers, body, res: msg });
            }
            var buf = Buffer.concat(bufArray);
            return resolve({ headers: msg.headers, body: buf, res: msg });
        })
            .on('data', (b) => bufArray.push(b))
            .on('end', () => { });
    });
}
/**
 * Transport request from express to a request options.form/body for Request
 * @param {object} reqHeaders expresss request.headers
 * @param {object | string} reqBody expresss request.body
 * @param {object} opts Request options
 * @return debug string
 */
function doBodyAsync(requestNum, req, reqBody, opts) {
    var reqHeaders = req.headers;
    if (Buffer.isBuffer(reqBody) || _.isString(reqBody)) {
        // 
        opts.body = reqBody;
        return 'Body as Buffer or string: ' + reqBody.length;
    }
    else if (_.isObject(reqBody)) {
        // Request body is object (JSON, form or stream)
        const reqContentType = reqHeaders['content-type'];
        if (reqContentType && reqContentType.indexOf('json') >= 0) {
            opts.body = JSON.stringify(reqBody);
            return 'Body as JSON: ' + opts.body;
        }
        else if (reqContentType && reqContentType.indexOf('application/x-www-form-urlencoded') >= 0) {
            opts.form = reqBody;
            return 'Body as form: ' + JSON.stringify(opts.form);
        }
    }
    // Request body is stream
    if (trackRequestStream) {
        const tempFile = __api_1.default.config.resolve('destDir', 'request-body-' + requestNum);
        var out = fs.createWriteStream(tempFile);
        return new Promise((resolve, reject) => {
            req.pipe(out).on('finish', () => {
                log.info('Finished writing request body to temp file ', tempFile);
                opts.body = fs.createReadStream(tempFile);
                resolve('Body as Readable Stream');
            });
        });
    }
    else {
        opts.body = req;
        return 'Body as Readable Stream';
    }
}
function hackHeaders(target, req) {
    var toHeaders = _.assign({}, req.headers, {
        'x-real-ip': req.ip,
        'x-forwarded_for': req.ip,
        'x-forwarded-for': req.ip
    });
    var parsedTarget = url_1.default.parse(target);
    toHeaders.host = parsedTarget.host;
    delete toHeaders.origin;
    if (req.method === 'POST') {
        toHeaders.origin = parsedTarget.protocol + '//' + parsedTarget.host;
    }
    if (toHeaders.referer) {
        // tslint:disable-next-line:max-line-length
        toHeaders.referer = `${parsedTarget.protocol}//${parsedTarget.host}${url_1.default.parse(toHeaders.referer).pathname}`;
    }
    return toHeaders;
}
function hackResponseHeaders(req, originHeaders, response, proxyInstance) {
    _.each(originHeaders, (v, n) => {
        if (!_.get(SKIP_RES_HEADERS_SET, n.toLowerCase())) {
            if (n === 'set-cookie' && proxyInstance.isRemoveCookieDomain) {
                v = v.map((cookie) => {
                    var attrs = cookie.split(';');
                    return attrs.filter((value) => !value.startsWith('domain')).join(';');
                });
                log.info('Domain attribute is removed from set-cookie header: ', v);
            }
            response.set(n, v);
        }
        else
            log.debug('skip response header: %s', n);
    });
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHIvaHR0cC1yZXF1ZXN0LXByb3h5L3RzL3Byb3h5LWhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pDLDBEQUF3QjtBQUN4QixrREFBNEI7QUFHNUIsdURBQXVEO0FBQ3ZELDJEQUFpRDtBQUNqRCxzREFBc0I7QUFFdEIsK0NBQXlCO0FBQ3pCLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsZUFBRyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsQ0FBQztBQUNoRSxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLGVBQUcsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLENBQUM7QUFFckUsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzdCLElBQUksa0JBQWtCLEdBQUcsZUFBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBRyxDQUFDLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDO0FBRWpGLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztBQUVyQixJQUFJLGdCQUFnQixHQUFHO0lBQ3JCLG1CQUFtQjtJQUNuQixrQkFBa0I7SUFDbEIsZUFBZTtJQUNmLDZCQUE2QjtDQUM5QixDQUFDO0FBQ0YsSUFBSSxvQkFBb0IsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUEyQixFQUFFLElBQUksRUFBRSxFQUFFO0lBQ3ZGLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDL0IsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFUDs7Ozs7OztHQU9HO0FBQ0gsU0FBOEIsT0FBTyxDQUFDLE1BQWMsRUFBRSxHQUFvQixF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QUssQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJmaWxlIjoibm9kZV9tb2R1bGVzL0Bkci9odHRwLXJlcXVlc3QtcHJveHkvZGlzdC9wcm94eS1oYW5kbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIHJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0Jyk7XG5pbXBvcnQgYXBpIGZyb20gJ19fYXBpJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBQcm94eUluc3RhbmNlIH0gZnJvbSAnLi9zZXJ2ZXInO1xuLy8gaW1wb3J0IHtCb2R5SGFuZGxlciwgSGVhZGVySGFuZGxlcn0gZnJvbSAnLi9zZXJ2ZXInO1xuaW1wb3J0IHtpbnRlcmNlcHR9IGZyb20gJy4uL2lzb20vcHJveHktaW5zdGFuY2UnO1xuaW1wb3J0IFVybCBmcm9tICd1cmwnO1xuaW1wb3J0IHtJbmNvbWluZ01lc3NhZ2V9IGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xudmFyIGxvZyA9IHJlcXVpcmUoJ2xvZzRqcycpLmdldExvZ2dlcihhcGkucGFja2FnZU5hbWUgKyAnLm1zZycpO1xudmFyIGxvZ0JvZHkgPSByZXF1aXJlKCdsb2c0anMnKS5nZXRMb2dnZXIoYXBpLnBhY2thZ2VOYW1lICsgJy5ib2R5Jyk7XG5cbnZhciBjaGFsayA9IHJlcXVpcmUoJ2NoYWxrJyk7XG52YXIgdHJhY2tSZXF1ZXN0U3RyZWFtID0gYXBpLmNvbmZpZy5nZXQoYXBpLnBhY2thZ2VOYW1lICsgJy50cmFja1JlcXVlc3RTdHJlYW0nKTtcblxudmFyIGNvdW50UmVxdWVzdCA9IDA7XG5cbnZhciBTS0lQX1JFU19IRUFERVJTID0gW1xuICAndHJhbnNmZXItZW5jb2RpbmcnLFxuICAnY29udGVudC1lbmNvZGluZycsXG4gICdjYWNoZS1jb250cm9sJyxcbiAgJ2FjY2Vzcy1jb250cm9sLWFsbG93LW9yaWdpbidcbl07XG52YXIgU0tJUF9SRVNfSEVBREVSU19TRVQgPSBTS0lQX1JFU19IRUFERVJTLnJlZHVjZSgoc2V0OiB7W2s6IHN0cmluZ106IGJvb2xlYW59LCBuYW1lKSA9PiB7XG4gIHNldFtuYW1lLnRvTG93ZXJDYXNlKCldID0gdHJ1ZTtcbiAgcmV0dXJuIHNldDtcbn0sIHt9KTtcblxuLyoqXG4gKiBAcGFyYW0geyp9IHRhcmdldCB7c3RyaW5nfSBVUkwgb2YgcHJveHlpbmcgdGFyZ2V0XG4gKiBAcGFyYW0geyp9IHJlcSB7cmVxdWVzdH1cbiAqIEBwYXJhbSB7Kn0gcmVzIHtyZXNwb25zZX1cbiAqIEBwYXJhbSB7Kn0gcHJveHlJbnN0YW5jZVxuICogQHBhcmFtIHsqfSBwcm94eU5hbWUge3N0cmluZ30gcHJveHkgc3ViIHBhdGggd2hpY2ggc2hvdWxkIG5vdCBzdGFydHMgd2l0aCAnLydcbiAqIEByZXR1cm4gdW5kZWZpbmVkXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGRvUHJveHkodGFyZ2V0OiBzdHJpbmcsIHJlcTogZXhwcmVzcy5SZXF1ZXN0LCByZXM6IGV4cHJlc3MuUmVzcG9uc2UsXG4gIHByb3h5SW5zdGFuY2U6IFByb3h5SW5zdGFuY2UsIHByb3h5TmFtZTogc3RyaW5nKSB7XG4gIHZhciByZXF1ZXN0TnVtID0gKytjb3VudFJlcXVlc3Q7XG5cbiAgdmFyIHRvVXJsID0gdGFyZ2V0ICsgcmVxLnVybC5yZXBsYWNlKC9cXC9cXC8vZywgJy8nKTtcbiAgaWYgKHJlcS5tZXRob2QgPT09ICdHRVQnKVxuICAgIHRvVXJsICs9IChyZXEudXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyMnIDogJz8nKSArICdyYW5kb209JyArIE1hdGgucmFuZG9tKCk7XG4gIC8vIC0tLS0tLS0tLS0tLWhhY2sgYmVnaW5zIC0tLS0tLVxuICB2YXIgdG9IZWFkZXJzID0gaGFja0hlYWRlcnModGFyZ2V0LCByZXEpO1xuICAvLyAtLS0tLS0tLS0tLSBoYWNrIGVuZHMgLS0tLS0tLS0tLVxuICBsZXQgcmVxdWVzdERlYnVnSW5mbyA9IGBcXG5bIyR7cmVxdWVzdE51bX1dIFJFUVVFU1QgJHtjaGFsay55ZWxsb3cocmVxLm1ldGhvZCl9ICR7Y2hhbGsuY3lhbih0b1VybCl9XFxuYCArXG4gIGBPcmlnaW5hbFVybDogJHtyZXEub3JpZ2luYWxVcmx9XFxuYCArXG4gIC8vIGBIb3N0OiAke3JlcS5oZWFkZXJzLmhvc3R9XFxuYCArXG4gIC8vIGByZXF1ZXN0IGhlYWRlcnM6ICR7SlNPTi5zdHJpbmdpZnkocmVxLmhlYWRlcnMsIG51bGwsIDIpfVxcbmAgK1xuICBgSGFja2VkIGhlYWRlcjogJHtKU09OLnN0cmluZ2lmeSh0b0hlYWRlcnMsIG51bGwsIDIpfVxcbmA7XG4gIC8vIGxvZy5pbmZvKCdoYWNrZWQgcmVxdWVzdCBoZWFkZXJzOiBcXG4lcycsIEpTT04uc3RyaW5naWZ5KHRvSGVhZGVycywgbnVsbCwgMikpO1xuICB2YXIgb3B0cyA9IHtcbiAgICB1cmw6IHRvVXJsLFxuICAgIG1ldGhvZDogcmVxLm1ldGhvZCxcbiAgICBoZWFkZXJzOiB0b0hlYWRlcnMsXG4gICAgc3RyaWN0U1NMOiBmYWxzZSxcbiAgICB0aW1lOiBmYWxzZSxcbiAgICB0aW1lb3V0OiBhcGkuY29uZmlnLmdldChhcGkucGFja2FnZU5hbWUgKyAnLnRpbWVvdXQnLCAyMDAwMCksXG4gICAgLy8gXCJyZXF1ZXN0XCIgd2lsbCBub3QgYXV0b21hdGljYWxseSBkbyBnemlwIGRlY29kaW5nIG9uIGluY29taW5nTWVzc2FnZSxcbiAgICAvLyBtdXN0IGV4cGxpY2l0bHkgc2V0IGBnemlwYCB0byB0cnVlXG4gICAgZ3ppcDogdG9IZWFkZXJzWydhY2NlcHQtZW5jb2RpbmcnXSAmJiB0b0hlYWRlcnNbJ2FjY2VwdC1lbmNvZGluZyddLmluZGV4T2YoJ2d6aXAnKSA+PSAwXG4gIH07XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBtb2NrQm9keSA9IGF3YWl0IGludGVyY2VwdChyZXEsIHRvSGVhZGVycywgcmVxLmJvZHksIHByb3h5SW5zdGFuY2UubW9ja0hhbmRsZXJzLCBwcm94eU5hbWUpO1xuICAgIGlmIChtb2NrQm9keSAhPSBudWxsKSB7XG4gICAgICBsb2cuaW5mbyhyZXF1ZXN0RGVidWdJbmZvKTtcbiAgICAgIGNvbnN0IG1zZyA9IGF3YWl0IFByb21pc2UucmVzb2x2ZShkb0JvZHlBc3luYyhyZXF1ZXN0TnVtLCByZXEsIHJlcS5ib2R5LCBvcHRzKSk7XG4gICAgICBsb2cuaW5mbyhtc2cpO1xuICAgICAgbG9nLmluZm8oJ01vY2sgcmVzcG9uc2U6XFxuJyArIGNoYWxrLmJsdWUoXy5pc1N0cmluZyhtb2NrQm9keSkgPyBtb2NrQm9keSA6IEpTT04uc3RyaW5naWZ5KG1vY2tCb2R5KSkpO1xuICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQobW9ja0JvZHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBpbnRlcmNlcHQocmVxLCB0b0hlYWRlcnMsIHJlcS5ib2R5LCBwcm94eUluc3RhbmNlLnJlcUhhbmRsZXJzLCBwcm94eU5hbWUpO1xuICAgICAgY29uc3QgcmVxQm9keSA9IHJlc3VsdCA9PSBudWxsID8gcmVxLmJvZHkgOiByZXN1bHQ7XG4gICAgICBjb25zdCBtc2cgPSBhd2FpdCBQcm9taXNlLnJlc29sdmUoZG9Cb2R5QXN5bmMocmVxdWVzdE51bSwgcmVxLCByZXFCb2R5LCBvcHRzKSk7XG4gICAgICByZXF1ZXN0RGVidWdJbmZvICs9IG1zZztcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBzZW5kKHJlcSwgb3B0cywgcmVxdWVzdERlYnVnSW5mbywgcmVxdWVzdE51bSwgcmVzLCBwcm94eUluc3RhbmNlKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBpbnRlcmNlcHQocmVxLCBkYXRhLmhlYWRlcnMsIGRhdGEuYm9keSwgcHJveHlJbnN0YW5jZS5yZXNIYW5kbGVycywgcHJveHlOYW1lKTtcbiAgICAgIGlmIChib2R5KVxuICAgICAgICBsb2dCb2R5LmluZm8oYEhhY2tlZCBSZXNwb25zZSBib2R5OlxcbiR7Y2hhbGsuZ3JlZW4oXy5pc1N0cmluZyhib2R5KSA/IGJvZHkgOlxuICAgICAgICAgIChCdWZmZXIuaXNCdWZmZXIoYm9keSkgPyAnYnVmZmVyJyA6IEpTT04uc3RyaW5naWZ5KGJvZHkpKSl9YCk7XG4gICAgICBpZiAoZGF0YS5yZXMuc3RhdHVzQ29kZSlcbiAgICAgICAgcmVzLnN0YXR1cyhkYXRhLnJlcy5zdGF0dXNDb2RlKS5zZW5kKGJvZHkgPT0gbnVsbCA/IGRhdGEuYm9keSA6IGJvZHkpO1xuICAgIH1cbiAgfSBjYXRjaChlcnIpIHtcbiAgICBsb2cuZXJyb3IoZXJyKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuc2VuZChlcnIubWVzc2FnZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VuZChyZXE6IGV4cHJlc3MuUmVxdWVzdCwgb3B0czogYW55LCByZXF1ZXN0RGVidWdJbmZvOiBhbnksIHJlcXVlc3ROdW06IG51bWJlciwgcmVzOiBleHByZXNzLlJlc3BvbnNlLFxuICBwcm94eUluc3RhbmNlOiBQcm94eUluc3RhbmNlKTpcbiAgUHJvbWlzZTx7aGVhZGVyczoge1trOiBzdHJpbmddOiBhbnl9LCBib2R5OiBhbnksIHJlczogSW5jb21pbmdNZXNzYWdlfT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciBidWZBcnJheTogQnVmZmVyW10gPSBbXTtcbiAgICByZXF1ZXN0KG9wdHMsIChlcnI6IEVycm9yLCBtc2c6IEluY29taW5nTWVzc2FnZSwgYm9keTogc3RyaW5nfEJ1ZmZlcikgPT4ge1xuICAgICAgbG9nLmluZm8ocmVxdWVzdERlYnVnSW5mbyk7XG4gICAgICB2YXIgcmVzcG9uc2VEZWJ1Z0luZm8gPSBgWyMke3JlcXVlc3ROdW19XSBSRVNQT05TRTpgO1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBsb2cuZXJyb3IoYFJlcXVlc3QgZXJyb3IgJHtlcnJ9YCk7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAobXNnLnN0YXR1c0NvZGUgJiYgKG1zZy5zdGF0dXNDb2RlID4gMjk5IHx8IG1zZy5zdGF0dXNDb2RlIDwgMjAwKSlcbiAgICAgICAgbG9nLndhcm4oJ1N0YXR1czogJWQgJXMnLCBtc2cuc3RhdHVzQ29kZSwgbXNnLnN0YXR1c01lc3NhZ2UpO1xuICAgICAgZWxzZVxuICAgICAgICByZXNwb25zZURlYnVnSW5mbyArPSBgU3RhdHVzOiAke21zZy5zdGF0dXNDb2RlfSAke21zZy5zdGF0dXNNZXNzYWdlfVxcbmA7XG4gICAgICByZXNwb25zZURlYnVnSW5mbyArPSAnUmVzcG9uc2UgaGVhZGVyczpcXG4nICsgSlNPTi5zdHJpbmdpZnkobXNnLmhlYWRlcnMsIG51bGwsIDIpO1xuICAgICAgaGFja1Jlc3BvbnNlSGVhZGVycyhyZXEsIG1zZy5oZWFkZXJzLCByZXMsIHByb3h5SW5zdGFuY2UpO1xuICAgICAgbG9nLmluZm8ocmVzcG9uc2VEZWJ1Z0luZm8pO1xuXG4gICAgICB2YXIgY29udGVudFR5cGUgPSBfLmdldChtc2cuaGVhZGVycywgJ2NvbnRlbnQtdHlwZScpO1xuICAgICAgaWYgKGNvbnRlbnRUeXBlICYmIChjb250ZW50VHlwZS5pbmRleE9mKCd4bWwnKSA+PSAwIHx8IGNvbnRlbnRUeXBlLmluZGV4T2YoJ3RleHQnKSA+PSAwIHx8XG4gICAgICAgIGNvbnRlbnRUeXBlLmluZGV4T2YoJ2pzb24nKSA+PSAwICkpIHtcbiAgICAgICAgbG9nQm9keS5pbmZvKGBSZXNwb25zZSBib2R5OlxcbiR7Y2hhbGsuYmx1ZShib2R5KX1gKTtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoe2hlYWRlcnM6IG1zZy5oZWFkZXJzLCBib2R5LCByZXM6IG1zZ30pO1xuICAgICAgfVxuICAgICAgdmFyIGJ1ZiA9IEJ1ZmZlci5jb25jYXQoYnVmQXJyYXkpO1xuICAgICAgcmV0dXJuIHJlc29sdmUoe2hlYWRlcnM6IG1zZy5oZWFkZXJzLCBib2R5OiBidWYsIHJlczogbXNnfSk7XG4gICAgfSlcbiAgICAub24oJ2RhdGEnLCAoYjogQnVmZmVyKSA9PiBidWZBcnJheS5wdXNoKGIpKVxuICAgIC5vbignZW5kJywgKCkgPT4ge30pO1xuICB9KTtcbn1cblxuLyoqXG4gKiBUcmFuc3BvcnQgcmVxdWVzdCBmcm9tIGV4cHJlc3MgdG8gYSByZXF1ZXN0IG9wdGlvbnMuZm9ybS9ib2R5IGZvciBSZXF1ZXN0XG4gKiBAcGFyYW0ge29iamVjdH0gcmVxSGVhZGVycyBleHByZXNzcyByZXF1ZXN0LmhlYWRlcnNcbiAqIEBwYXJhbSB7b2JqZWN0IHwgc3RyaW5nfSByZXFCb2R5IGV4cHJlc3NzIHJlcXVlc3QuYm9keVxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgUmVxdWVzdCBvcHRpb25zXG4gKiBAcmV0dXJuIGRlYnVnIHN0cmluZ1xuICovXG5mdW5jdGlvbiBkb0JvZHlBc3luYyhyZXF1ZXN0TnVtOiBudW1iZXIsIHJlcTogZXhwcmVzcy5SZXF1ZXN0LCByZXFCb2R5OiBhbnksIG9wdHM6IHtbazogc3RyaW5nXTogYW55fSk6XG4gIHN0cmluZyB8IFByb21pc2VMaWtlPHN0cmluZz4ge1xuICB2YXIgcmVxSGVhZGVyczoge1trOiBzdHJpbmddOiBhbnl9ID0gcmVxLmhlYWRlcnM7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIocmVxQm9keSkgfHwgXy5pc1N0cmluZyhyZXFCb2R5KSkge1xuICAgIC8vIFxuICAgIG9wdHMuYm9keSA9IHJlcUJvZHk7XG4gICAgcmV0dXJuICdCb2R5IGFzIEJ1ZmZlciBvciBzdHJpbmc6ICcgKyByZXFCb2R5Lmxlbmd0aDtcbiAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KHJlcUJvZHkpKSB7XG4gICAgLy8gUmVxdWVzdCBib2R5IGlzIG9iamVjdCAoSlNPTiwgZm9ybSBvciBzdHJlYW0pXG4gICAgY29uc3QgcmVxQ29udGVudFR5cGUgPSByZXFIZWFkZXJzWydjb250ZW50LXR5cGUnXTtcbiAgICBpZiAocmVxQ29udGVudFR5cGUgJiYgcmVxQ29udGVudFR5cGUuaW5kZXhPZignanNvbicpID49IDApIHtcbiAgICAgIG9wdHMuYm9keSA9IEpTT04uc3RyaW5naWZ5KHJlcUJvZHkpO1xuICAgICAgcmV0dXJuICdCb2R5IGFzIEpTT046ICcgKyBvcHRzLmJvZHk7XG4gICAgfSBlbHNlIGlmIChyZXFDb250ZW50VHlwZSAmJiByZXFDb250ZW50VHlwZS5pbmRleE9mKCdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKSA+PSAwKSB7XG4gICAgICBvcHRzLmZvcm0gPSByZXFCb2R5O1xuICAgICAgcmV0dXJuICdCb2R5IGFzIGZvcm06ICcgKyBKU09OLnN0cmluZ2lmeShvcHRzLmZvcm0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlcXVlc3QgYm9keSBpcyBzdHJlYW1cbiAgaWYgKHRyYWNrUmVxdWVzdFN0cmVhbSkge1xuICAgIGNvbnN0IHRlbXBGaWxlOiBzdHJpbmcgPSBhcGkuY29uZmlnLnJlc29sdmUoJ2Rlc3REaXInLCAncmVxdWVzdC1ib2R5LScgKyByZXF1ZXN0TnVtKTtcbiAgICB2YXIgb3V0ID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odGVtcEZpbGUpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXEucGlwZShvdXQpLm9uKCdmaW5pc2gnLCAoKSA9PiB7XG4gICAgICAgIGxvZy5pbmZvKCdGaW5pc2hlZCB3cml0aW5nIHJlcXVlc3QgYm9keSB0byB0ZW1wIGZpbGUgJywgdGVtcEZpbGUpO1xuICAgICAgICBvcHRzLmJvZHkgPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHRlbXBGaWxlKTtcbiAgICAgICAgcmVzb2x2ZSgnQm9keSBhcyBSZWFkYWJsZSBTdHJlYW0nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIG9wdHMuYm9keSA9IHJlcTtcbiAgICByZXR1cm4gJ0JvZHkgYXMgUmVhZGFibGUgU3RyZWFtJztcbiAgfVxufVxuXG5mdW5jdGlvbiBoYWNrSGVhZGVycyh0YXJnZXQ6IHN0cmluZywgcmVxOiBleHByZXNzLlJlcXVlc3QpOiB7W2s6IHN0cmluZ106IGFueX0ge1xuICB2YXIgdG9IZWFkZXJzID0gXy5hc3NpZ24oe30sIHJlcS5oZWFkZXJzLCB7XG4gICAgJ3gtcmVhbC1pcCc6IHJlcS5pcCxcbiAgICAneC1mb3J3YXJkZWRfZm9yJzogcmVxLmlwLFxuICAgICd4LWZvcndhcmRlZC1mb3InOiByZXEuaXBcbiAgfSk7XG4gIHZhciBwYXJzZWRUYXJnZXQgPSBVcmwucGFyc2UodGFyZ2V0KTtcbiAgdG9IZWFkZXJzLmhvc3QgPSBwYXJzZWRUYXJnZXQuaG9zdDtcbiAgZGVsZXRlIHRvSGVhZGVycy5vcmlnaW47XG4gIGlmIChyZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICB0b0hlYWRlcnMub3JpZ2luID0gcGFyc2VkVGFyZ2V0LnByb3RvY29sISArICcvLycgKyBwYXJzZWRUYXJnZXQuaG9zdDtcbiAgfVxuICBpZiAodG9IZWFkZXJzLnJlZmVyZXIpIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bWF4LWxpbmUtbGVuZ3RoXG4gICAgdG9IZWFkZXJzLnJlZmVyZXIgPSBgJHtwYXJzZWRUYXJnZXQucHJvdG9jb2x9Ly8ke3BhcnNlZFRhcmdldC5ob3N0fSR7VXJsLnBhcnNlKHRvSGVhZGVycy5yZWZlcmVyIGFzIHN0cmluZykucGF0aG5hbWV9YDtcbiAgfVxuICByZXR1cm4gdG9IZWFkZXJzO1xufVxuXG5mdW5jdGlvbiBoYWNrUmVzcG9uc2VIZWFkZXJzKHJlcTogZXhwcmVzcy5SZXF1ZXN0LCBvcmlnaW5IZWFkZXJzOiB7W2s6IHN0cmluZ106IGFueX0sIHJlc3BvbnNlOiBleHByZXNzLlJlc3BvbnNlLFxuICBwcm94eUluc3RhbmNlOiBQcm94eUluc3RhbmNlKSB7XG4gIF8uZWFjaChvcmlnaW5IZWFkZXJzLCAodiwgbikgPT4ge1xuICAgIGlmICghXy5nZXQoU0tJUF9SRVNfSEVBREVSU19TRVQsIG4udG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIGlmIChuID09PSAnc2V0LWNvb2tpZScgJiYgcHJveHlJbnN0YW5jZS5pc1JlbW92ZUNvb2tpZURvbWFpbikge1xuICAgICAgICB2ID0gdi5tYXAoKGNvb2tpZTogYW55KSA9PiB7XG4gICAgICAgICAgdmFyIGF0dHJzOiBzdHJpbmdbXSA9IGNvb2tpZS5zcGxpdCgnOycpO1xuICAgICAgICAgIHJldHVybiBhdHRycy5maWx0ZXIoKHZhbHVlKSA9PiAhdmFsdWUuc3RhcnRzV2l0aCgnZG9tYWluJykpLmpvaW4oJzsnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGxvZy5pbmZvKCdEb21haW4gYXR0cmlidXRlIGlzIHJlbW92ZWQgZnJvbSBzZXQtY29va2llIGhlYWRlcjogJywgdik7XG4gICAgICB9XG4gICAgICByZXNwb25zZS5zZXQobiwgdik7XG4gICAgfSBlbHNlXG4gICAgICBsb2cuZGVidWcoJ3NraXAgcmVzcG9uc2UgaGVhZGVyOiAlcycsIG4pO1xuICB9KTtcbn1cbiJdfQ==
