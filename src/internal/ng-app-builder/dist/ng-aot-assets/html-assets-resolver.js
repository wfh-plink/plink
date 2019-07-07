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
    let ast;
    try {
        ast = new ng_html_parser_1.TemplateParser(content).parse();
    }
    catch (e) {
        log.error(`${resourcePath}: template parsing failed\n${content}`, e);
        throw e;
    }
    // const proms: Array<PromiseLike<any>> = [];
    const dones = [];
    const resolver = new AttrAssetsUrlResolver(resourcePath, callback);
    for (const el of ast) {
        // if (el.name === 'script')
        // 	continue;
        for (const name of toCheckNames) {
            if (_.has(el.attrs, name)) {
                const value = el.attrs[name].value;
                if (el.attrs[name].isNg || value == null || value.text.indexOf('{{') >= 0)
                    continue;
                const resolved$ = resolver.resolve(name, value, el);
                if (resolved$)
                    dones.push(resolved$);
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
            return null;
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
        var normalUrlObj = __api_1.default.normalizeAssetsUrl(href, this.resourcePath);
        if (_.isObject(normalUrlObj)) {
            const res = normalUrlObj;
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
            const normalUrlObj = __api_1.default.normalizeAssetsUrl(src, this.resourcePath);
            if (_.isObject(normalUrlObj)) {
                const res = normalUrlObj;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHItY29yZS9uZy1hcHAtYnVpbGRlci90cy9uZy1hb3QtYXNzZXRzL2h0bWwtYXNzZXRzLXJlc29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDREQUFrRjtBQUNsRiwwRUFBa0U7QUFDbEUsMERBQXdCO0FBQ3hCLHNEQUFzQjtBQUN0QixrREFBNEI7QUFDNUIsK0JBQThDO0FBQzlDLDhDQUFtQztBQUNuQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0IsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0FBRS9FLDRCQUE0QjtBQUM1Qix1QkFBdUI7QUFDdkIsSUFBSTtBQUNKLE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUVsRixTQUFnQixjQUFjLENBQUMsT0FBZSxFQUFFLFlBQW9CLEVBQ2xFLFFBQThDO0lBQzlDLElBQUksR0FBYSxDQUFDO0lBQ2xCLElBQUk7UUFDRixHQUFHLEdBQUcsSUFBSSwrQkFBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0tBQzNDO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsWUFBWSw4QkFBOEIsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckUsTUFBTSxDQUFDLENBQUM7S0FDVDtJQUNELDZDQUE2QztJQUM3QyxNQUFNLEtBQUssR0FBc0IsRUFBRSxDQUFDO0lBQ3BDLE1BQU0sUUFBUSxHQUFHLElBQUkscUJBQXFCLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ25FLEtBQUssTUFBTSxFQUFFLElBQUksR0FBRyxFQUFFO1FBQ3BCLDRCQUE0QjtRQUM1QixhQUFh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QzthQUM3QztTQUNGO1FBRUQsSUFBSSx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3JDLE9BQU8sU0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO1lBQ3ZCLE9BQU8sU0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDekIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEI7YUFBTSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbkMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3RDO2FBQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7WUFDL0UsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7UUFFbkIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUM7Q0FDRiIsImZpbGUiOiJub2RlX21vZHVsZXMvQGRyLWNvcmUvbmctYXBwLWJ1aWxkZXIvZGlzdC9uZy1hb3QtYXNzZXRzL2h0bWwtYXNzZXRzLXJlc29sdmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQge1RlbXBsYXRlUGFyc2VyLCBBdHRyaWJ1dGVWYWx1ZUFzdCwgVGFnQXN0fSBmcm9tICcuLi91dGlscy9uZy1odG1sLXBhcnNlcic7XG5pbXBvcnQgcGF0Y2hUZXh0LCB7UmVwbGFjZW1lbnQgYXMgUmVwfSBmcm9tICcuLi91dGlscy9wYXRjaC10ZXh0JztcbmltcG9ydCBhcGkgZnJvbSAnX19hcGknO1xuaW1wb3J0IFVybCBmcm9tICd1cmwnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiwgZm9ya0pvaW59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHttYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmNvbnN0IGNoYWxrID0gcmVxdWlyZSgnY2hhbGsnKTtcbmNvbnN0IGxvZyA9IHJlcXVpcmUoJ2xvZzRqcycpLmdldExvZ2dlcignbmctYXBwLWJ1aWxkZXIuaHRtbC1hc3NldHMtcmVzb2x2ZXInKTtcblxuLy8gZXhwb3J0IGVudW0gUmVwbGFjZVR5cGUge1xuLy8gXHRyZXNvbHZlVXJsLCBsb2FkUmVzXG4vLyB9XG5jb25zdCB0b0NoZWNrTmFtZXMgPSBbJ2hyZWYnLCAnc3JjJywgJ25nLXNyYycsICduZy1ocmVmJywgJ3NyY3NldCcsICdyb3V0ZXJMaW5rJ107XG5cbmV4cG9ydCBmdW5jdGlvbiByZXBsYWNlRm9ySHRtbChjb250ZW50OiBzdHJpbmcsIHJlc291cmNlUGF0aDogc3RyaW5nLFxuICBjYWxsYmFjazogKHRleHQ6IHN0cmluZykgPT4gT2JzZXJ2YWJsZTxzdHJpbmc+KTogT2JzZXJ2YWJsZTxzdHJpbmc+IHtcbiAgbGV0IGFzdDogVGFnQXN0W107XG4gIHRyeSB7XG4gICAgYXN0ID0gbmV3IFRlbXBsYXRlUGFyc2VyKGNvbnRlbnQpLnBhcnNlKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2cuZXJyb3IoYCR7cmVzb3VyY2VQYXRofTogdGVtcGxhdGUgcGFyc2luZyBmYWlsZWRcXG4ke2NvbnRlbnR9YCwgZSk7XG4gICAgdGhyb3cgZTtcbiAgfVxuICAvLyBjb25zdCBwcm9tczogQXJyYXk8UHJvbWlzZUxpa2U8YW55Pj4gPSBbXTtcbiAgY29uc3QgZG9uZXM6IE9ic2VydmFibGU8UmVwPltdID0gW107XG4gIGNvbnN0IHJlc29sdmVyID0gbmV3IEF0dHJBc3NldHNVcmxSZXNvbHZlcihyZXNvdXJjZVBhdGgsIGNhbGxiYWNrKTtcbiAgZm9yIChjb25zdCBlbCBvZiBhc3QpIHtcbiAgICAvLyBpZiAoZWwubmFtZSA9PT0gJ3NjcmlwdCcpXG4gICAgLy8gXHRjb250aW51ZTtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgdG9DaGVja05hbWVzKSB7XG4gICAgICBpZiAoXy5oYXMoZWwuYXR0cnMsIG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZWwuYXR0cnMhW25hbWVdLnZhbHVlO1xuICAgICAgICBpZiAoZWwuYXR0cnMhW25hbWVdLmlzTmcgfHwgdmFsdWUgPT0gbnVsbCB8fCB2YWx1ZS50ZXh0LmluZGV4T2YoJ3t7JykgPj0gMCApXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkJCA9IHJlc29sdmVyLnJlc29sdmUobmFtZSwgdmFsdWUsIGVsKTtcbiAgICAgICAgaWYgKHJlc29sdmVkJClcbiAgICAgICAgICBkb25lcy5wdXNoKHJlc29sdmVkJCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChkb25lcy5sZW5ndGggPiAwKVxuICAgIHJldHVybiBmb3JrSm9pbihkb25lcykucGlwZShtYXAocmVwbGFjZW1lbnRzID0+IHBhdGNoVGV4dChjb250ZW50LCByZXBsYWNlbWVudHMpKSk7XG4gIGVsc2VcbiAgICByZXR1cm4gb2YoY29udGVudCk7XG59XG5cbmNsYXNzIEF0dHJBc3NldHNVcmxSZXNvbHZlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVzb3VyY2VQYXRoOiBzdHJpbmcsIHByaXZhdGUgY2FsbGJhY2s6ICh0ZXh0OiBzdHJpbmcpID0+IE9ic2VydmFibGU8c3RyaW5nPikge1xuICB9XG4gIHJlc29sdmUoYXR0ck5hbWU6IHN0cmluZywgdmFsdWVUb2tlbjogQXR0cmlidXRlVmFsdWVBc3QsXG4gICAgZWw6IFRhZ0FzdCk6IE9ic2VydmFibGU8UmVwPiB8IG51bGwge1xuICAgIGlmICghdmFsdWVUb2tlbilcbiAgICAgIHJldHVybiBudWxsO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gJ3NyY3NldCcpIHtcbiAgICAgIC8vIGltZyBzcmNzZXRcbiAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5kb1NyY1NldCh2YWx1ZVRva2VuLnRleHQpO1xuICAgICAgcmV0dXJuIHZhbHVlLnBpcGUobWFwKHZhbHVlID0+IG5ldyBSZXAodmFsdWVUb2tlbi5zdGFydCwgdmFsdWVUb2tlbi5lbmQsIHZhbHVlKSkpO1xuICAgICAgLy8gcmVwbGFjZW1lbnRzLnB1c2gobmV3IFJlcCh2YWx1ZVRva2VuLnN0YXJ0LCB2YWx1ZVRva2VuLmVuZCwgdmFsdWUpKTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSAnc3JjJykge1xuICAgICAgLy8gaW1nIHNyY1xuICAgICAgY29uc3QgdXJsID0gdGhpcy5kb0xvYWRBc3NldHModmFsdWVUb2tlbi50ZXh0KTtcbiAgICAgIHJldHVybiB1cmwucGlwZShtYXAodXJsID0+IG5ldyBSZXAodmFsdWVUb2tlbi5zdGFydCwgdmFsdWVUb2tlbi5lbmQsIHVybCkpKTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSAncm91dGVyTGluaycpIHtcbiAgICAgIGNvbnN0IHVybCA9IHRoaXMucmVzb2x2ZVVybCh2YWx1ZVRva2VuLnRleHQpO1xuICAgICAgY29uc3QgcGFyc2VkVXJsID0gVXJsLnBhcnNlKHVybCk7XG4gICAgICByZXR1cm4gb2YobmV3IFJlcCh2YWx1ZVRva2VuLnN0YXJ0LCB2YWx1ZVRva2VuLmVuZCwgcGFyc2VkVXJsLnBhdGggKyAocGFyc2VkVXJsLmhhc2ggPyBwYXJzZWRVcmwuaGFzaCA6ICcnKSkpO1xuICAgIH0gZWxzZSB7IC8vIGhyZWYsIG5nLXNyYywgcm91dGVyTGlua1xuICAgICAgY29uc3QgdXJsID0gdGhpcy5yZXNvbHZlVXJsKHZhbHVlVG9rZW4udGV4dCk7XG4gICAgICByZXR1cm4gb2YobmV3IFJlcCh2YWx1ZVRva2VuLnN0YXJ0LCB2YWx1ZVRva2VuLmVuZCwgdXJsKSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgZG9TcmNTZXQodmFsdWU6IHN0cmluZykge1xuICAgIGNvbnN0IHVybFNldHMkcyA9IHZhbHVlLnNwbGl0KC9cXHMqLFxccyovKS5tYXAodXJsU2V0ID0+IHtcbiAgICAgIHVybFNldCA9IF8udHJpbSh1cmxTZXQpO1xuICAgICAgY29uc3QgZmFjdG9ycyA9IHVybFNldC5zcGxpdCgvXFxzKy8pO1xuICAgICAgY29uc3QgaW1hZ2UgPSBmYWN0b3JzWzBdO1xuICAgICAgcmV0dXJuIHRoaXMuZG9Mb2FkQXNzZXRzKGltYWdlKVxuICAgICAgLnBpcGUobWFwKHVybCA9PiB1cmwgKyBmYWN0b3JzWzFdKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZvcmtKb2luKHVybFNldHMkcykucGlwZShtYXAodXJsU2V0cyA9PiB1cmxTZXRzLmpvaW4oJywgJykpKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzb2x2ZVVybChocmVmOiBzdHJpbmcpIHtcbiAgICBpZiAoaHJlZiA9PT0gJycpXG4gICAgICByZXR1cm4gaHJlZjtcbiAgICB2YXIgbm9ybWFsVXJsT2JqID0gYXBpLm5vcm1hbGl6ZUFzc2V0c1VybChocmVmLCB0aGlzLnJlc291cmNlUGF0aCk7XG4gICAgaWYgKF8uaXNPYmplY3Qobm9ybWFsVXJsT2JqKSkge1xuICAgICAgY29uc3QgcmVzID0gbm9ybWFsVXJsT2JqIGFzIGFueTtcbiAgICAgIGNvbnN0IHJlc29sdmVkID0gcmVzLmlzUGFnZSA/XG4gICAgICAgIGFwaS5lbnRyeVBhZ2VVcmwocmVzLnBhY2thZ2VOYW1lLCByZXMucGF0aCwgcmVzLmxvY2FsZSkgOlxuICAgICAgICBhcGkuYXNzZXRzVXJsKHJlcy5wYWNrYWdlTmFtZSwgcmVzLnBhdGgpO1xuICAgICAgbG9nLmluZm8oYHJlc29sdmUgVVJML3JvdXRlUGF0aCAke2NoYWxrLnllbGxvdyhocmVmKX0gdG8gJHtjaGFsay5jeWFuKHJlc29sdmVkKX0sXFxuYCArXG4gICAgICAgIGNoYWxrLmdyZXkodGhpcy5yZXNvdXJjZVBhdGgpKTtcbiAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICB9XG4gICAgcmV0dXJuIGhyZWY7XG4gIH1cblxuICBwcml2YXRlIGRvTG9hZEFzc2V0cyhzcmM6IHN0cmluZyk6IE9ic2VydmFibGU8c3RyaW5nPiB7XG4gICAgaWYgKHNyYy5zdGFydHNXaXRoKCdhc3NldHM6Ly8nKSB8fCBzcmMuc3RhcnRzV2l0aCgncGFnZTovLycpKSB7XG4gICAgICBjb25zdCBub3JtYWxVcmxPYmogPSBhcGkubm9ybWFsaXplQXNzZXRzVXJsKHNyYywgdGhpcy5yZXNvdXJjZVBhdGgpO1xuICAgICAgaWYgKF8uaXNPYmplY3Qobm9ybWFsVXJsT2JqKSkge1xuICAgICAgICBjb25zdCByZXMgPSBub3JtYWxVcmxPYmogYXMgYW55O1xuICAgICAgICByZXR1cm4gb2YocmVzLmlzUGFnZSA/XG4gICAgICAgICAgYXBpLmVudHJ5UGFnZVVybChyZXMucGFja2FnZU5hbWUsIHJlcy5wYXRoLCByZXMubG9jYWxlKSA6XG4gICAgICAgICAgYXBpLmFzc2V0c1VybChyZXMucGFja2FnZU5hbWUsIHJlcy5wYXRoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKC9eKD86aHR0cHM/OnxcXC9cXC98ZGF0YTopLy50ZXN0KHNyYykpXG4gICAgICByZXR1cm4gb2Yoc3JjKTtcbiAgICBpZiAoc3JjLmNoYXJBdCgwKSA9PT0gJy8nKVxuICAgICAgcmV0dXJuIG9mKHNyYyk7XG4gICAgaWYgKHNyYy5jaGFyQXQoMCkgPT09ICd+Jykge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZygxKTtcbiAgICB9IGVsc2UgaWYgKHNyYy5zdGFydHNXaXRoKCducG06Ly8nKSkge1xuICAgICAgc3JjID0gc3JjLnN1YnN0cmluZygnbnBtOi8vJy5sZW5ndGgpO1xuICAgIH0gZWxzZSBpZiAoc3JjLmNoYXJBdCgwKSAhPT0gJy4nICYmIHNyYy50cmltKCkubGVuZ3RoID4gMCAmJiBzcmMuaW5kZXhPZigneycpIDwgMClcbiAgICAgIHNyYyA9ICcuLycgKyBzcmM7XG5cbiAgICByZXR1cm4gdGhpcy5jYWxsYmFjayhzcmMpO1xuICB9XG59XG4iXX0=
