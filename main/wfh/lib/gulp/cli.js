/* eslint max-lines: "off", no-console: 0 */
var fs = require('fs-extra');
var Path = require('path');
var _ = require('lodash');
var chalk = require('chalk');
var shell = require('shelljs');
var Promise = require('bluebird');
var buildUtils = require('./buildUtils');
var PackageJsonGuarder = require('../../dist/package-json-guarder').getInstance;
const {boxString} = require('../../dist/utils');
const cleanInvalidSymlinks = require('../../dist/utils/symlinks').default;

const isWin32 = require('os').platform().indexOf('win32') >= 0;
var startTime;
module.exports = {
	//initGulpfile: initGulpfile,
	writeProjectListFile,
	getProjects: getProjectDirs,
	setStartTime
};

var cmdFunctions = {
	init,
	clean,
	install,
	addProject,
	removeProject,
	listProject,
	ls,
	compile,
	lint,
	publish,
	pack,
	unpublish,
	bumpDirs,
	bumpProjects,
	runUnitTest,
	runE2eTest,
	tsc,
	runPackages
};

var delegatedCmds = {};
_.each(cmdFunctions, (func, name) => {
	Object.defineProperty(module.exports, name, {
		get() {
			return function() {
				try {
					Promise.resolve(func.apply(this, arguments))
						.then(() => {
							var sec = Math.ceil((new Date().getTime() - startTime) / 1000);
							var min = `${Math.floor(sec / 60)} minutes ${sec % 60} secends`;
							console.log('Done in ' + min);
						})
						.catch(e => {
							console.error(e);
							var sec = Math.ceil((new Date().getTime() - startTime) / 1000);
							var min = `${Math.floor(sec / 60)} minutes ${sec % 60} secends`;
							console.log('Failed in ' + min);
							process.exit(1);
						});
				} catch (e) {
					console.error(e);
					console.log('Failed.');
					process.exit(1);
				}
			};
		}
	});
});

Object.assign(module.exports, delegatedCmds);

var rootPath = process.cwd();
var argv;

var packageJsonGuarder = PackageJsonGuarder(rootPath);
function init(_argv, noPuppy) {
	argv = _argv;
	fs.mkdirpSync(Path.join(rootPath, 'dist'));
	maybeCopyTemplate(Path.resolve(__dirname, 'templates/config.local-template.yaml'), Path.join(rootPath, 'dist', 'config.local.yaml'));
	maybeCopyTemplate(Path.resolve(__dirname, 'templates/log4js.js'), rootPath + '/log4js.js');
	maybeCopyTemplate(Path.resolve(__dirname, 'templates/app-template.js'), rootPath + '/app.js');
	maybeCopyTemplate(Path.resolve(__dirname, 'templates', 'module-resolve.server.tmpl.ts '), rootPath + '/module-resolve.server.ts');
	// maybeCopyTemplate(Path.resolve(__dirname, 'templates', 'module-resolve.browser.tmpl.ts'), rootPath + '/module-resolve.browser.ts');
	cleanInvalidSymlinks()
	.then(() => {
		// var drcpFolder = Path.resolve('node_modules', 'dr-comp-package');
		// if (fs.lstatSync(drcpFolder).isSymbolicLink())
		// 	removeProject(_argv, [fs.realpathSync(drcpFolder)]);

		packageJsonGuarder.beforeChange();
		var wi = new WorkspaceInstaller(null, argv.yarn, argv.production, argv.offline);
		return wi.run(packageJsonGuarder.isModulesChanged());
	}).then(() => {
		packageJsonGuarder.afterChange();
		if (!noPuppy)
			_drawPuppy();
	})
	.catch(err => {
		packageJsonGuarder.afterChangeFail();
		throw err;
	});
}

class WorkspaceInstaller {
	constructor(isDrcpSymlink, useYarn, onlyProd, isOffline) {
		this.isDrcpSymlink = isDrcpSymlink;
		//this.installed = false;
		this.isOffline = isOffline;
		this.useYarn = useYarn;
		this.onlyProd = onlyProd;
	}

	run(forceInstall) {
		const {createProjectSymlink} = require('../../dist/project-dir');
		var helper = require('./cliAdvanced');
		if (this.isDrcpSymlink == null)
			this.isDrcpSymlink = fs.lstatSync(Path.resolve('node_modules', 'dr-comp-package')).isSymbolicLink();

		// logs
		if (!fs.existsSync(Path.join(rootPath, 'logs')))
			fs.mkdirpSync(Path.join(rootPath, 'logs'));
		var self = this;

		return Promise.coroutine(function*() {
			var needRunInstall = yield _initDependency(self.isDrcpSymlink);
			if (forceInstall || needRunInstall) {
				try {
					yield packageJsonGuarder.installAsync(false, self.useYarn, self.onlyProd, self.isOffline);
				} catch (err) {
					createProjectSymlink();
					throw err;
				}
				return yield self.run(false);
			}
			packageJsonGuarder.markInstallNum();
			yield helper.addupConfigs((file, configContent) => {
				// writeFile(file, '\n# DO NOT MODIFIY THIS FILE!\n' + configContent);
				writeFile(Path.resolve(rootPath || process.cwd(), 'dist', file),
					'\n# DO NOT MODIFIY THIS FILE!\n' + configContent);
			});
			argv['package-cache'] = false;
			createProjectSymlink();
			require('../../dist/editor-helper').writeTsconfig4Editor();
			return yield require('../packageMgr/packageRunner').runBuilder(argv, 'init', true);
		})();
	}
}

function _initDependency(isDrcpSymlink) {
	var rm = require('../../dist/recipe-manager');
	var helper = require('./cliAdvanced');
	// Create project folder node_modules
	const projectDirs = getProjectDirs();
	projectDirs.forEach(prjdir => {
		_writeGitHook(prjdir);
		// maybeCopyTemplate(Path.resolve(__dirname, '../../.eslintrc.json'), prjdir + '/.eslintrc.json');
		maybeCopyTemplate(Path.resolve(__dirname, '../../tslint.json'), prjdir + '/tslint.json');
	});

	return Promise.coroutine(function*() {
		var pkJsonFiles = yield rm.linkComponentsAsync();
		if (isDrcpSymlink) {
			console.log('node_modules/dr-comp-package is symbolic link, add its dependencies to %s', chalk.cyan(Path.resolve('package.json')));
			const drcpPk = Path.resolve('node_modules', 'dr-comp-package', 'package.json');
			pkJsonFiles.push(isDrcpSymlink ? fs.realpathSync(drcpPk) : drcpPk);
		}
		pkJsonFiles.push(...projectDirs.filter(dir => dir !== rootPath)
				.map(dir => Path.join(dir, 'package.json'))
				.filter(file => fs.existsSync(file)));
		pkJsonFiles = _.uniq(pkJsonFiles);
		var needRunInstall = helper.listCompDependency(pkJsonFiles, true, isDrcpSymlink);
		return needRunInstall;
	})()
	.catch(err => {
		console.error(chalk.red(err), err.stack);
		throw err;
	});
}

function _writeGitHook(project) {
	// if (!isWin32) {
	var gitPath = Path.resolve(project, '.git/hooks');
	if (fs.existsSync(gitPath)) {
		var hookStr = '#!/bin/sh\n' +
			`cd "${rootPath}"\n` +
			// 'drcp init\n' +
			// 'npx pretty-quick --staged\n' + // Use `tslint --fix` instead.
			`node node_modules/dr-comp-package/bin/drcp.js lint --pj "${project.replace(/[/\\]$/, '')}" --fix\n`;
		if (fs.existsSync(gitPath + '/pre-commit'))
			fs.unlink(gitPath + '/pre-commit');
		fs.writeFileSync(gitPath + '/pre-push', hookStr);
		console.log('Write ' + gitPath + '/pre-push');
		if (!isWin32)
			shell.chmod('-R', '+x', project + '/.git/hooks/*');
	}
	// }
}

function addProject(_argv, dirs) {
	let changed = writeProjectListFile(dirs);
	return Promise.resolve(require('../config').init(_argv))
		.then(() => {
			if (changed) {
				console.log(boxString('Project list is updated, you need to run\n\tdrcp init\n' +
					' or other offline init command to install new dependencies from the new project.', 60));
			} else {
				console.log(boxString('No new project is added.', 60));
			}
		})
		.catch(e => {
			console.log('Roll back dr.project.list.json');
			fs.renameSync(Path.join(rootPath, 'dr.project.list.json.bak'), Path.join(rootPath, 'dr.project.list.json'));
			throw e;
		});
}

function writeProjectListFile(dirs) {
	let changed = false;
	if (rootPath == null)
		rootPath = process.cwd();
	var projectListFile = Path.join(rootPath, 'dr.project.list.json');
	var prj;
	if (fs.existsSync(projectListFile)) {
		fs.copySync(Path.join(rootPath, 'dr.project.list.json'), Path.join(rootPath, 'dr.project.list.json.bak'));
		prj = JSON.parse(fs.readFileSync(projectListFile, 'utf8'));
		let toAdd = _.differenceBy(dirs, prj, dir => fs.realpathSync(dir).replace(/[/\\]$/, ''));
		if (toAdd.length > 0) {
			prj.push(...toAdd);
			writeFile(projectListFile, JSON.stringify(_.uniqBy(prj, p => fs.realpathSync(p)), null, '  '));
			changed = true;
		}
	} else {
		prj = [...dirs];
		writeFile(projectListFile, JSON.stringify(_.uniqBy(prj, p => fs.realpathSync(p)), null, '  '));
		changed = true;
	}
	delete require.cache[require.resolve(projectListFile)];
	return changed;
}

function ls(_argv) {
	argv = _argv;
	return Promise.coroutine(function*() {
		const config = require('../config');
		yield config.init(_argv);
		require('../logConfig')(config());

		const pmgr = require('../../dist/package-mgr');
		console.log('==============[ LINKED PACKAGES IN PROJECT ]==============\n');
		console.log(pmgr.listPackagesByProjects());

		console.log('\n' + chalk.green(_.pad('[ SERVER COMPONENTS ]', 50, '=')) + '\n');
		var list = yield require('../packageMgr/packageRunner').listServerComponents();
		list.forEach(row => console.log(' ' + row.desc + '   ' + chalk.blue(Path.relative(config().rootPath, row.pk.path))));
		console.log('');
		console.log('\n' + chalk.green(_.pad('[ BUILDER COMPONENTS ]', 50, '=')) + '\n');
		list = yield require('../packageMgr/packageRunner').listBuilderComponents();
		list.forEach(row => console.log(' ' + row.desc + '   ' + chalk.blue(Path.relative(config().rootPath, row.pk.path))));
	})();
}

function removeProject(_argv, dirs) {
	argv = _argv;
	var projectListFile = Path.join(rootPath, 'dr.project.list.json');
	if (fs.existsSync(projectListFile)) {
		console.log('Removing project: %s', dirs.join(', '));
		var prjs = JSON.parse(fs.readFileSync(projectListFile, 'utf8'));
		prjs = _.differenceBy(prjs, dirs, dir => Path.resolve(dir));
		var str = JSON.stringify(prjs, null, '  ');
		writeFile(projectListFile, str);
		delete require.cache[require.resolve(projectListFile)];
		listProject(_argv, prjs);
	}
}

function listProject(_argv, projects) {
	if (_argv)
		argv = _argv;
	var projectListFile = Path.join(rootPath, 'dr.project.list.json');
	if (projects == null && fs.existsSync(projectListFile))
		projects = require(projectListFile);

	projects = getProjectDirs(rootPath);
	if (projects && projects.length > 0) {
		let str = _.pad(' Projects directory ', 40, ' ');
		str += '\n \n';
		_.each(projects, (dir, i) => {
			dir = Path.resolve(rootPath, dir);
			str += _.padEnd(i + 1 + '. ', 5, ' ') + dir;
			str += '\n';
		});
		console.log(boxString(str));
		return projects;
	} else {
		console.log('No projects');
		return [];
	}
}

function getProjectDirs(_rootPath) {
	var projectListFile = Path.join(_rootPath || rootPath, 'dr.project.list.json');
	var proList = [];
	if (fs.existsSync(projectListFile)) {
		var projects = require(projectListFile);
		proList = projects;
	}
	return proList.map(dir => fs.realpathSync(Path.resolve(Path.dirname(projectListFile), dir)));
}

function install(isDrcpSymlink) {
	if (isDrcpSymlink === undefined)
		isDrcpSymlink = fs.lstatSync(Path.resolve('node_modules', 'dr-comp-package')).isSymbolicLink();

	var drcpLocation = Path.resolve('node_modules', 'dr-comp-package');
	var realDrcpPath;
	if (isDrcpSymlink)
		realDrcpPath = fs.realpathSync(drcpLocation);
	return buildUtils.promisifyExe('npm', 'install', {cwd: rootPath})
		.then(res => new Promise(resolve => setTimeout(() => resolve(res), 500)))
		.then(res => {
			if (isDrcpSymlink && !fs.existsSync(drcpLocation)) {
				fs.symlinkSync(Path.relative('node_modules', realDrcpPath), drcpLocation, isWin32 ? 'junction' : 'dir');
				console.log('Write symlink dr-comp-package');
			}
			return res;
		});
}

function clean(_argv) {
	argv = _argv;
	var drcpFolder = Path.resolve('node_modules', 'dr-comp-package');

	if (argv.symlink === 'symlink') {
		return require('./cliAdvanced').clean(true);
	}
	return require('./cliAdvanced').clean()
		.then(() => {
			getProjectDirs().forEach(prjdir => {
				let moduleDir = Path.resolve(prjdir, 'node_modules');
				try {
					if (fs.lstatSync(moduleDir).isSymbolicLink() &&
						fs.realpathSync(moduleDir) === Path.resolve(rootPath, 'node_modules'))
						fs.unlinkSync(moduleDir);
				} catch (e) {
					if (fs.existsSync(moduleDir))
						fs.unlinkSync(moduleDir);
				}
				const hookDir = Path.resolve(prjdir, '.git', 'hooks');
				for (const hook of ['pre-commit', 'pre-push']) {
					if (fs.existsSync(Path.resolve(hookDir, hook))) {
						fs.unlink(Path.resolve(hookDir, hook));
					}
				}
			});
			fs.remove(Path.resolve(rootPath, 'config.yaml'));
			fs.remove(Path.resolve(rootPath, 'config.local.yaml'));
			if (fs.lstatSync(drcpFolder).isSymbolicLink())
				removeProject(_argv, [fs.realpathSync(drcpFolder)]);
		});
}

function compile(_argv) {
	return init(_argv, true)
		.then(() => require('../config').reload())
		.then(() => require('../packageMgr/packageRunner').runBuilder(_argv));
}

function tsc(_argv, onCompiled) {
	return require('../../dist/ts-cmd').tsc(_argv, onCompiled);
}

function lint(_argv) {
	return require('./cliAdvanced').lint(_argv);
	// return init(_argv)
	// .then(() => require('./cliAdvanced').lint(_argv));
}

function publish(_argv) {
	return require('./cliAdvanced').publish(_argv);
}

function pack(_argv) {
	return require('../../dist/drcp-cmd').pack(_argv);
}

function unpublish(_argv) {
	return require('./cliAdvanced').unpublish(_argv);
}

function bumpDirs(dirs, versionType) {
	return require('./cliAdvanced').bumpDirsAsync(dirs, versionType);
}

function bumpProjects(projects, versionType) {
	return require('./cliAdvanced').bumpProjectsAsync(projects, versionType);
}

function runUnitTest(_argv) {
	require('../config').init(_argv)
	.then(() => {
		return require('./testRunner').runUnitTest(_argv);
	});
}

function runE2eTest(_argv) {
	return require('./testRunner').runE2eTest(_argv);
}

function writeFile(file, content) {
	fs.writeFileSync(file, content);
	console.log('%s is written', chalk.cyan(Path.relative(rootPath, file)));
}

function cp(from, to) {
	if (_.startsWith(from, '-')) {
		from = arguments[1];
		to = arguments[2];
	}
	shell.cp(...arguments);
	if (/[/\\]$/.test(to))
		to = Path.basename(from); // to is a folder
	else
		to = Path.relative(rootPath, to);
	console.log('copy to %s', chalk.cyan(to));
}

function maybeCopyTemplate(from, to) {
	if (!fs.existsSync(Path.resolve(rootPath, to)))
		cp(Path.resolve(__dirname, from), to);
}

function _drawPuppy(slogon, message) {
	if (!slogon)
		slogon = 'Congrads! Time to publish your shit!';

	console.log(chalk.magenta('\n   ' + _.repeat('-', slogon.length) + '\n' +
		` < ${slogon} >\n` +
		'   ' + _.repeat('-', slogon.length) + '\n' +
		'\t\\   ^__^\n\t \\  (oo)\\_______\n\t    (__)\\       )\\/\\\n\t        ||----w |\n\t        ||     ||'));
	if (message)
		console.log(message);
}

function setStartTime(time) {
	if (startTime == null)
		startTime = time;
}

function runPackages(_argv) {
	var helper = require('./cliAdvanced');
	return helper.runPackages(_argv);
}
