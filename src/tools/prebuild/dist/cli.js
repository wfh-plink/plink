#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const commander_1 = require("commander");
const package_json_1 = tslib_1.__importDefault(require("../package.json"));
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
program.option('--secret', 'secret code for deploy to "prod" environment');
// ----------- deploy ----------
const deployCmd = program.command('deploy <app> <ts-scripts#function-or-shell>')
    .option('--static', 'as an static resource build', true)
    .action((app, scriptsFile) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    const opt = deployCmd.opts();
    yield cfg.init({
        c: program.opts().config.length === 0 ? undefined : program.opts().config,
        prop: program.opts().prop
    });
    logConfig(cfg());
    package_runner_1.prepareLazyNodeInjector({});
    yield require('./cli-deploy').default(opt.static, opt.env, app, scriptsFile);
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
const sendCmd = createEnvOption(program.command('send <app-name> <zip-file> [secret]'))
    .requiredOption('--env <local | dev | test | stage | prod>', 'Deploy target, e.g. one of  "local", "dev", "test", "stage", "prod"')
    .action((appName, zip, secret) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    yield cfg.init({
        c: program.opts().config.length === 0 ? undefined : program.opts().config,
        prop: program.opts().prop
    });
    logConfig(cfg());
    package_runner_1.prepareLazyNodeInjector({});
    require('./_send-patch').send(sendCmd.opts().env, appName, zip, program.opts().secret);
}));
sendCmd.usage(sendCmd.usage() + '\nSend static resource to remote server');
// ------ mockzip --------
const mockzipCmd = program.command('mockzip');
mockzipCmd.option('-d', 'create a mock zip file in specific directory');
mockzipCmd.action(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
    yield cfg.init({
        c: program.opts().config.length === 0 ? undefined : program.opts().config,
        prop: program.opts().prop
    });
    logConfig(cfg());
    const Artifacts = require('./artifacts');
    const fileContent = '' + new Date().toUTCString();
    const file = mockzipCmd.opts().d ? mockzipCmd.opts().d : cfg.resolve('destDir', 'prebuild-mock.zip');
    fs_extra_1.default.mkdirpSync(cfg.resolve('destDir'));
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AYmsvcHJlYnVpbGQvdHMvY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFFQSx5Q0FBNkM7QUFDN0MsMkVBQWlDO0FBR2pDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxtQ0FBbUMsQ0FBc0IsQ0FBQztBQUM5RSxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsc0NBQXNDLENBQUMsQ0FBQztBQUNsRSw0RUFBZ0Y7QUFHaEYsMERBQTBCO0FBQzFCLGdFQUEwQjtBQUkxQiw0REFBNEI7QUFFNUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxtQkFBTyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRS9DLE9BQU8sQ0FBQyxPQUFPLENBQUMsc0JBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM1QixPQUFPLENBQUMsTUFBTSxDQUFDLDRCQUE0QixFQUN6Qyx1RkFBdUYsRUFDdkYsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQWMsQ0FBQyxDQUFDO0FBQ3JELE9BQU8sQ0FBQyxNQUFNLENBQUMsZ0RBQWdELEVBQzdELDhJQUE4SSxFQUM5SSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBYyxDQUFDLENBQUM7QUFDckQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsOENBQThDLENBQUMsQ0FBQztBQUUzRSxnQ0FBZ0M7QUFDaEMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyw2Q0FBNkMsQ0FBQztLQUMvRSxNQUFNLENBQUMsVUFBVSxFQUFFLDZCQUE2QixFQUFFLElBQUksQ0FBQztLQUN2RCxNQUFNLENBQUMsQ0FBTyxHQUFXLEVBQUUsV0FBbUIsRUFBRSxFQUFFO0lBQ2pELE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FB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VSxDQUM5Qyw0RkFBNEYsQ0FBQyxDQUFDLENBQUM7QUFDakcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFakMsU0FBUyxlQUFlLENBQUMsR0FBc0IsRUFBRSxRQUFRLEdBQUcsSUFBSTtJQUM5RCxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFFeEQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSwyQ0FBMkMsRUFBRSw4RkFBOEYsQ0FBQyxDQUFDO0FBQ3JLLENBQUMiLCJmaWxlIjoibm9kZV9tb2R1bGVzL0Biay9wcmVidWlsZC9kaXN0L2NsaS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuaW1wb3J0IGNvbW1hbmRlciwge0NvbW1hbmR9IGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgcGsgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbi8vIGltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGFwaSBmcm9tICdfX2FwaSc7XG5jb25zdCBjZmcgPSByZXF1aXJlKCdkci1jb21wLXBhY2thZ2Uvd2ZoL2xpYi9jb25maWcuanMnKSBhcyB0eXBlb2YgYXBpLmNvbmZpZztcbmNvbnN0IGxvZ0NvbmZpZyA9IHJlcXVpcmUoJ2RyLWNvbXAtcGFja2FnZS93ZmgvbGliL2xvZ0NvbmZpZy5qcycpO1xuaW1wb3J0IHtwcmVwYXJlTGF6eU5vZGVJbmplY3Rvcn0gZnJvbSAnZHItY29tcC1wYWNrYWdlL3dmaC9kaXN0L3BhY2thZ2UtcnVubmVyJztcbmltcG9ydCAqIGFzIF9BcnRpZmFjdHMgZnJvbSAnLi9hcnRpZmFjdHMnO1xuaW1wb3J0ICogYXMgc3AgZnJvbSAnLi9fc2VuZC1wYXRjaCc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIF9wcmVidWlsZFBvc3QgZnJvbSAnLi9wcmVidWlsZC1wb3N0Jztcbi8vIGltcG9ydCB7c3Bhd259IGZyb20gJ2RyLWNvbXAtcGFja2FnZS93ZmgvZGlzdC9wcm9jZXNzLXV0aWxzJztcbmltcG9ydCBfY2xpRGVwbG95IGZyb20gJy4vY2xpLWRlcGxveSc7XG5pbXBvcnQgbG9nNGpzIGZyb20gJ2xvZzRqcyc7XG5cbmNvbnN0IHByb2dyYW0gPSBuZXcgQ29tbWFuZCgpLm5hbWUoJ3ByZWJ1aWxkJyk7XG5cbnByb2dyYW0udmVyc2lvbihway52ZXJzaW9uKTtcbnByb2dyYW0ub3B0aW9uKCctYywgLS1jb25maWcgPGNvbmZpZy1maWxlPicsXG4gICdSZWFkIGNvbmZpZyBmaWxlcywgaWYgdGhlcmUgYXJlIG11bHRpcGxlIGZpbGVzLCB0aGUgbGF0dGVyIG9uZSBvdmVycmlkZXMgcHJldmlvdXMgb25lJyxcbiAgKGN1cnIsIHByZXYpID0+IHByZXYuY29uY2F0KGN1cnIpLCBbXSBhcyBzdHJpbmdbXSk7XG5wcm9ncmFtLm9wdGlvbignLS1wcm9wIDxwcm9wZXJ0eS1wYXRoPXZhbHVlIGFzIEpTT04gfCBsaXRlcmFsPicsXG4gICc8cHJvcGVydHktcGF0aD49PHZhbHVlIGFzIEpTT04gfCBsaXRlcmFsPiAuLi4gZGlyZWN0bHkgc2V0IGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcywgcHJvcGVydHkgbmFtZSBpcyBsb2Rhc2guc2V0KCkgcGF0aC1saWtlIHN0cmluZ1xcbiBlLmcuXFxuJyxcbiAgKGN1cnIsIHByZXYpID0+IHByZXYuY29uY2F0KGN1cnIpLCBbXSBhcyBzdHJpbmdbXSk7XG5wcm9ncmFtLm9wdGlvbignLS1zZWNyZXQnLCAnc2VjcmV0IGNvZGUgZm9yIGRlcGxveSB0byBcInByb2RcIiBlbnZpcm9ubWVudCcpO1xuXG4vLyAtLS0tLS0tLS0tLSBkZXBsb3kgLS0tLS0tLS0tLVxuY29uc3QgZGVwbG95Q21kID0gcHJvZ3JhbS5jb21tYW5kKCdkZXBsb3kgPGFwcD4gPHRzLXNjcmlwdHMjZnVuY3Rpb24tb3Itc2hlbGw+Jylcbi5vcHRpb24oJy0tc3RhdGljJywgJ2FzIGFuIHN0YXRpYyByZXNvdXJjZSBidWlsZCcsIHRydWUpXG4uYWN0aW9uKGFzeW5jIChhcHA6IHN0cmluZywgc2NyaXB0c0ZpbGU6IHN0cmluZykgPT4ge1xuICBjb25zdCBvcHQgPSBkZXBsb3lDbWQub3B0cygpO1xuICBhd2FpdCBjZmcuaW5pdCh7XG4gICAgYzogKHByb2dyYW0ub3B0cygpLmNvbmZpZyBhcyBzdHJpbmdbXSkubGVuZ3RoID09PSAwID8gdW5kZWZpbmVkIDogcHJvZ3JhbS5vcHRzKCkuY29uZmlnLFxuICAgIHByb3A6IChwcm9ncmFtLm9wdHMoKS5wcm9wIGFzIHN0cmluZ1tdKVxuICB9KTtcbiAgbG9nQ29uZmlnKGNmZygpKTtcbiAgcHJlcGFyZUxhenlOb2RlSW5qZWN0b3Ioe30pO1xuXG4gIGF3YWl0IChyZXF1aXJlKCcuL2NsaS1kZXBsb3knKS5kZWZhdWx0IGFzIHR5cGVvZiBfY2xpRGVwbG95KShvcHQuc3RhdGljLCBvcHQuZW52LCBhcHAsIHNjcmlwdHNGaWxlKTtcbn0pO1xuY3JlYXRlRW52T3B0aW9uKGRlcGxveUNtZCk7XG5kZXBsb3lDbWQudXNhZ2UoZGVwbG95Q21kLnVzYWdlKCkgKyAnJyk7XG5cblxuLy8gLS0tLS0tLS0gZ2l0aGFzaCAtLS0tLS0tLS0tXG5jb25zdCBnaXRoYXNoQ21kID0gY3JlYXRlRW52T3B0aW9uKHByb2dyYW0uY29tbWFuZCgnZ2l0aGFzaCcpLCBmYWxzZSlcbi5hY3Rpb24oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBBcnRpZmFjdHM6IHR5cGVvZiBfQXJ0aWZhY3RzID0gcmVxdWlyZSgnLi9hcnRpZmFjdHMnKTtcbiAgaWYgKGdpdGhhc2hDbWQub3B0cygpLmVudikge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKGF3YWl0IEFydGlmYWN0cy5zdHJpbmdpZnlMaXN0VmVyc2lvbnMoZ2l0aGFzaENtZC5vcHRzKCkuZW52KSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coYXdhaXQgQXJ0aWZhY3RzLnN0cmluZ2lmeUxpc3RBbGxWZXJzaW9ucygpKTtcbiAgfVxufSk7XG5cbi8vIC0tLS0tLSBzZW5kIC0tLS0tLS0tXG5jb25zdCBzZW5kQ21kID0gY3JlYXRlRW52T3B0aW9uKHByb2dyYW0uY29tbWFuZCgnc2VuZCA8YXBwLW5hbWU+IDx6aXAtZmlsZT4gW3NlY3JldF0nKSlcbi5yZXF1aXJlZE9wdGlvbignLS1lbnYgPGxvY2FsIHwgZGV2IHwgdGVzdCB8IHN0YWdlIHwgcHJvZD4nLCAnRGVwbG95IHRhcmdldCwgZS5nLiBvbmUgb2YgIFwibG9jYWxcIiwgXCJkZXZcIiwgXCJ0ZXN0XCIsIFwic3RhZ2VcIiwgXCJwcm9kXCInKVxuLmFjdGlvbihhc3luYyAoYXBwTmFtZSwgemlwLCBzZWNyZXQpID0+IHtcbiAgYXdhaXQgY2ZnLmluaXQoe1xuICAgIGM6IChwcm9ncmFtLm9wdHMoKS5jb25maWcgYXMgc3RyaW5nW10pLmxlbmd0aCA9PT0gMCA/IHVuZGVmaW5lZCA6IHByb2dyYW0ub3B0cygpLmNvbmZpZyxcbiAgICBwcm9wOiAocHJvZ3JhbS5vcHRzKCkucHJvcCBhcyBzdHJpbmdbXSlcbiAgfSk7XG4gIGxvZ0NvbmZpZyhjZmcoKSk7XG4gIHByZXBhcmVMYXp5Tm9kZUluamVjdG9yKHt9KTtcblxuICAocmVxdWlyZSgnLi9fc2VuZC1wYXRjaCcpIGFzIHR5cGVvZiBzcCkuc2VuZChzZW5kQ21kLm9wdHMoKS5lbnYsIGFwcE5hbWUsIHppcCwgcHJvZ3JhbS5vcHRzKCkuc2VjcmV0KTtcbn0pO1xuc2VuZENtZC51c2FnZShzZW5kQ21kLnVzYWdlKCkgKyAnXFxuU2VuZCBzdGF0aWMgcmVzb3VyY2UgdG8gcmVtb3RlIHNlcnZlcicpO1xuXG4vLyAtLS0tLS0gbW9ja3ppcCAtLS0tLS0tLVxuY29uc3QgbW9ja3ppcENtZCA9IHByb2dyYW0uY29tbWFuZCgnbW9ja3ppcCcpO1xubW9ja3ppcENtZC5vcHRpb24oJy1kJywgJ2NyZWF0ZSBhIG1vY2sgemlwIGZpbGUgaW4gc3BlY2lmaWMgZGlyZWN0b3J5Jyk7XG5tb2NremlwQ21kLmFjdGlvbihhc3luYyAoKSA9PiB7XG4gIGF3YWl0IGNmZy5pbml0KHtcbiAgICBjOiAocHJvZ3JhbS5vcHRzKCkuY29uZmlnIGFzIHN0cmluZ1tdKS5sZW5ndGggPT09IDAgPyB1bmRlZmluZWQgOiBwcm9ncmFtLm9wdHMoKS5jb25maWcsXG4gICAgcHJvcDogKHByb2dyYW0ub3B0cygpLnByb3AgYXMgc3RyaW5nW10pXG4gIH0pO1xuICBsb2dDb25maWcoY2ZnKCkpO1xuICBjb25zdCBBcnRpZmFjdHM6IHR5cGVvZiBfQXJ0aWZhY3RzID0gcmVxdWlyZSgnLi9hcnRpZmFjdHMnKTtcblxuICBjb25zdCBmaWxlQ29udGVudCA9ICcnICsgbmV3IERhdGUoKS50b1VUQ1N0cmluZygpO1xuXG4gIGNvbnN0IGZpbGUgPSBtb2NremlwQ21kLm9wdHMoKS5kID8gbW9ja3ppcENtZC5vcHRzKCkuZCA6IGNmZy5yZXNvbHZlKCdkZXN0RGlyJywgJ3ByZWJ1aWxkLW1vY2suemlwJyk7XG4gIGZzLm1rZGlycFN5bmMoY2ZnLnJlc29sdmUoJ2Rlc3REaXInKSk7XG5cbiAgYXdhaXQgQXJ0aWZhY3RzLndyaXRlTW9ja1ppcChmaWxlLCBmaWxlQ29udGVudCk7XG4gIGNvbnN0IGxvZyA9IGxvZzRqcy5nZXRMb2dnZXIoJ3ByZWJ1aWxkJyk7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICBsb2cuaW5mbygnTW9jayB6aXA6JywgZmlsZSk7XG59KTtcblxucHJvZ3JhbS51c2FnZShwcm9ncmFtLnVzYWdlKCkgKyBjaGFsay5ibHVlQnJpZ2h0KFxuICAnXFxuUHJlYnVpbGQgYW5kIGRlcGxveSBzdGF0aWMgcmVzb3VyY2UgdG8gZmlsZSBzZXJ2ZXIgYW5kIGNvbXBpbGUgbm9kZSBzZXJ2ZXIgc2lkZSBUUyBmaWxlcycpKTtcbnByb2dyYW0ucGFyc2VBc3luYyhwcm9jZXNzLmFyZ3YpO1xuXG5mdW5jdGlvbiBjcmVhdGVFbnZPcHRpb24oY21kOiBjb21tYW5kZXIuQ29tbWFuZCwgcmVxdWlyZWQgPSB0cnVlKTogUmV0dXJuVHlwZTxjb21tYW5kZXIuQ29tbWFuZFsncmVxdWlyZWRPcHRpb24nXT4ge1xuICBjb25zdCBmdW5jID0gcmVxdWlyZWQgPyBjbWQucmVxdWlyZWRPcHRpb24gOiBjbWQub3B0aW9uO1xuXG4gIHJldHVybiBmdW5jLmNhbGwoY21kLCAnLS1lbnYgPGxvY2FsIHwgZGV2IHwgdGVzdCB8IHN0YWdlIHwgcHJvZD4nLCAndGFyZ2V0IGVudmlyb25tZW50LCBlLmcuIFwibG9jYWxcIiwgXCJkZXZcIiwgXCJ0ZXN0XCIsIFwic3RhZ2VcIiwgXCJwcm9kXCIsIGRlZmF1bHQgYXMgYWxsIGVudmlyb25tZW50Jyk7XG59XG5cbiJdfQ==
