/* eslint no-console: 0 */
var _ = require('lodash');
var fs = require('fs');
var Path = require('path');
var yamljs = require('yamljs');
const {cyan} = require('chalk');
var argv;
// var argv = require('yargs').argv;
require('yamlify/register');
var publicPath = require('./publicPath');
const ConfigHandlerMgr = require('../dist/config-handler').ConfigHandlerMgr;
let handlers;

var rootPath = process.cwd();
var setting;
var localDisabled = false;
var localConfigPath;

Promise.defer = defer;

function defer() {
	var resolve, reject;
	var promise = new Promise(function() {
		resolve = arguments[0];
		reject = arguments[1];
	});
	return {
		resolve,
		reject,
		promise
	};
}

/**
 * read and return configuration
 * @name config
 * @return {object} setting
 */
module.exports = function() {
	return setting;
};

let initResolve;
module.exports.done = new Promise(resolve => {
	initResolve = resolve;
});

module.exports.init = function(_argv) {
	argv = _argv;
	if (argv.root)
		rootPath = argv.root;
	localConfigPath = argv.c || process.env.DR_CONFIG_FILE || Path.join(rootPath, 'dist', 'config.local.yaml');
	return load().then(res => {
		initResolve(res);
		return res;
	});
};

module.exports.disableLocal = function() {
	localDisabled = true;
	setting = {};
	return load();
};

module.exports.reload = function reload() {
	setting = {};
	return load();
};

module.exports.set = function(path, value) {
	_.set(setting, path, value);
	return setting;
};

module.exports.get = function(propPath, defaultValue) {
	return _.get(setting, propPath, defaultValue);
};

module.exports.setDefault = function(propPath, value) {
	if (!_.has(setting, propPath)) {
		_.set(setting, propPath, value);
	}
	return setting;
};

/**
 * Resolve a path based on `rootPath`
 * @name resolve
 * @memberof config
 * @param  {string} property name or property path, like "name", "name.childProp[1]"
 * @return {string}     absolute path
 */
module.exports.resolve = function(pathPropName, ...paths) {
	var args = [rootPath, _.get(setting, pathPropName), ...paths];
	return Path.resolve.apply(Path, args);
};

module.exports.load = load;

module.exports.configHandlerMgr = () => handlers;
/**
 * Load configuration from config.yaml.
 * Besides those properties in config.yaml, there are extra available properties:
 * - rootPath {string} root path, normally it is identical as process.cwd()
 * 	resolved to relative path to this platform package folder, even it is under node_modules
 * 	folder loaded as dependency
 * - projectList <workspace>/dr.project.list.json
 * - nodePath <workspace>/node_modules
 * - wfhSrcPath meaning wfh source code is linked, it is not installed
 * - _package2Chunk a hash object whose key is `package name`, value is `chunk name`
 */
function load(fileList, yargv) {
	if (fileList)
		localConfigPath = fileList;
	if (yargv === undefined)
		yargv = argv;
	try {
		//log.debug('root Path: ' + rootPath);
		setting = setting || {};

		setting.projectList = require('./gulp/cli').getProjects(rootPath);

		// some extra config properties
		_.assign(setting, {
			/** @name rootPath
			* @memberof setting
			*/
			rootPath,
			nodePath: Path.join(rootPath, 'node_modules'),
			wfhSrcPath: wfhSrcPath(),
			_package2Chunk: {}
		});

		// Merge from <root>/config.yaml
		var configFileList = [
			Path.resolve(__dirname, '..', 'config.yaml')
		];
		var rootConfig = Path.resolve(rootPath, 'dist', 'config.yaml');
		if (fs.existsSync(rootConfig))
			configFileList.push(rootConfig);
		else
			configFileList.push(Path.resolve(rootPath, 'config.yaml'));

		if (!localDisabled) {
			if (_.isArray(localConfigPath))
				configFileList.push(...localConfigPath);
			else
				configFileList.push(localConfigPath);
		}

		configFileList.forEach(localConfigPath => mergeFromYamlJsonFile(setting, localConfigPath));
		handlers = new ConfigHandlerMgr(configFileList.filter(name => /\.[tj]s$/.test(name)));
		return handlers.runEach((file, obj, handler) => {
			return handler.onConfig(obj || setting, yargv);
		})
		.then(() => {
			if (setting.recipeFolder) {
				setting.recipeFolderPath = Path.resolve(rootPath, setting.recipeFolder);
			}
			validateConfig();

			var defaultEntrySet = setting.defaultEntrySet = {};
			if (setting.defaultEntryPackages) {
				[].concat(setting.defaultEntryPackages).forEach(function(entryFile) {
					defaultEntrySet[entryFile] = true;
				});
			}
			setting.port = normalizePort(setting.port);

			if (!setting.devMode)
				process.env.NODE_ENV = 'production';
			setting.publicPath = _.trimEnd(setting.staticAssetsURL || '', '/') + '/'; // always ends with /
			setting.localIP = publicPath.getLocalIP();
			setting.hostnamePath = publicPath.getHostnamePath(setting);
			mergeFromCliArgs(setting, yargv);
			if (setting.devMode) {
				console.log(cyan('config - ') + 'Development mode');
			} else {
				console.log(cyan('config - ') + 'Production mode');
			}
			return setting;
		})
		.catch(err => {
			console.error(err);
			console.error(__filename + ' failed to read config files', err);
			throw err;
		});
	} catch (err) {
		console.error(err);
		console.error(__filename + ' failed to read config files', err);
		throw err;
	}
}

function mergeFromYamlJsonFile(setting, localConfigPath) {
	if (!fs.existsSync(localConfigPath)) {
		console.log(cyan('config - ') + 'File does not exist: %s', localConfigPath);
		return;
	}
	console.log(cyan('config - ') + `Read ${localConfigPath}`);
	var package2Chunk = setting._package2Chunk;
	var configObj;
	var suffix = /\.([^.]+)$/.exec(localConfigPath)[1];
	if (suffix === 'yaml' || suffix === 'yml') {
		configObj = yamljs.parse(fs.readFileSync(localConfigPath, 'utf8'));
	} else if (suffix === 'json') {
		configObj = require(Path.resolve(localConfigPath));
	} else {
		return;
	}

	_.assignWith(setting, configObj, (objValue, srcValue, key, object, source) => {
		if (key === 'vendorBundleMap') {
			if (!_.isObject(objValue) || !_.isObject(srcValue))
				return;
			_.each(srcValue, (packageList, chunk) => {
				if (!_.isArray(packageList))
					return;
				for (var p of packageList) {
					package2Chunk[p] = chunk;
				}
			});
		} else if (key === 'outputPathMap') {
			if (!objValue)
				objValue = object.outputPathMap = {};
			return _.assign(objValue, srcValue);
		} else if (_.isObject(objValue) && !Array.isArray(objValue)) {
			// We only merge 2nd level properties
			return _.assign(objValue, srcValue);
		}
	});
}

function mergeFromCliArgs(setting, yargv) {
	if (!yargv.prop)
		return;
	for (let propSet of yargv.prop) {
		propSet = propSet.split('=');
		let propPath = propSet[0];
		if (_.startsWith(propSet[0], '['))
			propPath = JSON.parse(propSet[0]);
		let value;
		try {
			value = JSON.parse(propSet[1]);
		} catch (e) {
			value = propSet[1] === 'undefined' ? undefined : propSet[1];
		}
		_.set(setting, propPath, value);
		console.log(`[config] set ${propPath} = ${value}`);
	}
}

module.exports.wfhSrcPath = wfhSrcPath;
function wfhSrcPath() {
	var wfhPath = Path.dirname(require.resolve('dr-comp-package/package.json'));
	//log.debug('wfhPath: %s', wfhPath);
	return (Path.basename(Path.dirname(wfhPath)) !== 'node_modules') ? wfhPath : false;
}

function validateConfig() {
	if (!setting.nodeRoutePath) {
		console.error('[config error]: ' + ('"nodeRoutePath" must be set in config.yaml'));
		throw new Error('Invalid configuration');
	}

	['staticAssetsURL',
		'nodeRoutePath',
		'compiledDir'].forEach(function(prop) {
		setting[prop] = trimTailSlash(setting[prop]);
	});

	var contextMapping = setting.packageContextPathMapping;
	if (contextMapping) {
		_.forOwn(contextMapping, function(path, key) {
			contextMapping[key] = trimTailSlash(path);
		});
	}
}

function trimTailSlash(url) {
	if (url === '/') {
		return url;
	}
	return _.endsWith(url, '/') ? url.substring(0, url.length - 1) : url;
}

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}
