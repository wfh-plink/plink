"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require('gulp-typescript');
const packageUtils = require('../lib/packageMgr/packageUtils');
const chalk = require('chalk');
const fs = __importStar(require("fs-extra"));
const _ = __importStar(require("lodash"));
const Path = __importStar(require("path"));
const utils_1 = require("./utils");
const gulp = require('gulp');
const through = require('through2');
const chokidar = require('chokidar');
const merge = require('merge2');
const sourcemaps = require('gulp-sourcemaps');
// const mapSources = require('@gulp-sourcemaps/map-sources');
const config = require('../lib/config');
const SEP = Path.sep;
require('../lib/logConfig')(config());
const log = require('log4js').getLogger('wfh.typescript');
exports.tsc = tsc;
// exports.init = init;
const root = config().rootPath;
const nodeModules = Path.join(root, 'node_modules');
/**
 * @param {object} argv
 * argv.watch: boolean
 * argv.package: string[]
 * @param {function} onCompiled () => void
 * @return void
 */
function tsc(argv, onCompiled) {
    // const possibleSrcDirs = ['isom', 'ts'];
    var compGlobs = [];
    // var compStream = [];
    const compDirInfo = new Map(); // {[name: string]: {srcDir: string, destDir: string}}
    const baseTsconfig = require('../tsconfig.json');
    const tsProject = ts.createProject(Object.assign({}, baseTsconfig.compilerOptions, {
        typescript: require('typescript'),
        // Compiler options
        importHelpers: true,
        outDir: '',
        baseUrl: root,
        rootDir: undefined,
        typeRoots: [
            Path.join(root, 'node_modules/@types'),
            Path.join(Path.dirname(require.resolve('dr-comp-package/package.json')), '/wfh/types')
        ]
    }));
    if (argv.package.length > 0)
        packageUtils.findAllPackages(argv.package, onComponent, 'src');
    else if (argv.project && argv.project.length > 0) {
        packageUtils.findAllPackages(onComponent, 'src', argv.project);
    }
    else
        packageUtils.findAllPackages(onComponent, 'src');
    function onComponent(name, entryPath, parsedName, json, packagePath) {
        const dirs = utils_1.getTsDirsOfPackage(json);
        const srcDirs = [dirs.srcDir, dirs.isomDir].filter(srcDir => {
            try {
                return fs.statSync(Path.join(packagePath, srcDir)).isDirectory();
            }
            catch (e) {
                return false;
            }
        });
        compDirInfo.set(name, {
            tsDirs: dirs,
            dir: packagePath
        });
        srcDirs.forEach(srcDir => {
            compGlobs.push(Path.resolve(packagePath, srcDir).replace(/\\/g, '/') + '/**/*.ts');
        });
    }
    const delayCompile = _.debounce(() => {
        const toCompile = compGlobs;
        compGlobs = [];
        promCompile = promCompile.catch(() => { })
            .then(() => compile(toCompile, tsProject, compDirInfo, argv.sourceMap === 'inline'))
            .catch(() => { });
        if (onCompiled)
            promCompile = promCompile.then(onCompiled);
    }, 200);
    var promCompile = Promise.resolve();
    if (argv.watch) {
        log.info('Watch mode');
        const watchDirs = [];
        compGlobs = [];
        for (const info of compDirInfo.values()) {
            [info.tsDirs.srcDir, info.tsDirs.isomDir].forEach(srcDir => {
                watchDirs.push(Path.join(info.dir, srcDir).replace(/\\/g, '/') + '/**/*.ts');
            });
        }
        const watcher = chokidar.watch(watchDirs, { ignored: /(\.d\.ts|\.js)$/ });
        watcher.on('add', (path) => onChangeFile(path, 'added'));
        watcher.on('change', (path) => onChangeFile(path, 'changed'));
        watcher.on('unlink', (path) => onChangeFile(path, 'removed'));
    }
    else {
        return compile(compGlobs, tsProject, compDirInfo, argv.sourceMap === 'inline');
    }
    function onChangeFile(path, reason) {
        if (reason !== 'removed')
            compGlobs.push(path);
        log.info(`File ${chalk.cyan(Path.relative(root, path))} has been ` + chalk.yellow(reason));
        delayCompile();
    }
    return promCompile;
}
function compile(compGlobs, tsProject, compDirInfo, inlineSourceMap) {
    const gulpBase = root + SEP;
    const startTime = new Date().getTime();
    function printDuration(isError) {
        const sec = Math.ceil((new Date().getTime() - startTime) / 1000);
        const min = `${Math.floor(sec / 60)} minutes ${sec % 60} secends`;
        log.info(`Compiled ${isError ? 'with errors ' : ''}in ` + min);
    }
    function changePath() {
        return through.obj(function (file, en, next) {
            const shortPath = Path.relative(nodeModules, file.path);
            let packageName = /^((?:@[^/\\]+[/\\])?[^/\\]+)/.exec(shortPath)[1];
            if (SEP === '\\')
                packageName = packageName.replace(/\\/g, '/');
            if (!compDirInfo.has(packageName)) {
                throw new Error('Cound not find package info for:' + file);
            }
            const { tsDirs, dir } = compDirInfo.get(packageName);
            const packageRelPath = Path.relative(dir, file.path).replace(/\\/g, '/');
            [tsDirs.srcDir, tsDirs.isomDir].some(srcDir => {
                if (packageRelPath.indexOf(srcDir + '/') === 0) {
                    if (srcDir === 'ts') {
                        file.path = Path.resolve(nodeModules, packageName, tsDirs.destDir, shortPath.substring(packageName.length + 1 + (srcDir.length > 0 ? srcDir.length + 1 : 0)));
                    }
                    return true;
                }
                return false;
            });
            next(null, file);
        });
    }
    return new Promise((resolve, reject) => {
        const compileErrors = [];
        const tsResult = gulp.src(compGlobs)
            .pipe(sourcemaps.init())
            .pipe(through.obj(function (file, en, next) {
            file.base = gulpBase;
            next(null, file);
        }))
            .pipe(tsProject())
            .on('error', (err) => {
            compileErrors.push(err.message);
        });
        const jsStream = tsResult.js
            .pipe(changePath())
            .pipe(inlineSourceMap ? sourcemaps.write() : sourcemaps.write('.', { includeContent: false, sourceRoot: '' }))
            .pipe(through.obj(function (file, en, next) {
            if (file.extname === '.map') {
                const sm = JSON.parse(file.contents.toString());
                let sFileDir;
                sm.sources =
                    sm.sources.map((spath) => {
                        const realFile = fs.realpathSync(spath);
                        sFileDir = Path.dirname(realFile);
                        return Path.relative(file.base, realFile).replace(/\\/g, '/');
                    });
                if (sFileDir)
                    sm.sourceRoot = Path.relative(sFileDir, file.base).replace(/\\/g, '/');
                file.contents = Buffer.from(JSON.stringify(sm), 'utf8');
            }
            next(null, file);
        }));
        const all = merge([jsStream, tsResult.dts.pipe(changePath())])
            .pipe(through.obj(function (file, en, next) {
            log.info('%s %s Kb', Path.relative(nodeModules, file.path), chalk.blue(Math.round(file.contents.length / 1024 * 10) / 10));
            next(null, file);
        }))
            .pipe(gulp.dest(root));
        all.resume();
        all.on('end', () => {
            if (compileErrors.length > 0) {
                /* tslint:disable no-console */
                console.log('\n---------- Failed to compile Typescript files, check out below error message -------------\n');
                compileErrors.forEach(msg => log.error(msg));
                return reject(new Error(compileErrors.join(',')));
            }
            resolve();
        });
        all.on('error', reject);
    })
        .then(() => {
        printDuration(false);
    })
        .catch(err => {
        printDuration(true);
        return Promise.reject(err);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHMtY21kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdHMvdHMtY21kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3RDLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQy9ELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQiw2Q0FBK0I7QUFDL0IsMENBQTRCO0FBQzVCLDJDQUE2QjtBQUM3QixtQ0FBMEQ7QUFDMUQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNwQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDckMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2hDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzlDLDhEQUE4RDtBQUM5RCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDeEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUVyQixPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3RDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUUxRCxPQUFPLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUNsQix1QkFBdUI7QUFDdkIsTUFBTSxJQUFJLEdBQUcsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDO0FBQy9CLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFB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Q0FBQyxnR0FBZ0csQ0FBQyxDQUFDO2dCQUM5RyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNsRDtZQUNELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQyxDQUFDLENBQUM7UUFDSCxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6QixDQUFDLENBQUM7U0FDRCxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ1YsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RCLENBQUMsQ0FBQztTQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNaLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgdHMgPSByZXF1aXJlKCdndWxwLXR5cGVzY3JpcHQnKTtcbmNvbnN0IHBhY2thZ2VVdGlscyA9IHJlcXVpcmUoJy4uL2xpYi9wYWNrYWdlTWdyL3BhY2thZ2VVdGlscycpO1xuY29uc3QgY2hhbGsgPSByZXF1aXJlKCdjaGFsaycpO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7Z2V0VHNEaXJzT2ZQYWNrYWdlLCBQYWNrYWdlVHNEaXJzfSBmcm9tICcuL3V0aWxzJztcbmNvbnN0IGd1bHAgPSByZXF1aXJlKCdndWxwJyk7XG5jb25zdCB0aHJvdWdoID0gcmVxdWlyZSgndGhyb3VnaDInKTtcbmNvbnN0IGNob2tpZGFyID0gcmVxdWlyZSgnY2hva2lkYXInKTtcbmNvbnN0IG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UyJyk7XG5jb25zdCBzb3VyY2VtYXBzID0gcmVxdWlyZSgnZ3VscC1zb3VyY2VtYXBzJyk7XG4vLyBjb25zdCBtYXBTb3VyY2VzID0gcmVxdWlyZSgnQGd1bHAtc291cmNlbWFwcy9tYXAtc291cmNlcycpO1xuY29uc3QgY29uZmlnID0gcmVxdWlyZSgnLi4vbGliL2NvbmZpZycpO1xuY29uc3QgU0VQID0gUGF0aC5zZXA7XG5cbnJlcXVpcmUoJy4uL2xpYi9sb2dDb25maWcnKShjb25maWcoKSk7XG5jb25zdCBsb2cgPSByZXF1aXJlKCdsb2c0anMnKS5nZXRMb2dnZXIoJ3dmaC50eXBlc2NyaXB0Jyk7XG5cbmV4cG9ydHMudHNjID0gdHNjO1xuLy8gZXhwb3J0cy5pbml0ID0gaW5pdDtcbmNvbnN0IHJvb3QgPSBjb25maWcoKS5yb290UGF0aDtcbmNvbnN0IG5vZGVNb2R1bGVzID0gUGF0aC5qb2luKHJvb3QsICdub2RlX21vZHVsZXMnKTtcblxuaW50ZXJmYWNlIEFyZ3Mge1xuXHRwYWNrYWdlOiBzdHJpbmdbXTtcblx0cHJvamVjdDogc3RyaW5nW107XG5cdHdhdGNoOiBib29sZWFuO1xuXHRzb3VyY2VNYXA6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIENvbXBvbmVudERpckluZm8ge1xuXHR0c0RpcnM6IFBhY2thZ2VUc0RpcnM7XG5cdGRpcjogc3RyaW5nO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7b2JqZWN0fSBhcmd2XG4gKiBhcmd2LndhdGNoOiBib29sZWFuXG4gKiBhcmd2LnBhY2thZ2U6IHN0cmluZ1tdXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvbkNvbXBpbGVkICgpID0+IHZvaWRcbiAqIEByZXR1cm4gdm9pZFxuICovXG5mdW5jdGlvbiB0c2MoYXJndjogQXJncywgb25Db21waWxlZDogKCkgPT4gdm9pZCkge1xuXHQvLyBjb25zdCBwb3NzaWJsZVNyY0RpcnMgPSBbJ2lzb20nLCAndHMnXTtcblx0dmFyIGNvbXBHbG9iczogc3RyaW5nW10gPSBbXTtcblx0Ly8gdmFyIGNvbXBTdHJlYW0gPSBbXTtcblx0Y29uc3QgY29tcERpckluZm86IE1hcDxzdHJpbmcsIENvbXBvbmVudERpckluZm8+ID0gbmV3IE1hcCgpOyAvLyB7W25hbWU6IHN0cmluZ106IHtzcmNEaXI6IHN0cmluZywgZGVzdERpcjogc3RyaW5nfX1cblx0Y29uc3QgYmFzZVRzY29uZmlnID0gcmVxdWlyZSgnLi4vdHNjb25maWcuanNvbicpO1xuXG5cdGNvbnN0IHRzUHJvamVjdCA9IHRzLmNyZWF0ZVByb2plY3QoT2JqZWN0LmFzc2lnbih7fSwgYmFzZVRzY29uZmlnLmNvbXBpbGVyT3B0aW9ucywge1xuXHRcdHR5cGVzY3JpcHQ6IHJlcXVpcmUoJ3R5cGVzY3JpcHQnKSxcblx0XHQvLyBDb21waWxlciBvcHRpb25zXG5cdFx0aW1wb3J0SGVscGVyczogdHJ1ZSxcblx0XHRvdXREaXI6ICcnLFxuXHRcdGJhc2VVcmw6IHJvb3QsXG5cdFx0cm9vdERpcjogdW5kZWZpbmVkLFxuXHRcdHR5cGVSb290czogW1xuXHRcdFx0UGF0aC5qb2luKHJvb3QsICdub2RlX21vZHVsZXMvQHR5cGVzJyksXG5cdFx0XHRQYXRoLmpvaW4oUGF0aC5kaXJuYW1lKHJlcXVpcmUucmVzb2x2ZSgnZHItY29tcC1wYWNrYWdlL3BhY2thZ2UuanNvbicpKSwgJy93ZmgvdHlwZXMnKVxuXHRcdF1cblx0fSkpO1xuXHRpZiAoYXJndi5wYWNrYWdlLmxlbmd0aCA+IDApXG5cdFx0cGFja2FnZVV0aWxzLmZpbmRBbGxQYWNrYWdlcyhhcmd2LnBhY2thZ2UsIG9uQ29tcG9uZW50LCAnc3JjJyk7XG5cdGVsc2UgaWYgKGFyZ3YucHJvamVjdCAmJiBhcmd2LnByb2plY3QubGVuZ3RoID4gMCkge1xuXHRcdHBhY2thZ2VVdGlscy5maW5kQWxsUGFja2FnZXMob25Db21wb25lbnQsICdzcmMnLCBhcmd2LnByb2plY3QpO1xuXHR9IGVsc2Vcblx0XHRwYWNrYWdlVXRpbHMuZmluZEFsbFBhY2thZ2VzKG9uQ29tcG9uZW50LCAnc3JjJyk7XG5cblx0ZnVuY3Rpb24gb25Db21wb25lbnQobmFtZTogc3RyaW5nLCBlbnRyeVBhdGg6IHN0cmluZywgcGFyc2VkTmFtZTogc3RyaW5nLCBqc29uOiBhbnksIHBhY2thZ2VQYXRoOiBzdHJpbmcpIHtcblx0XHRjb25zdCBkaXJzID0gZ2V0VHNEaXJzT2ZQYWNrYWdlKGpzb24pO1xuXHRcdGNvbnN0IHNyY0RpcnMgPSBbZGlycy5zcmNEaXIsIGRpcnMuaXNvbURpcl0uZmlsdGVyKHNyY0RpciA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gZnMuc3RhdFN5bmMoUGF0aC5qb2luKHBhY2thZ2VQYXRoLCBzcmNEaXIpKS5pc0RpcmVjdG9yeSgpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Y29tcERpckluZm8uc2V0KG5hbWUsIHtcblx0XHRcdHRzRGlyczogZGlycyxcblx0XHRcdGRpcjogcGFja2FnZVBhdGhcblx0XHR9KTtcblx0XHRzcmNEaXJzLmZvckVhY2goc3JjRGlyID0+IHtcblx0XHRcdGNvbXBHbG9icy5wdXNoKFBhdGgucmVzb2x2ZShwYWNrYWdlUGF0aCwgc3JjRGlyKS5yZXBsYWNlKC9cXFxcL2csICcvJykgKyAnLyoqLyoudHMnKTtcblx0XHR9KTtcblx0fVxuXG5cdGNvbnN0IGRlbGF5Q29tcGlsZSA9IF8uZGVib3VuY2UoKCkgPT4ge1xuXHRcdGNvbnN0IHRvQ29tcGlsZSA9IGNvbXBHbG9icztcblx0XHRjb21wR2xvYnMgPSBbXTtcblx0XHRwcm9tQ29tcGlsZSA9IHByb21Db21waWxlLmNhdGNoKCgpID0+IHt9KVxuXHRcdFx0LnRoZW4oKCkgPT4gY29tcGlsZSh0b0NvbXBpbGUsIHRzUHJvamVjdCwgY29tcERpckluZm8sIGFyZ3Yuc291cmNlTWFwID09PSAnaW5saW5lJykpXG5cdFx0XHQuY2F0Y2goKCkgPT4ge30pO1xuXHRcdGlmIChvbkNvbXBpbGVkKVxuXHRcdFx0cHJvbUNvbXBpbGUgPSBwcm9tQ29tcGlsZS50aGVuKG9uQ29tcGlsZWQpO1xuXHR9LCAyMDApO1xuXG5cdHZhciBwcm9tQ29tcGlsZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuXHRpZiAoYXJndi53YXRjaCkge1xuXHRcdGxvZy5pbmZvKCdXYXRjaCBtb2RlJyk7XG5cdFx0Y29uc3Qgd2F0Y2hEaXJzOiBzdHJpbmdbXSA9IFtdO1xuXHRcdGNvbXBHbG9icyA9IFtdO1xuXG5cdFx0Zm9yIChjb25zdCBpbmZvIG9mIGNvbXBEaXJJbmZvLnZhbHVlcygpKSB7XG5cdFx0XHRbaW5mby50c0RpcnMuc3JjRGlyLCBpbmZvLnRzRGlycy5pc29tRGlyXS5mb3JFYWNoKHNyY0RpciA9PiB7XG5cdFx0XHRcdHdhdGNoRGlycy5wdXNoKFBhdGguam9pbihpbmZvLmRpciwgc3JjRGlyKS5yZXBsYWNlKC9cXFxcL2csICcvJykgKyAnLyoqLyoudHMnKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRjb25zdCB3YXRjaGVyID0gY2hva2lkYXIud2F0Y2god2F0Y2hEaXJzLCB7aWdub3JlZDogLyhcXC5kXFwudHN8XFwuanMpJC8gfSk7XG5cdFx0d2F0Y2hlci5vbignYWRkJywgKHBhdGg6IHN0cmluZykgPT4gb25DaGFuZ2VGaWxlKHBhdGgsICdhZGRlZCcpKTtcblx0XHR3YXRjaGVyLm9uKCdjaGFuZ2UnLCAocGF0aDogc3RyaW5nKSA9PiBvbkNoYW5nZUZpbGUocGF0aCwgJ2NoYW5nZWQnKSk7XG5cdFx0d2F0Y2hlci5vbigndW5saW5rJywgKHBhdGg6IHN0cmluZykgPT4gb25DaGFuZ2VGaWxlKHBhdGgsICdyZW1vdmVkJykpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBjb21waWxlKGNvbXBHbG9icywgdHNQcm9qZWN0LCBjb21wRGlySW5mbywgYXJndi5zb3VyY2VNYXAgPT09ICdpbmxpbmUnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIG9uQ2hhbmdlRmlsZShwYXRoOiBzdHJpbmcsIHJlYXNvbjogc3RyaW5nKSB7XG5cdFx0aWYgKHJlYXNvbiAhPT0gJ3JlbW92ZWQnKVxuXHRcdFx0Y29tcEdsb2JzLnB1c2gocGF0aCk7XG5cdFx0bG9nLmluZm8oYEZpbGUgJHtjaGFsay5jeWFuKFBhdGgucmVsYXRpdmUocm9vdCwgcGF0aCkpfSBoYXMgYmVlbiBgICsgY2hhbGsueWVsbG93KHJlYXNvbikpO1xuXHRcdGRlbGF5Q29tcGlsZSgpO1xuXHR9XG5cblx0cmV0dXJuIHByb21Db21waWxlO1xufVxuXG5mdW5jdGlvbiBjb21waWxlKGNvbXBHbG9iczogc3RyaW5nW10sIHRzUHJvamVjdDogYW55LFxuXHRjb21wRGlySW5mbzogTWFwPHN0cmluZywgQ29tcG9uZW50RGlySW5mbz4sIGlubGluZVNvdXJjZU1hcDogYm9vbGVhbikge1xuXHRjb25zdCBndWxwQmFzZSA9IHJvb3QgKyBTRVA7XG5cdGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG5cdGZ1bmN0aW9uIHByaW50RHVyYXRpb24oaXNFcnJvcjogYm9vbGVhbikge1xuXHRcdGNvbnN0IHNlYyA9IE1hdGguY2VpbCgobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUpIC8gMTAwMCk7XG5cdFx0Y29uc3QgbWluID0gYCR7TWF0aC5mbG9vcihzZWMgLyA2MCl9IG1pbnV0ZXMgJHtzZWMgJSA2MH0gc2VjZW5kc2A7XG5cdFx0bG9nLmluZm8oYENvbXBpbGVkICR7aXNFcnJvciA/ICd3aXRoIGVycm9ycyAnIDogJyd9aW4gYCArIG1pbik7XG5cdH1cblxuXHRmdW5jdGlvbiBjaGFuZ2VQYXRoKCkge1xuXHRcdHJldHVybiB0aHJvdWdoLm9iaihmdW5jdGlvbihmaWxlOiBhbnksIGVuOiBzdHJpbmcsIG5leHQ6ICguLi5hcmc6IGFueVtdKSA9PiB2b2lkKSB7XG5cdFx0XHRjb25zdCBzaG9ydFBhdGggPSBQYXRoLnJlbGF0aXZlKG5vZGVNb2R1bGVzLCBmaWxlLnBhdGgpO1xuXHRcdFx0bGV0IHBhY2thZ2VOYW1lID0gL14oKD86QFteL1xcXFxdK1svXFxcXF0pP1teL1xcXFxdKykvLmV4ZWMoc2hvcnRQYXRoKSFbMV07XG5cdFx0XHRpZiAoU0VQID09PSAnXFxcXCcpXG5cdFx0XHRcdHBhY2thZ2VOYW1lID0gcGFja2FnZU5hbWUucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXHRcdFx0aWYgKCFjb21wRGlySW5mby5oYXMocGFja2FnZU5hbWUpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignQ291bmQgbm90IGZpbmQgcGFja2FnZSBpbmZvIGZvcjonICsgZmlsZSk7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCB7dHNEaXJzLCBkaXJ9ID0gY29tcERpckluZm8uZ2V0KHBhY2thZ2VOYW1lKSE7XG5cdFx0XHRjb25zdCBwYWNrYWdlUmVsUGF0aCA9IFBhdGgucmVsYXRpdmUoZGlyLCBmaWxlLnBhdGgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblx0XHRcdFt0c0RpcnMuc3JjRGlyLCB0c0RpcnMuaXNvbURpcl0uc29tZShzcmNEaXIgPT4ge1xuXHRcdFx0XHRpZiAocGFja2FnZVJlbFBhdGguaW5kZXhPZihzcmNEaXIgKyAnLycpID09PSAwKSB7XG5cdFx0XHRcdFx0aWYgKHNyY0RpciA9PT0gJ3RzJykge1xuXHRcdFx0XHRcdFx0ZmlsZS5wYXRoID0gUGF0aC5yZXNvbHZlKG5vZGVNb2R1bGVzLCBwYWNrYWdlTmFtZSwgdHNEaXJzLmRlc3REaXIsXG5cdFx0XHRcdFx0XHRcdHNob3J0UGF0aC5zdWJzdHJpbmcocGFja2FnZU5hbWUubGVuZ3RoICsgMSArIChzcmNEaXIubGVuZ3RoID4gMCA/IHNyY0Rpci5sZW5ndGggKyAxIDogMCkpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fSk7XG5cdFx0XHRuZXh0KG51bGwsIGZpbGUpO1xuXHRcdH0pO1xuXHR9XG5cblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCBjb21waWxlRXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXHRcdGNvbnN0IHRzUmVzdWx0ID0gZ3VscC5zcmMoY29tcEdsb2JzKVxuXHRcdC5waXBlKHNvdXJjZW1hcHMuaW5pdCgpKVxuXHRcdC5waXBlKHRocm91Z2gub2JqKGZ1bmN0aW9uKGZpbGU6IGFueSwgZW46IHN0cmluZywgbmV4dDogKC4uLmFyZzogYW55W10pID0+IHZvaWQpIHtcblx0XHRcdGZpbGUuYmFzZSA9IGd1bHBCYXNlO1xuXHRcdFx0bmV4dChudWxsLCBmaWxlKTtcblx0XHR9KSlcblx0XHQucGlwZSh0c1Byb2plY3QoKSlcblx0XHQub24oJ2Vycm9yJywgKGVycjogRXJyb3IpID0+IHtcblx0XHRcdGNvbXBpbGVFcnJvcnMucHVzaChlcnIubWVzc2FnZSk7XG5cdFx0fSk7XG5cblx0XHRjb25zdCBqc1N0cmVhbSA9IHRzUmVzdWx0LmpzXG5cdFx0LnBpcGUoY2hhbmdlUGF0aCgpKVxuXHRcdC5waXBlKGlubGluZVNvdXJjZU1hcCA/IHNvdXJjZW1hcHMud3JpdGUoKSA6IHNvdXJjZW1hcHMud3JpdGUoJy4nLCB7aW5jbHVkZUNvbnRlbnQ6IGZhbHNlLCBzb3VyY2VSb290OiAnJ30pKVxuXHRcdC5waXBlKHRocm91Z2gub2JqKGZ1bmN0aW9uKGZpbGU6IGFueSwgZW46IHN0cmluZywgbmV4dDogKC4uLmFyZzogYW55W10pID0+IHZvaWQpIHtcblx0XHRcdGlmIChmaWxlLmV4dG5hbWUgPT09ICcubWFwJykge1xuXHRcdFx0XHRjb25zdCBzbSA9IEpTT04ucGFyc2UoZmlsZS5jb250ZW50cy50b1N0cmluZygpKTtcblx0XHRcdFx0bGV0IHNGaWxlRGlyO1xuXHRcdFx0XHRzbS5zb3VyY2VzID1cblx0XHRcdFx0XHRzbS5zb3VyY2VzLm1hcCggKHNwYXRoOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHJlYWxGaWxlID0gZnMucmVhbHBhdGhTeW5jKHNwYXRoKTtcblx0XHRcdFx0XHRcdHNGaWxlRGlyID0gUGF0aC5kaXJuYW1lKHJlYWxGaWxlKTtcblx0XHRcdFx0XHRcdHJldHVybiBQYXRoLnJlbGF0aXZlKGZpbGUuYmFzZSwgcmVhbEZpbGUpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0aWYgKHNGaWxlRGlyKVxuXHRcdFx0XHRcdHNtLnNvdXJjZVJvb3QgPSBQYXRoLnJlbGF0aXZlKHNGaWxlRGlyLCBmaWxlLmJhc2UpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblx0XHRcdFx0ZmlsZS5jb250ZW50cyA9IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KHNtKSwgJ3V0ZjgnKTtcblx0XHRcdH1cblx0XHRcdG5leHQobnVsbCwgZmlsZSk7XG5cdFx0fSkpO1xuXG5cdFx0Y29uc3QgYWxsID0gbWVyZ2UoW2pzU3RyZWFtLCB0c1Jlc3VsdC5kdHMucGlwZShjaGFuZ2VQYXRoKCkpXSlcblx0XHQucGlwZSh0aHJvdWdoLm9iaihmdW5jdGlvbihmaWxlOiBhbnksIGVuOiBzdHJpbmcsIG5leHQ6ICguLi5hcmc6IGFueVtdKSA9PiB2b2lkKSB7XG5cdFx0XHRsb2cuaW5mbygnJXMgJXMgS2InLCBQYXRoLnJlbGF0aXZlKG5vZGVNb2R1bGVzLCBmaWxlLnBhdGgpLFxuXHRcdFx0XHRjaGFsay5ibHVlKE1hdGgucm91bmQoZmlsZS5jb250ZW50cy5sZW5ndGggLyAxMDI0ICogMTApIC8gMTApKTtcblx0XHRcdG5leHQobnVsbCwgZmlsZSk7XG5cdFx0fSkpXG5cdFx0LnBpcGUoZ3VscC5kZXN0KHJvb3QpKTtcblx0XHRhbGwucmVzdW1lKCk7XG5cdFx0YWxsLm9uKCdlbmQnLCAoKSA9PiB7XG5cdFx0XHRpZiAoY29tcGlsZUVycm9ycy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdC8qIHRzbGludDpkaXNhYmxlIG5vLWNvbnNvbGUgKi9cblx0XHRcdFx0Y29uc29sZS5sb2coJ1xcbi0tLS0tLS0tLS0gRmFpbGVkIHRvIGNvbXBpbGUgVHlwZXNjcmlwdCBmaWxlcywgY2hlY2sgb3V0IGJlbG93IGVycm9yIG1lc3NhZ2UgLS0tLS0tLS0tLS0tLVxcbicpO1xuXHRcdFx0XHRjb21waWxlRXJyb3JzLmZvckVhY2gobXNnID0+IGxvZy5lcnJvcihtc2cpKTtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChuZXcgRXJyb3IoY29tcGlsZUVycm9ycy5qb2luKCcsJykpKTtcblx0XHRcdH1cblx0XHRcdHJlc29sdmUoKTtcblx0XHR9KTtcblx0XHRhbGwub24oJ2Vycm9yJywgcmVqZWN0KTtcblx0fSlcblx0LnRoZW4oKCkgPT4ge1xuXHRcdHByaW50RHVyYXRpb24oZmFsc2UpO1xuXHR9KVxuXHQuY2F0Y2goZXJyID0+IHtcblx0XHRwcmludER1cmF0aW9uKHRydWUpO1xuXHRcdHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuXHR9KTtcbn1cbiJdfQ==