"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ng_html_parser_1 = require("../utils/ng-html-parser");
const patch_text_1 = tslib_1.__importStar(require("../utils/patch-text"));
const __api_1 = tslib_1.__importDefault(require("__api"));
const url_1 = tslib_1.__importDefault(require("url"));
const _ = tslib_1.__importStar(require("lodash"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const chalk = require('chalk');
const log = require('log4js').getLogger('ng-app-builder.html-assets-resolver');
// export enum ReplaceType {
// 	resolveUrl, loadRes
// }
const toCheckNames = ['href', 'src', 'ng-src', 'ng-href', 'srcset', 'routerLink'];
function replaceForHtml(content, resourcePath, callback) {
    const ast = new ng_html_parser_1.TemplateParser(content).parse();
    // const proms: Array<PromiseLike<any>> = [];
    const dones = [];
    const resolver = new AttrAssetsUrlResolver(resourcePath, callback);
    for (const el of ast) {
        for (const name of toCheckNames) {
            if (_.has(el.attrs, name)) {
                const value = el.attrs[name].value;
                if (el.attrs[name].isNg || value == null || value.text.indexOf('{{') >= 0)
                    continue;
                dones.push(resolver.resolve(name, el.attrs[name].value, el));
            }
        }
    }
    if (dones.length > 0)
        return rxjs_1.forkJoin(dones).pipe(operators_1.map(replacements => patch_text_1.default(content, replacements)));
    else
        return rxjs_1.of(content);
}
exports.replaceForHtml = replaceForHtml;
class AttrAssetsUrlResolver {
    constructor(resourcePath, callback) {
        this.resourcePath = resourcePath;
        this.callback = callback;
    }
    resolve(attrName, valueToken, el) {
        if (!valueToken)
            return;
        if (attrName === 'srcset') {
            // img srcset
            const value = this.doSrcSet(valueToken.text);
            return value.pipe(operators_1.map(value => new patch_text_1.Replacement(valueToken.start, valueToken.end, value)));
            // replacements.push(new Rep(valueToken.start, valueToken.end, value));
        }
        else if (attrName === 'src') {
            // img src
            const url = this.doLoadAssets(valueToken.text);
            return url.pipe(operators_1.map(url => new patch_text_1.Replacement(valueToken.start, valueToken.end, url)));
        }
        else if (attrName === 'routerLink') {
            const url = this.resolveUrl(valueToken.text);
            const parsedUrl = url_1.default.parse(url);
            return rxjs_1.of(new patch_text_1.Replacement(valueToken.start, valueToken.end, parsedUrl.path + (parsedUrl.hash ? parsedUrl.hash : '')));
        }
        else { // href, ng-src, routerLink
            const url = this.resolveUrl(valueToken.text);
            return rxjs_1.of(new patch_text_1.Replacement(valueToken.start, valueToken.end, url));
        }
    }
    doSrcSet(value) {
        const urlSets$s = value.split(/\s*,\s*/).map(urlSet => {
            urlSet = _.trim(urlSet);
            const factors = urlSet.split(/\s+/);
            const image = factors[0];
            return this.doLoadAssets(image)
                .pipe(operators_1.map(url => url + factors[1]));
        });
        return rxjs_1.forkJoin(urlSets$s).pipe(operators_1.map(urlSets => urlSets.join(', ')));
    }
    resolveUrl(href) {
        if (href === '')
            return href;
        var res = __api_1.default.normalizeAssetsUrl(href, this.resourcePath);
        if (_.isObject(res)) {
            const resolved = res.isPage ?
                __api_1.default.entryPageUrl(res.packageName, res.path, res.locale) :
                __api_1.default.assetsUrl(res.packageName, res.path);
            log.info(`resolve URL/routePath ${chalk.yellow(href)} to ${chalk.cyan(resolved)},\n` +
                chalk.grey(this.resourcePath));
            return resolved;
        }
        return href;
    }
    doLoadAssets(src) {
        if (src.startsWith('assets://') || src.startsWith('page://')) {
            const res = __api_1.default.normalizeAssetsUrl(src, this.resourcePath);
            if (_.isObject(res)) {
                return rxjs_1.of(res.isPage ?
                    __api_1.default.entryPageUrl(res.packageName, res.path, res.locale) :
                    __api_1.default.assetsUrl(res.packageName, res.path));
            }
        }
        if (/^(?:https?:|\/\/|data:)/.test(src))
            return rxjs_1.of(src);
        if (src.charAt(0) === '/')
            return rxjs_1.of(src);
        if (src.charAt(0) === '~') {
            src = src.substring(1);
        }
        else if (src.startsWith('npm://')) {
            src = src.substring('npm://'.length);
        }
        else if (src.charAt(0) !== '.' && src.trim().length > 0 && src.indexOf('{') < 0)
            src = './' + src;
        return this.callback(src);
    }
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHItY29yZS9uZy1hcHAtYnVpbGRlci90cy9uZy1hb3QtYXNzZXRzL2h0bWwtYXNzZXRzLXJlc29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDREQUFrRjtBQUNsRiwwRUFBa0U7QUFDbEUsMERBQXdCO0FBQ3hCLHNEQUFzQjtBQUN0QixrREFBNEI7QUFDNUIsK0JBQThDO0FBQzlDLDhDQUFtQztBQUNuQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0IsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0FBRS9FLDRCQUE0QjtBQUM1Qix1QkFBdUI7QUFDdkIsSUFBSTtBQUNKLE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUVsRixTQUFnQixjQUFjLENBQUMsT0FBZSxFQUFFLFlBQW9CLEVBQ25FLFFBQThDO0lBQzlDLE1BQU0sR0FBRyxHQUFHLElBQUksK0JBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNoRCw2Q0FBNkM7SUFDN0MsTUFBTSxLQUFLLEdBQXNCLEVBQUUsQ0FBQztJQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLHFCQUFxQixDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNuRSxLQUFLLE1BQU0sRUFBRSxJQUFJLEdBQUcsRUFBRTtRQUNyQixLQUFLLE1BQU0sSUFBSSxJQUFJLFlBQVksRUFBRTtZQUNoQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDMUIsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JB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U0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3ZCO2FBQU0sSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3BDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNyQzthQUFNLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO1lBQ2hGLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBRWxCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMzQixDQUFDO0NBQ0QiLCJmaWxlIjoibm9kZV9tb2R1bGVzL0Bkci1jb3JlL25nLWFwcC1idWlsZGVyL2Rpc3QvbmctYW90LWFzc2V0cy9odG1sLWFzc2V0cy1yZXNvbHZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHtUZW1wbGF0ZVBhcnNlciwgQXR0cmlidXRlVmFsdWVBc3QsIFRhZ0FzdH0gZnJvbSAnLi4vdXRpbHMvbmctaHRtbC1wYXJzZXInO1xuaW1wb3J0IHBhdGNoVGV4dCwge1JlcGxhY2VtZW50IGFzIFJlcH0gZnJvbSAnLi4vdXRpbHMvcGF0Y2gtdGV4dCc7XG5pbXBvcnQgYXBpIGZyb20gJ19fYXBpJztcbmltcG9ydCBVcmwgZnJvbSAndXJsJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YsIGZvcmtKb2lufSBmcm9tICdyeGpzJztcbmltcG9ydCB7bWFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5jb25zdCBjaGFsayA9IHJlcXVpcmUoJ2NoYWxrJyk7XG5jb25zdCBsb2cgPSByZXF1aXJlKCdsb2c0anMnKS5nZXRMb2dnZXIoJ25nLWFwcC1idWlsZGVyLmh0bWwtYXNzZXRzLXJlc29sdmVyJyk7XG5cbi8vIGV4cG9ydCBlbnVtIFJlcGxhY2VUeXBlIHtcbi8vIFx0cmVzb2x2ZVVybCwgbG9hZFJlc1xuLy8gfVxuY29uc3QgdG9DaGVja05hbWVzID0gWydocmVmJywgJ3NyYycsICduZy1zcmMnLCAnbmctaHJlZicsICdzcmNzZXQnLCAncm91dGVyTGluayddO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVwbGFjZUZvckh0bWwoY29udGVudDogc3RyaW5nLCByZXNvdXJjZVBhdGg6IHN0cmluZyxcblx0Y2FsbGJhY2s6ICh0ZXh0OiBzdHJpbmcpID0+IE9ic2VydmFibGU8c3RyaW5nPik6IE9ic2VydmFibGU8c3RyaW5nPiB7XG5cdGNvbnN0IGFzdCA9IG5ldyBUZW1wbGF0ZVBhcnNlcihjb250ZW50KS5wYXJzZSgpO1xuXHQvLyBjb25zdCBwcm9tczogQXJyYXk8UHJvbWlzZUxpa2U8YW55Pj4gPSBbXTtcblx0Y29uc3QgZG9uZXM6IE9ic2VydmFibGU8UmVwPltdID0gW107XG5cdGNvbnN0IHJlc29sdmVyID0gbmV3IEF0dHJBc3NldHNVcmxSZXNvbHZlcihyZXNvdXJjZVBhdGgsIGNhbGxiYWNrKTtcblx0Zm9yIChjb25zdCBlbCBvZiBhc3QpIHtcblx0XHRmb3IgKGNvbnN0IG5hbWUgb2YgdG9DaGVja05hbWVzKSB7XG5cdFx0XHRpZiAoXy5oYXMoZWwuYXR0cnMsIG5hbWUpKSB7XG5cdFx0XHRcdGNvbnN0IHZhbHVlID0gZWwuYXR0cnNbbmFtZV0udmFsdWU7XG5cdFx0XHRcdGlmIChlbC5hdHRyc1tuYW1lXS5pc05nIHx8IHZhbHVlID09IG51bGwgfHwgdmFsdWUudGV4dC5pbmRleE9mKCd7eycpID49IDAgKVxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRkb25lcy5wdXNoKHJlc29sdmVyLnJlc29sdmUobmFtZSwgZWwuYXR0cnNbbmFtZV0udmFsdWUsIGVsKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdGlmIChkb25lcy5sZW5ndGggPiAwKVxuXHRcdHJldHVybiBmb3JrSm9pbihkb25lcykucGlwZShtYXAocmVwbGFjZW1lbnRzID0+IHBhdGNoVGV4dChjb250ZW50LCByZXBsYWNlbWVudHMpKSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gb2YoY29udGVudCk7XG59XG5cbmNsYXNzIEF0dHJBc3NldHNVcmxSZXNvbHZlciB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVzb3VyY2VQYXRoOiBzdHJpbmcsIHByaXZhdGUgY2FsbGJhY2s6ICh0ZXh0OiBzdHJpbmcpID0+IE9ic2VydmFibGU8c3RyaW5nPikge1xuXHR9XG5cdHJlc29sdmUoYXR0ck5hbWU6IHN0cmluZywgdmFsdWVUb2tlbjogQXR0cmlidXRlVmFsdWVBc3QsXG5cdFx0ZWw6IFRhZ0FzdCk6IE9ic2VydmFibGU8UmVwPiB7XG5cdFx0aWYgKCF2YWx1ZVRva2VuKVxuXHRcdFx0cmV0dXJuO1xuXHRcdGlmIChhdHRyTmFtZSA9PT0gJ3NyY3NldCcpIHtcblx0XHRcdC8vIGltZyBzcmNzZXRcblx0XHRcdGNvbnN0IHZhbHVlID0gdGhpcy5kb1NyY1NldCh2YWx1ZVRva2VuLnRleHQpO1xuXHRcdFx0cmV0dXJuIHZhbHVlLnBpcGUobWFwKHZhbHVlID0+IG5ldyBSZXAodmFsdWVUb2tlbi5zdGFydCwgdmFsdWVUb2tlbi5lbmQsIHZhbHVlKSkpO1xuXHRcdFx0Ly8gcmVwbGFjZW1lbnRzLnB1c2gobmV3IFJlcCh2YWx1ZVRva2VuLnN0YXJ0LCB2YWx1ZVRva2VuLmVuZCwgdmFsdWUpKTtcblx0XHR9IGVsc2UgaWYgKGF0dHJOYW1lID09PSAnc3JjJykge1xuXHRcdFx0Ly8gaW1nIHNyY1xuXHRcdFx0Y29uc3QgdXJsID0gdGhpcy5kb0xvYWRBc3NldHModmFsdWVUb2tlbi50ZXh0KTtcblx0XHRcdHJldHVybiB1cmwucGlwZShtYXAodXJsID0+IG5ldyBSZXAodmFsdWVUb2tlbi5zdGFydCwgdmFsdWVUb2tlbi5lbmQsIHVybCkpKTtcblx0XHR9IGVsc2UgaWYgKGF0dHJOYW1lID09PSAncm91dGVyTGluaycpIHtcblx0XHRcdGNvbnN0IHVybCA9IHRoaXMucmVzb2x2ZVVybCh2YWx1ZVRva2VuLnRleHQpO1xuXHRcdFx0Y29uc3QgcGFyc2VkVXJsID0gVXJsLnBhcnNlKHVybCk7XG5cdFx0XHRyZXR1cm4gb2YobmV3IFJlcCh2YWx1ZVRva2VuLnN0YXJ0LCB2YWx1ZVRva2VuLmVuZCwgcGFyc2VkVXJsLnBhdGggKyAocGFyc2VkVXJsLmhhc2ggPyBwYXJzZWRVcmwuaGFzaCA6ICcnKSkpO1xuXHRcdH0gZWxzZSB7IC8vIGhyZWYsIG5nLXNyYywgcm91dGVyTGlua1xuXHRcdFx0Y29uc3QgdXJsID0gdGhpcy5yZXNvbHZlVXJsKHZhbHVlVG9rZW4udGV4dCk7XG5cdFx0XHRyZXR1cm4gb2YobmV3IFJlcCh2YWx1ZVRva2VuLnN0YXJ0LCB2YWx1ZVRva2VuLmVuZCwgdXJsKSk7XG5cdFx0fVxuXHR9XG5cdHByaXZhdGUgZG9TcmNTZXQodmFsdWU6IHN0cmluZykge1xuXHRcdGNvbnN0IHVybFNldHMkcyA9IHZhbHVlLnNwbGl0KC9cXHMqLFxccyovKS5tYXAodXJsU2V0ID0+IHtcblx0XHRcdHVybFNldCA9IF8udHJpbSh1cmxTZXQpO1xuXHRcdFx0Y29uc3QgZmFjdG9ycyA9IHVybFNldC5zcGxpdCgvXFxzKy8pO1xuXHRcdFx0Y29uc3QgaW1hZ2UgPSBmYWN0b3JzWzBdO1xuXHRcdFx0cmV0dXJuIHRoaXMuZG9Mb2FkQXNzZXRzKGltYWdlKVxuXHRcdFx0LnBpcGUobWFwKHVybCA9PiB1cmwgKyBmYWN0b3JzWzFdKSk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZvcmtKb2luKHVybFNldHMkcykucGlwZShtYXAodXJsU2V0cyA9PiB1cmxTZXRzLmpvaW4oJywgJykpKTtcblx0fVxuXG5cdHByaXZhdGUgcmVzb2x2ZVVybChocmVmOiBzdHJpbmcpIHtcblx0XHRpZiAoaHJlZiA9PT0gJycpXG5cdFx0XHRyZXR1cm4gaHJlZjtcblx0XHR2YXIgcmVzID0gYXBpLm5vcm1hbGl6ZUFzc2V0c1VybChocmVmLCB0aGlzLnJlc291cmNlUGF0aCk7XG5cdFx0aWYgKF8uaXNPYmplY3QocmVzKSkge1xuXHRcdFx0Y29uc3QgcmVzb2x2ZWQgPSByZXMuaXNQYWdlID9cblx0XHRcdFx0YXBpLmVudHJ5UGFnZVVybChyZXMucGFja2FnZU5hbWUsIHJlcy5wYXRoLCByZXMubG9jYWxlKSA6XG5cdFx0XHRcdGFwaS5hc3NldHNVcmwocmVzLnBhY2thZ2VOYW1lLCByZXMucGF0aCk7XG5cdFx0XHRsb2cuaW5mbyhgcmVzb2x2ZSBVUkwvcm91dGVQYXRoICR7Y2hhbGsueWVsbG93KGhyZWYpfSB0byAke2NoYWxrLmN5YW4ocmVzb2x2ZWQpfSxcXG5gICtcblx0XHRcdFx0Y2hhbGsuZ3JleSh0aGlzLnJlc291cmNlUGF0aCkpO1xuXHRcdFx0cmV0dXJuIHJlc29sdmVkO1xuXHRcdH1cblx0XHRyZXR1cm4gaHJlZjtcblx0fVxuXG5cdHByaXZhdGUgZG9Mb2FkQXNzZXRzKHNyYzogc3RyaW5nKTogT2JzZXJ2YWJsZTxzdHJpbmc+IHtcblx0XHRpZiAoc3JjLnN0YXJ0c1dpdGgoJ2Fzc2V0czovLycpIHx8IHNyYy5zdGFydHNXaXRoKCdwYWdlOi8vJykpIHtcblx0XHRcdGNvbnN0IHJlcyA9IGFwaS5ub3JtYWxpemVBc3NldHNVcmwoc3JjLCB0aGlzLnJlc291cmNlUGF0aCk7XG5cdFx0XHRpZiAoXy5pc09iamVjdChyZXMpKSB7XG5cdFx0XHRcdHJldHVybiBvZihyZXMuaXNQYWdlID9cblx0XHRcdFx0XHRhcGkuZW50cnlQYWdlVXJsKHJlcy5wYWNrYWdlTmFtZSwgcmVzLnBhdGgsIHJlcy5sb2NhbGUpIDpcblx0XHRcdFx0XHRhcGkuYXNzZXRzVXJsKHJlcy5wYWNrYWdlTmFtZSwgcmVzLnBhdGgpKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoL14oPzpodHRwcz86fFxcL1xcL3xkYXRhOikvLnRlc3Qoc3JjKSlcblx0XHRcdHJldHVybiBvZihzcmMpO1xuXHRcdGlmIChzcmMuY2hhckF0KDApID09PSAnLycpXG5cdFx0XHRyZXR1cm4gb2Yoc3JjKTtcblx0XHRpZiAoc3JjLmNoYXJBdCgwKSA9PT0gJ34nKSB7XG5cdFx0XHRzcmMgPSBzcmMuc3Vic3RyaW5nKDEpO1xuXHRcdH0gZWxzZSBpZiAoc3JjLnN0YXJ0c1dpdGgoJ25wbTovLycpKSB7XG5cdFx0XHRzcmMgPSBzcmMuc3Vic3RyaW5nKCducG06Ly8nLmxlbmd0aCk7XG5cdFx0fSBlbHNlIGlmIChzcmMuY2hhckF0KDApICE9PSAnLicgJiYgc3JjLnRyaW0oKS5sZW5ndGggPiAwICYmIHNyYy5pbmRleE9mKCd7JykgPCAwKVxuXHRcdFx0c3JjID0gJy4vJyArIHNyYztcblxuXHRcdHJldHVybiB0aGlzLmNhbGxiYWNrKHNyYyk7XG5cdH1cbn1cbiJdfQ==