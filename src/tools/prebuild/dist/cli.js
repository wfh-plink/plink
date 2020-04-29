#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const commander_1 = require("commander");
const package_json_1 = tslib_1.__importDefault(require("../package.json"));
const path_1 = tslib_1.__importDefault(require("path"));
const cfg = require('dr-comp-package/wfh/lib/config.js');
const logConfig = require('dr-comp-package/wfh/lib/logConfig.js');
const package_runner_1 = require("dr-comp-package/wfh/dist/package-runner");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const log4js_1 = tslib_1.__importDefault(require("log4js"));
const program = new commander_1.Command().name('prebuild');
program.version(package_json_1.default.version);
program.option('-c, --config <config-file>', 'Read config files, if there are multiple files, the latter one overrides previous one', (curr, prev) => prev.concat(curr), []);
program.option('--prop <property-path=value as JSON | literal>', '<property-path>=<value as JSON | literal> ... directly set configuration properties, property name is lodash.set() path-like string\n e.g.\n', (curr, prev) => prev.concat(curr), []);
program.option('--secret <credential code>', 'credential code for deploy to "prod" environment');
// ----------- deploy ----------
const deployCmd = program.command('deploy <app> [ts-scripts#function-or-shell]')
    .option('--static', 'as an static resource build', false)
    // .option('--secret <secret>', 'credential word')
    .action((app, scriptsFile) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    const opt = deployCmd.opts();
    yield cfg.init({
        c: program.opts().config.length === 0 ? undefined : program.opts().config,
        prop: program.opts().prop
    });
    logConfig(cfg());
    package_runner_1.prepareLazyNodeInjector({});
    yield require('./cli-deploy').default(opt.static, opt.env, app, program.opts().secret || null, scriptsFile);
}));
createEnvOption(deployCmd);
deployCmd.usage(deployCmd.usage() + '');
// -------- githash ----------
const githashCmd = createEnvOption(program.command('githash'), false)
    .action(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
    const Artifacts = require('./artifacts');
    if (githashCmd.opts().env) {
        // tslint:disable-next-line: no-console
        console.log(yield Artifacts.stringifyListVersions(githashCmd.opts().env));
    }
    else {
        // tslint:disable-next-line: no-console
        console.log(yield Artifacts.stringifyListAllVersions());
    }
}));
// ------ send --------
const sendCmd = createEnvOption(program.command('send <app-name> <zip-file>'))
    .action((appName, zip) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    yield cfg.init({
        c: program.opts().config.length === 0 ? undefined : program.opts().config,
        prop: program.opts().prop
    });
    logConfig(cfg());
    package_runner_1.prepareLazyNodeInjector({});
    yield require('./_send-patch').send(sendCmd.opts().env, appName, zip, program.opts().secret);
}));
sendCmd.usage(sendCmd.usage() + '\nSend static resource to remote server');
// ------ mockzip --------
const mockzipCmd = program.command('mockzip');
mockzipCmd.option('-d,--dir <dir>', 'create a mock zip file in specific directory');
mockzipCmd.action(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
    yield cfg.init({
        c: program.opts().config.length === 0 ? undefined : program.opts().config,
        prop: program.opts().prop
    });
    logConfig(cfg());
    const Artifacts = require('./artifacts');
    const fileContent = '' + new Date().toUTCString();
    const file = mockzipCmd.opts().dir ? path_1.default.resolve(mockzipCmd.opts().dir, 'prebuild-mock.zip') : cfg.resolve('destDir', 'prebuild-mock.zip');
    fs_extra_1.default.mkdirpSync(path_1.default.dirname(file));
    yield Artifacts.writeMockZip(file, fileContent);
    const log = log4js_1.default.getLogger('prebuild');
    // tslint:disable-next-line: no-console
    log.info('Mock zip:', file);
}));
program.usage(program.usage() + chalk_1.default.blueBright('\nPrebuild and deploy static resource to file server and compile node server side TS files'));
program.parseAsync(process.argv);
function createEnvOption(cmd, required = true) {
    const func = required ? cmd.requiredOption : cmd.option;
    return func.call(cmd, '--env <local | dev | test | stage | prod>', 'target environment, e.g. "local", "dev", "test", "stage", "prod", default as all environment');
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AYmsvcHJlYnVpbGQvdHMvY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFFQSx5Q0FBNkM7QUFDN0MsMkVBQWlDO0FBQ2pDLHdEQUF3QjtBQUV4QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsbUNBQW1DLENBQXNCLENBQUM7QUFDOUUsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7QUFDbEUsNEVBQWdGO0FBR2hGLDBEQUEwQjtBQUMxQixnRUFBMEI7QUFJMUIsNERBQTRCO0FBRTVCLE1BQU0sT0FBTyxHQUFHLElBQUksbUJBQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUUvQyxPQUFPLENBQUMsT0FBTyxDQUFDLHNCQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDNUIsT0FBTyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsRUFDekMsdUZBQXVGLEVBQ3ZGLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFjLENBQUMsQ0FBQztBQUNyRCxPQUFPLENBQUMsTUFBTSxDQUFDLGdEQUFnRCxFQUM3RCw4SUFBOEksRUFDOUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQWMsQ0FBQyxDQUFDO0FBQ3JELE9BQU8sQ0FBQyxNQUFNLENBQUMsNEJBQTRCLEVBQUUsa0RBQWtELENBQUMsQ0FBQztBQUVqRyxnQ0FBZ0M7QUFDaEMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyw2Q0FBNkMsQ0FBQztLQUMvRSxNQUFNLENBQUMsVUFBVSxFQUFFLDZCQUE2QixFQUFFLEtBQUssQ0FBQztJQUN6RCxrREFBa0Q7S0FDakQsTUFBTSxDQUFDLENBQU8sR0FBVyxFQUFFLFdBQW9CLEVBQUUsRUFBRTtJ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QUFDO0FBRUgsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsZUFBSyxDQUFDLFVBQVUsQ0FDOUMsNEZBQTRGLENBQUMsQ0FBQyxDQUFDO0FBQ2pHLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRWpDLFNBQVMsZUFBZSxDQUFDLEdBQXNCLEVBQUUsUUFBUSxHQUFHLElBQUk7SUFDOUQsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0lBRXhELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsMkNBQTJDLEVBQUUsOEZBQThGLENBQUMsQ0FBQztBQUNySyxDQUFDIiwiZmlsZSI6Im5vZGVfbW9kdWxlcy9AYmsvcHJlYnVpbGQvZGlzdC9jbGkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbmltcG9ydCBjb21tYW5kZXIsIHtDb21tYW5kfSBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IHBrIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBhcGkgZnJvbSAnX19hcGknO1xuY29uc3QgY2ZnID0gcmVxdWlyZSgnZHItY29tcC1wYWNrYWdlL3dmaC9saWIvY29uZmlnLmpzJykgYXMgdHlwZW9mIGFwaS5jb25maWc7XG5jb25zdCBsb2dDb25maWcgPSByZXF1aXJlKCdkci1jb21wLXBhY2thZ2Uvd2ZoL2xpYi9sb2dDb25maWcuanMnKTtcbmltcG9ydCB7cHJlcGFyZUxhenlOb2RlSW5qZWN0b3J9IGZyb20gJ2RyLWNvbXAtcGFja2FnZS93ZmgvZGlzdC9wYWNrYWdlLXJ1bm5lcic7XG5pbXBvcnQgKiBhcyBfQXJ0aWZhY3RzIGZyb20gJy4vYXJ0aWZhY3RzJztcbmltcG9ydCAqIGFzIHNwIGZyb20gJy4vX3NlbmQtcGF0Y2gnO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBfcHJlYnVpbGRQb3N0IGZyb20gJy4vcHJlYnVpbGQtcG9zdCc7XG4vLyBpbXBvcnQge3NwYXdufSBmcm9tICdkci1jb21wLXBhY2thZ2Uvd2ZoL2Rpc3QvcHJvY2Vzcy11dGlscyc7XG5pbXBvcnQgX2NsaURlcGxveSBmcm9tICcuL2NsaS1kZXBsb3knO1xuaW1wb3J0IGxvZzRqcyBmcm9tICdsb2c0anMnO1xuXG5jb25zdCBwcm9ncmFtID0gbmV3IENvbW1hbmQoKS5uYW1lKCdwcmVidWlsZCcpO1xuXG5wcm9ncmFtLnZlcnNpb24ocGsudmVyc2lvbik7XG5wcm9ncmFtLm9wdGlvbignLWMsIC0tY29uZmlnIDxjb25maWctZmlsZT4nLFxuICAnUmVhZCBjb25maWcgZmlsZXMsIGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBmaWxlcywgdGhlIGxhdHRlciBvbmUgb3ZlcnJpZGVzIHByZXZpb3VzIG9uZScsXG4gIChjdXJyLCBwcmV2KSA9PiBwcmV2LmNvbmNhdChjdXJyKSwgW10gYXMgc3RyaW5nW10pO1xucHJvZ3JhbS5vcHRpb24oJy0tcHJvcCA8cHJvcGVydHktcGF0aD12YWx1ZSBhcyBKU09OIHwgbGl0ZXJhbD4nLFxuICAnPHByb3BlcnR5LXBhdGg+PTx2YWx1ZSBhcyBKU09OIHwgbGl0ZXJhbD4gLi4uIGRpcmVjdGx5IHNldCBjb25maWd1cmF0aW9uIHByb3BlcnRpZXMsIHByb3BlcnR5IG5hbWUgaXMgbG9kYXNoLnNldCgpIHBhdGgtbGlrZSBzdHJpbmdcXG4gZS5nLlxcbicsXG4gIChjdXJyLCBwcmV2KSA9PiBwcmV2LmNvbmNhdChjdXJyKSwgW10gYXMgc3RyaW5nW10pO1xucHJvZ3JhbS5vcHRpb24oJy0tc2VjcmV0IDxjcmVkZW50aWFsIGNvZGU+JywgJ2NyZWRlbnRpYWwgY29kZSBmb3IgZGVwbG95IHRvIFwicHJvZFwiIGVudmlyb25tZW50Jyk7XG5cbi8vIC0tLS0tLS0tLS0tIGRlcGxveSAtLS0tLS0tLS0tXG5jb25zdCBkZXBsb3lDbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ2RlcGxveSA8YXBwPiBbdHMtc2NyaXB0cyNmdW5jdGlvbi1vci1zaGVsbF0nKVxuLm9wdGlvbignLS1zdGF0aWMnLCAnYXMgYW4gc3RhdGljIHJlc291cmNlIGJ1aWxkJywgZmFsc2UpXG4vLyAub3B0aW9uKCctLXNlY3JldCA8c2VjcmV0PicsICdjcmVkZW50aWFsIHdvcmQnKVxuLmFjdGlvbihhc3luYyAoYXBwOiBzdHJpbmcsIHNjcmlwdHNGaWxlPzogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IG9wdCA9IGRlcGxveUNtZC5vcHRzKCk7XG4gIGF3YWl0IGNmZy5pbml0KHtcbiAgICBjOiAocHJvZ3JhbS5vcHRzKCkuY29uZmlnIGFzIHN0cmluZ1tdKS5sZW5ndGggPT09IDAgPyB1bmRlZmluZWQgOiBwcm9ncmFtLm9wdHMoKS5jb25maWcsXG4gICAgcHJvcDogKHByb2dyYW0ub3B0cygpLnByb3AgYXMgc3RyaW5nW10pXG4gIH0pO1xuICBsb2dDb25maWcoY2ZnKCkpO1xuICBwcmVwYXJlTGF6eU5vZGVJbmplY3Rvcih7fSk7XG5cbiAgYXdhaXQgKHJlcXVpcmUoJy4vY2xpLWRlcGxveScpLmRlZmF1bHQgYXMgdHlwZW9mIF9jbGlEZXBsb3kpKG9wdC5zdGF0aWMsIG9wdC5lbnYsIGFwcCwgcHJvZ3JhbS5vcHRzKCkuc2VjcmV0IHx8IG51bGwsIHNjcmlwdHNGaWxlKTtcbn0pO1xuY3JlYXRlRW52T3B0aW9uKGRlcGxveUNtZCk7XG5kZXBsb3lDbWQudXNhZ2UoZGVwbG95Q21kLnVzYWdlKCkgKyAnJyk7XG5cblxuLy8gLS0tLS0tLS0gZ2l0aGFzaCAtLS0tLS0tLS0tXG5jb25zdCBnaXRoYXNoQ21kID0gY3JlYXRlRW52T3B0aW9uKHByb2dyYW0uY29tbWFuZCgnZ2l0aGFzaCcpLCBmYWxzZSlcbi5hY3Rpb24oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBBcnRpZmFjdHM6IHR5cGVvZiBfQXJ0aWZhY3RzID0gcmVxdWlyZSgnLi9hcnRpZmFjdHMnKTtcbiAgaWYgKGdpdGhhc2hDbWQub3B0cygpLmVudikge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKGF3YWl0IEFydGlmYWN0cy5zdHJpbmdpZnlMaXN0VmVyc2lvbnMoZ2l0aGFzaENtZC5vcHRzKCkuZW52KSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coYXdhaXQgQXJ0aWZhY3RzLnN0cmluZ2lmeUxpc3RBbGxWZXJzaW9ucygpKTtcbiAgfVxufSk7XG5cbi8vIC0tLS0tLSBzZW5kIC0tLS0tLS0tXG5jb25zdCBzZW5kQ21kID0gY3JlYXRlRW52T3B0aW9uKHByb2dyYW0uY29tbWFuZCgnc2VuZCA8YXBwLW5hbWU+IDx6aXAtZmlsZT4nKSlcbi5hY3Rpb24oYXN5bmMgKGFwcE5hbWUsIHppcCkgPT4ge1xuICBhd2FpdCBjZmcuaW5pdCh7XG4gICAgYzogKHByb2dyYW0ub3B0cygpLmNvbmZpZyBhcyBzdHJpbmdbXSkubGVuZ3RoID09PSAwID8gdW5kZWZpbmVkIDogcHJvZ3JhbS5vcHRzKCkuY29uZmlnLFxuICAgIHByb3A6IChwcm9ncmFtLm9wdHMoKS5wcm9wIGFzIHN0cmluZ1tdKVxuICB9KTtcbiAgbG9nQ29uZmlnKGNmZygpKTtcbiAgcHJlcGFyZUxhenlOb2RlSW5qZWN0b3Ioe30pO1xuXG4gIGF3YWl0IChyZXF1aXJlKCcuL19zZW5kLXBhdGNoJykgYXMgdHlwZW9mIHNwKS5zZW5kKHNlbmRDbWQub3B0cygpLmVudiwgYXBwTmFtZSwgemlwLCBwcm9ncmFtLm9wdHMoKS5zZWNyZXQpO1xufSk7XG5zZW5kQ21kLnVzYWdlKHNlbmRDbWQudXNhZ2UoKSArICdcXG5TZW5kIHN0YXRpYyByZXNvdXJjZSB0byByZW1vdGUgc2VydmVyJyk7XG5cbi8vIC0tLS0tLSBtb2NremlwIC0tLS0tLS0tXG5jb25zdCBtb2NremlwQ21kID0gcHJvZ3JhbS5jb21tYW5kKCdtb2NremlwJyk7XG5tb2NremlwQ21kLm9wdGlvbignLWQsLS1kaXIgPGRpcj4nLCAnY3JlYXRlIGEgbW9jayB6aXAgZmlsZSBpbiBzcGVjaWZpYyBkaXJlY3RvcnknKTtcbm1vY2t6aXBDbWQuYWN0aW9uKGFzeW5jICgpID0+IHtcbiAgYXdhaXQgY2ZnLmluaXQoe1xuICAgIGM6IChwcm9ncmFtLm9wdHMoKS5jb25maWcgYXMgc3RyaW5nW10pLmxlbmd0aCA9PT0gMCA/IHVuZGVmaW5lZCA6IHByb2dyYW0ub3B0cygpLmNvbmZpZyxcbiAgICBwcm9wOiAocHJvZ3JhbS5vcHRzKCkucHJvcCBhcyBzdHJpbmdbXSlcbiAgfSk7XG4gIGxvZ0NvbmZpZyhjZmcoKSk7XG5cbiAgY29uc3QgQXJ0aWZhY3RzOiB0eXBlb2YgX0FydGlmYWN0cyA9IHJlcXVpcmUoJy4vYXJ0aWZhY3RzJyk7XG5cbiAgY29uc3QgZmlsZUNvbnRlbnQgPSAnJyArIG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKTtcblxuICBjb25zdCBmaWxlID0gbW9ja3ppcENtZC5vcHRzKCkuZGlyID8gUGF0aC5yZXNvbHZlKG1vY2t6aXBDbWQub3B0cygpLmRpciwgJ3ByZWJ1aWxkLW1vY2suemlwJykgOiBjZmcucmVzb2x2ZSgnZGVzdERpcicsICdwcmVidWlsZC1tb2NrLnppcCcpO1xuICBmcy5ta2RpcnBTeW5jKFBhdGguZGlybmFtZShmaWxlKSk7XG5cbiAgYXdhaXQgQXJ0aWZhY3RzLndyaXRlTW9ja1ppcChmaWxlLCBmaWxlQ29udGVudCk7XG4gIGNvbnN0IGxvZyA9IGxvZzRqcy5nZXRMb2dnZXIoJ3ByZWJ1aWxkJyk7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICBsb2cuaW5mbygnTW9jayB6aXA6JywgZmlsZSk7XG59KTtcblxucHJvZ3JhbS51c2FnZShwcm9ncmFtLnVzYWdlKCkgKyBjaGFsay5ibHVlQnJpZ2h0KFxuICAnXFxuUHJlYnVpbGQgYW5kIGRlcGxveSBzdGF0aWMgcmVzb3VyY2UgdG8gZmlsZSBzZXJ2ZXIgYW5kIGNvbXBpbGUgbm9kZSBzZXJ2ZXIgc2lkZSBUUyBmaWxlcycpKTtcbnByb2dyYW0ucGFyc2VBc3luYyhwcm9jZXNzLmFyZ3YpO1xuXG5mdW5jdGlvbiBjcmVhdGVFbnZPcHRpb24oY21kOiBjb21tYW5kZXIuQ29tbWFuZCwgcmVxdWlyZWQgPSB0cnVlKTogUmV0dXJuVHlwZTxjb21tYW5kZXIuQ29tbWFuZFsncmVxdWlyZWRPcHRpb24nXT4ge1xuICBjb25zdCBmdW5jID0gcmVxdWlyZWQgPyBjbWQucmVxdWlyZWRPcHRpb24gOiBjbWQub3B0aW9uO1xuXG4gIHJldHVybiBmdW5jLmNhbGwoY21kLCAnLS1lbnYgPGxvY2FsIHwgZGV2IHwgdGVzdCB8IHN0YWdlIHwgcHJvZD4nLCAndGFyZ2V0IGVudmlyb25tZW50LCBlLmcuIFwibG9jYWxcIiwgXCJkZXZcIiwgXCJ0ZXN0XCIsIFwic3RhZ2VcIiwgXCJwcm9kXCIsIGRlZmF1bHQgYXMgYWxsIGVudmlyb25tZW50Jyk7XG59XG5cbiJdfQ==
