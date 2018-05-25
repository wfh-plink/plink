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
/* tslint:disable */
const loader_utils_1 = require("loader-utils");
const postcss = require("postcss");
const url = require("url");
const Path = require("path");
const log = require('log4js').getLogger('postcss-cli-resource');
function wrapUrl(url) {
    let wrappedUrl;
    const hasSingleQuotes = url.indexOf('\'') >= 0;
    if (hasSingleQuotes) {
        wrappedUrl = `"${url}"`;
    }
    else {
        wrappedUrl = `'${url}'`;
    }
    return `url(${wrappedUrl})`;
}
function resolve(file, base, resolver) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield resolver('./' + file, base);
        }
        catch (err) {
            return resolver(file, base);
        }
    });
}
exports.default = postcss.plugin('postcss-cli-resources', (options) => {
    const api = require('__api');
    let { deployUrl, filename, loader } = options;
    const process = (inputUrl, resourceCache) => __awaiter(this, void 0, void 0, function* () {
        inputUrl = replaceAssetsUrl(api, loader.resourcePath, inputUrl);
        // If root-relative or absolute, leave as is
        if (inputUrl.match(/^(?:\w+:\/\/|data:|chrome:|#|\/)/)) {
            return inputUrl;
        }
        // If starts with a caret, remove and return remainder
        // this supports bypassing asset processing
        if (inputUrl.startsWith('^')) {
            return inputUrl.substr(1);
        }
        const cachedUrl = resourceCache.get(inputUrl);
        if (cachedUrl) {
            return cachedUrl;
        }
        const { pathname, hash, search } = url.parse(inputUrl.replace(/\\/g, '/'));
        const resolver = (file, base) => new Promise((resolve, reject) => {
            loader.resolve(base, file, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
        const result = yield resolve(pathname, loader.context, resolver);
        // ------------- hack starts
        let comp = api.findPackageByFile(result);
        let relativeDir = Path.dirname(Path.posix.relative(comp.realPackagePath, result));
        if (relativeDir.startsWith('..'))
            throw new Error('Resource path should not starts with "../", caused by symblink');
        // ------------- hack ends
        return new Promise((resolve, reject) => {
            loader.fs.readFile(result, (err, content) => {
                if (err) {
                    reject(err);
                    return;
                }
                // ----------- hack starts
                const outputPath = relativeDir + '/' + loader_utils_1.interpolateName({ resourcePath: result }, filename, { content });
                // ----------- hack ends
                loader.addDependency(result);
                loader.emitFile(outputPath, content, undefined);
                let outputUrl = outputPath.replace(/\\/g, '/');
                if (hash || search) {
                    outputUrl = url.format({ pathname: outputUrl, hash, search });
                }
                if (deployUrl) {
                    outputUrl = url.resolve(deployUrl, outputUrl);
                }
                resourceCache.set(inputUrl, outputUrl);
                log.info(`Url resource ${outputUrl} from ${loader.resourcePath}`);
                resolve(outputUrl);
            });
        });
    });
    return (root) => {
        const urlDeclarations = [];
        root.walkDecls(decl => {
            if (decl.value && decl.value.includes('url')) {
                urlDeclarations.push(decl);
            }
        });
        if (urlDeclarations.length === 0) {
            return;
        }
        const resourceCache = new Map();
        return Promise.all(urlDeclarations.map((decl) => __awaiter(this, void 0, void 0, function* () {
            const value = decl.value;
            const urlRegex = /url\(\s*(?:"([^"]+)"|'([^']+)'|(.+?))\s*\)/g;
            const segments = [];
            let match;
            let lastIndex = 0;
            let modified = false;
            // tslint:disable-next-line:no-conditional-assignment
            while (match = urlRegex.exec(value)) {
                const originalUrl = match[1] || match[2] || match[3];
                let processedUrl;
                try {
                    processedUrl = yield process(originalUrl, resourceCache);
                }
                catch (err) {
                    loader.emitError(decl.error(err.message, { word: originalUrl }).toString());
                    continue;
                }
                if (lastIndex < match.index) {
                    segments.push(value.slice(lastIndex, match.index));
                }
                if (!processedUrl || originalUrl === processedUrl) {
                    segments.push(match[0]);
                }
                else {
                    segments.push(wrapUrl(processedUrl));
                    modified = true;
                }
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < value.length) {
                segments.push(value.slice(lastIndex));
            }
            if (modified) {
                decl.value = segments.join('');
            }
        })));
    };
});
// -- hack starts
function replaceAssetsUrl(api, file, url) {
    var res = api.normalizeAssetsUrl(url, file);
    if (typeof res === 'string')
        return res;
    else if (res.isTilde)
        return `~${res.packageName}/${res.path}`;
    else
        return api.assetsUrl(res.packageName, res.path);
}
// -- hack ends

//# sourceMappingURL=postcss-cli-resource.js.map
