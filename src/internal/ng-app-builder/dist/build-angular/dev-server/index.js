"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// tslint:disable no-console
require("../../ng/node-inject");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const build_angular_1 = require("@angular-devkit/build-angular");
const architect_1 = require("@angular-devkit/architect");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const drcpCommon = tslib_1.__importStar(require("../../ng/common"));
const change_cli_options_1 = require("../../ng/change-cli-options");
exports.default = architect_1.createBuilder((options, context) => {
    return rxjs_1.from(drcpCommon.initCli(options))
        .pipe(operators_1.concatMap(drcpConfig => {
        return rxjs_1.from(change_cli_options_1.changeAngularCliOptions(drcpConfig, context, options));
    }), operators_1.concatMap((browserOptions) => {
        const drcpBuilderCtx = drcpCommon.newContext({
            builderConfig: options,
            browserOptions,
            ssr: false
        });
        return build_angular_1.executeDevServerBuilder(options, context, {
            webpackConfiguration: (config) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield drcpBuilderCtx.configWebpack(config, { devMode: true });
                return config;
            }),
            indexHtml: (content) => drcpBuilderCtx.transformIndexHtml(content)
        });
    }), operators_1.tap(() => {
        console.log(drawPuppy('You may also run "node app" and access from http://localhost:14333'));
    }));
});
function drawPuppy(slogon = 'Congrads!', message = '') {
    console.log('\n   ' + lodash_1.default.repeat('-', slogon.length) + '\n' +
        ` < ${slogon} >\n` +
        '   ' + lodash_1.default.repeat('-', slogon.length) + '\n' +
        '\t\\   ^__^\n\t \\  (oo)\\_______\n\t    (__)\\       )\\/\\\n\t        ||----w |\n\t        ||     ||');
    if (message)
        console.log(message);
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHItY29yZS9uZy1hcHAtYnVpbGRlci90cy9idWlsZC1hbmd1bGFyL2Rldi1zZXJ2ZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNEJBQTRCO0FBQzVCLGdDQUE4QjtBQUM5Qiw0REFBdUI7QUFDdkIsaUVBQXVIO0FBQ3ZILHlEQUVtQztBQUNuQywrQkFBMEI7QUFDMUIsOENBQThDO0FBQzlDLG9FQUE4QztBQUM5QyxvRUFBb0U7QUFFcEUsa0JBQWUseUJBQWEsQ0FDMUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUU7SUFDbkIsT0FBTyxXQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN2QyxJQUFJLENBQ0gscUJBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUNyQixPQUFPLFdBQUksQ0FBQyw0Q0FBdUIsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDckUsQ0FBQyxDQUFDLEVBQ0YscUJBQVMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFFO1FBQzNCLE1BQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUM7WUFDM0MsYUFBYSxFQUFFLE9BQU87WUFDdEIsY0FBYztZQUNkLEdBQUcsRUFBRSxLQUFLO1NBQ1gsQ0FBQyxDQUFDO1FBQ0gsT0FBTyx1Q0FBdUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFO1lBQy9DLG9CQUFvQixFQUFFLENBQU8sTUFBTSxFQUFFLEVBQUU7Z0JBQ3JDLE1BQU0sY0FBYyxDQUFDLGFBQWEsQ0FBRSxNQUFNLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztnQkFDN0QsT0FBTyxNQUFNLENBQUM7WUFDaEIsQ0FBQyxDQUFBO1lBQ0QsU0FBUyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDO1NBQ25FLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxFQUNGLGVBQUcsQ0FBQyxHQUFHLEVBQUU7UUFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDLENBQUM7SUFDL0YsQ0FBQyxDQUFDLENBQ0gsQ0FBQztBQUNKLENBQUMsQ0FDRixDQUFDO0FBRUYsU0FBUyxTQUFTLENBQUMsTUFBTSxHQUFHLFdBQVcsRUFBRSxPQUFPLEdBQUcsRUFBRTtJQUVuRCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxnQkFBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUk7UUFDdkQsTUFBTSxNQUFNLE1BQU07UUFDbEIsS0FBSyxHQUFHLGdCQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSTtRQUMzQyx3R0FBd0csQ0FBQyxDQUFDO0lBQzVHLElBQUksT0FBTztRQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekIsQ0FBQyIsImZpbGUiOiJub2RlX21vZHVsZXMvQGRyLWNvcmUvbmctYXBwLWJ1aWxkZXIvZGlzdC9idWlsZC1hbmd1bGFyL2Rldi1zZXJ2ZXIvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0c2xpbnQ6ZGlzYWJsZSBuby1jb25zb2xlXG5pbXBvcnQgJy4uLy4uL25nL25vZGUtaW5qZWN0JztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQge2V4ZWN1dGVEZXZTZXJ2ZXJCdWlsZGVyLCBEZXZTZXJ2ZXJCdWlsZGVyT3B0aW9ucywgRGV2U2VydmVyQnVpbGRlck91dHB1dH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXInO1xuaW1wb3J0IHtcbiAgY3JlYXRlQnVpbGRlclxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7ZnJvbX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2NvbmNhdE1hcCwgdGFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgKiBhcyBkcmNwQ29tbW9uIGZyb20gJy4uLy4uL25nL2NvbW1vbic7XG5pbXBvcnQge2NoYW5nZUFuZ3VsYXJDbGlPcHRpb25zfSBmcm9tICcuLi8uLi9uZy9jaGFuZ2UtY2xpLW9wdGlvbnMnO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVCdWlsZGVyPERldlNlcnZlckJ1aWxkZXJPcHRpb25zLCBEZXZTZXJ2ZXJCdWlsZGVyT3V0cHV0PihcbiAgKG9wdGlvbnMsIGNvbnRleHQpID0+IHtcbiAgICByZXR1cm4gZnJvbShkcmNwQ29tbW9uLmluaXRDbGkob3B0aW9ucykpXG4gICAgLnBpcGUoXG4gICAgICBjb25jYXRNYXAoZHJjcENvbmZpZyA9PiB7XG4gICAgICAgIHJldHVybiBmcm9tKGNoYW5nZUFuZ3VsYXJDbGlPcHRpb25zKGRyY3BDb25maWcsIGNvbnRleHQsIG9wdGlvbnMpKTtcbiAgICAgIH0pLFxuICAgICAgY29uY2F0TWFwKChicm93c2VyT3B0aW9ucykgPT4ge1xuICAgICAgICBjb25zdCBkcmNwQnVpbGRlckN0eCA9IGRyY3BDb21tb24ubmV3Q29udGV4dCh7XG4gICAgICAgICAgYnVpbGRlckNvbmZpZzogb3B0aW9ucyxcbiAgICAgICAgICBicm93c2VyT3B0aW9ucyxcbiAgICAgICAgICBzc3I6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZXhlY3V0ZURldlNlcnZlckJ1aWxkZXIob3B0aW9ucywgY29udGV4dCwge1xuICAgICAgICAgIHdlYnBhY2tDb25maWd1cmF0aW9uOiBhc3luYyAoY29uZmlnKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCBkcmNwQnVpbGRlckN0eC5jb25maWdXZWJwYWNrKCBjb25maWcsIHtkZXZNb2RlOiB0cnVlfSk7XG4gICAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgaW5kZXhIdG1sOiAoY29udGVudCkgPT4gZHJjcEJ1aWxkZXJDdHgudHJhbnNmb3JtSW5kZXhIdG1sKGNvbnRlbnQpXG4gICAgICAgIH0pO1xuICAgICAgfSksXG4gICAgICB0YXAoKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkcmF3UHVwcHkoJ1lvdSBtYXkgYWxzbyBydW4gXCJub2RlIGFwcFwiIGFuZCBhY2Nlc3MgZnJvbSBodHRwOi8vbG9jYWxob3N0OjE0MzMzJykpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG4pO1xuXG5mdW5jdGlvbiBkcmF3UHVwcHkoc2xvZ29uID0gJ0NvbmdyYWRzIScsIG1lc3NhZ2UgPSAnJykge1xuXG4gIGNvbnNvbGUubG9nKCdcXG4gICAnICsgXy5yZXBlYXQoJy0nLCBzbG9nb24ubGVuZ3RoKSArICdcXG4nICtcbiAgICBgIDwgJHtzbG9nb259ID5cXG5gICtcbiAgICAnICAgJyArIF8ucmVwZWF0KCctJywgc2xvZ29uLmxlbmd0aCkgKyAnXFxuJyArXG4gICAgJ1xcdFxcXFwgICBeX19eXFxuXFx0IFxcXFwgIChvbylcXFxcX19fX19fX1xcblxcdCAgICAoX18pXFxcXCAgICAgICApXFxcXC9cXFxcXFxuXFx0ICAgICAgICB8fC0tLS13IHxcXG5cXHQgICAgICAgIHx8ICAgICB8fCcpO1xuICBpZiAobWVzc2FnZSlcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn1cbiJdfQ==
