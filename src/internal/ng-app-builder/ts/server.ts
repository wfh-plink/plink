/* tslint:disable max-line-length */
import __api from '__api';
import * as log4js from 'log4js';
import * as _ from 'lodash';
import * as Path from 'path';
import * as _fs from 'fs';
import {Webpack2BuilderApi} from '@dr-core/webpack2-builder/main';
import * as express from 'express';
import {AngularCliParam} from './ng/common';
import configWebpack from './config-webpack';
import {readHook} from './ng-ts-replace';

const fs = require('fs-extra');
const sysFs = fs as typeof _fs & {mkdirsSync: (file: string) => void};
const api = __api as Webpack2BuilderApi;
const log = log4js.getLogger(api.packageName);

export function compile() {
	setupApiForAngularCli();
	if (!api.argv.ng)
		return;
	// var tsConfigPath = writeTsconfig();
	// var useHappypack = api.config.get('@dr-core/webpack2-builder.useHappypack', false);
	// var devMode = api.config().devMode;
	// var happyThreadPool = HappyPack.ThreadPool({
	// 	size: api.config.get('@dr-core/webpack2-builder.happyThreadPoolSize', 2)
	// });
	// api.configWebpackLater(
	// 	function(webpackConfig: WebpackConfig): WebpackConfig {
	// 		if (webpackConfig.resolve.alias)
	// 			Object.assign(webpackConfig.resolve.alias, rxPaths());
	// 		else
	// 			webpackConfig.resolve.alias = rxPaths();
	// 		webpackConfig.resolve.mainFields = [
	// 			'browser',
	// 			'module',
	// 			'main'
	// 		];
	// 		if (webpackConfig.resolveLoader.alias)
	// 			Object.assign(webpackConfig.resolveLoader.alias, rxPaths());
	// 		else
	// 			webpackConfig.resolveLoader.alias = rxPaths();
	// 		webpackConfig.module.rules.push(
	// 			{
	// 				test: /\.css$/,
	// 				compiler: AOT ? () => true : undefined,
	// 				issuer: AOT ? undefined: api.isIssuerAngular,
	// 				use: [
	// 					'exports-loader?module.exports.toString()',
	// 					{
	// 						loader: 'css-loader',
	// 						options: {
	// 							sourceMap: api.config().enableSourceMaps,
	// 							import: false
	// 						}
	// 					},
	// 					{
	// 						loader: 'postcss-loader',
	// 						options: {
	// 							ident: 'postcss',
	// 							plugins: postcssPlugins,
	// 							sourceMap: api.config().enableSourceMaps
	// 						}
	// 					},
	// 					{loader: 'lib/css-url-assets-loader'},
	// 					{loader: 'require-injector/css-loader', options: {
	// 						injector: api.browserInjector
	// 					}}
	// 				]
	// 			},
	// 			{
	// 				test: /\.scss$|\.sass$/,
	// 				compiler: AOT ? () => true : undefined,
	// 				issuer: AOT ? undefined: api.isIssuerAngular,
	// 				use: [
	// 					'exports-loader?module.exports.toString()',
	// 					{
	// 						loader: 'css-loader',
	// 						options: {
	// 							sourceMap: api.config().enableSourceMaps,
	// 							import: false
	// 						}
	// 					},
	// 					{
	// 						loader: 'postcss-loader',
	// 						options: {
	// 							ident: 'postcss',
	// 							plugins: postcssPlugins,
	// 							sourceMap: api.config().enableSourceMaps
	// 						}
	// 					},
	// 					{loader: 'lib/css-url-assets-loader'},
	// 					{
	// 						loader: 'sass-loader',
	// 						options: {
	// 							sourceMap: api.config().enableSourceMaps,
	// 							precision: 8,
	// 							includePaths: []
	// 						}
	// 					},
	// 					{loader: 'require-injector/css-loader', options: {
	// 						injector: api.browserInjector
	// 					}}
	// 				]
	// 			  },
	// 			{
	// 				test: /\.less$/,
	// 				compiler: AOT ? () => true : undefined,
	// 				issuer: AOT ? undefined: api.isIssuerAngular,
	// 				use: [
	// 					'exports-loader?module.exports.toString()',
	// 					{
	// 						loader: 'css-loader',
	// 						options: {
	// 							sourceMap: api.config().enableSourceMaps,
	// 							import: false
	// 						}
	// 					},
	// 					{
	// 						loader: 'postcss-loader',
	// 						options: {
	// 							ident: 'postcss',
	// 							plugins: postcssPlugins,
	// 							sourceMap: api.config().enableSourceMaps
	// 						}
	// 					},
	// 					{loader: 'lib/css-url-assets-loader'},
	// 					{loader: 'less-loader', options: {
	// 						sourceMap: api.config().enableSourceMaps
	// 					}},
	// 					{loader: 'require-injector/css-loader', options: {
	// 						injector: api.browserInjector
	// 					}}
	// 				]
	// 			},
	// 			devMode ?
	// 			{
	// 				test: shouldUseNgLoader,
	// 				use: ['@ngtools/webpack']
	// 			} : {
	// 				test: shouldUseNgLoader,
	// 				use: [
	// 					{
	// 						loader: '@angular-devkit/build-optimizer/webpack-loader',
	// 						options: {
	// 							sourceMap: api.config().enableSourceMaps
	// 						}
	// 					},
	// 					'@ngtools/webpack'
	// 				]
	// 			}
	// 		);
	// 		// var entryPackage = api.packageInfo.moduleMap['@dr-core/ng-app-builder'];
	// 		// TODO:
	// 		// var angularCompiler = new AngularCompilerPlugin({
	// 		// 	mainPath: Path.resolve(__dirname, '../browser/main.ts'),
	// 		// 	// mainPath: require.resolve('@dr/angular-app/main.ts'),
	// 		// 	basePath: api.config().rootPath,
	// 		// 	platform: 0,
	// 		// 	skipCodeGeneration: !AOT,
	// 		// 	// forkTypeChecker: true, // Only available at version above 6.0.0
	// 		// 	// Angular 5 has a bug with Typescript > 2.4.2:
	// 		// 	// "Host should not return a redirect source file from `getSourceFile`"
	// 		// 	hostReplacementPaths: environmentMap(),
	// 		// 	sourceMap: api.config().enableSourceMaps,
	// 		// 	tsConfigPath,
	// 		// 	compilerOptions: {
	// 		// 	}
	// 		// });
	// 		// TODO: require-injector
	// 		// (angularCompiler as any)._compilerHost.writeFile();
	// 		// webpackConfig.plugins.push(angularCompiler);
	// 		// let env = api.argv.env;
	// 		// if (env) {
	// 		// 	api.browserInjector.fromAllComponents().alias(
	// 		// 		/^.*\/environment(\?:.ts)?$/, (file: string, result: RegExpExecArray) => {
	// 		// 		if (file.endsWith('.ts')) {
	// 		// 			return result[0] + '.' + env;
	// 		// 		}
	// 		// 		log.warn(file, result);
	// 		// 		return result[0];
	// 		// 	});
	// 		// }
	// 		if (!devMode) {
	// 			webpackConfig.plugins.push(new PurifyPlugin());
	// 		}
	// 		return webpackConfig;
	// 	});
}

export function init() {
	writeTsconfig();
}

export function activate() {
	// setupApiForAngularCli();
	api.router().get('/ok', (req: express.Request, res: express.Response) => {
		log.warn('cool');
		res.send('cool');
	});
}

// function shouldUseNgLoader(file: string): boolean {
// 	if (!/(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/.test(file))
// 		return false;
// 	var component = api.findPackageByFile(file);
// 	if (!component)
// 		return true;
// 	else if (_.get(component, 'dr.angularCompiler'))
// 		return true;
// 	return false;
// }

export function writeTsconfig(): string {
	var root = api.config().rootPath;
	var tempDir = api.config.resolve('destDir', 'webpack-temp');
	sysFs.mkdirsSync(tempDir);
	var packageScopes: string[] = api.config().packageScopes;
	var components = api.packageInfo.moduleMap;

	type PackageInstances = typeof api.packageInfo.allModules;
	var ngPackages: PackageInstances = api.packageInfo.allModules;
	if (api.argv.package && api.argv.package.length > 0) {
		var someComps: PackageInstances = [];
		var packages = _.uniq([...api.argv.package, api.packageName]);
		for (let name of packages) {
			if (_.has(components, name) && _.has(components, [name, 'dr', 'angularCompiler'])) {
				someComps.push(components[name]);
			} else {
				packageScopes.some(scope => {
					let testName = `@${scope}/${name}`;
					if (_.has(components, testName) && _.get(components, [name, 'dr', 'angularCompiler'])) {
						someComps.push(components[testName]);
						return true;
					}
					return false;
				});
			}
		}
		ngPackages = someComps;
	} else {
		ngPackages = ngPackages.filter(comp => comp.dr && comp.dr.angularCompiler || comp.parsedName.scope === 'bk');
	}
	let tsInclude: string[] = [];
	let tsExclude: string[] = [];
	ngPackages.forEach(pk => {
		let dir = Path.relative(tempDir,
			// pk.realPackagePath)
			pk.realPackagePath.startsWith(root) ? pk.realPackagePath : pk.packagePath)
			.replace(/\\/g, '/');
		tsInclude.push(dir + '/**/*.ts');
		tsExclude.push(dir + '/ts',
			dir + '/spec',
			dir + '/dist',
			dir + '/**/*.spec.ts');
	});
	tsExclude.push('**/test.ts');

	var tsjson: any = {
		extends: require.resolve('@dr-core/webpack2-builder/configs/tsconfig.json'),
		include: tsInclude,
		exclude: tsExclude,
		compilerOptions: {
			baseUrl: root,
			paths: {
				'*': [
					'node_modules/*'
				]
			},
			typeRoots: [
				Path.resolve(root, 'node_modules/@types'),
				Path.resolve(root, 'node_modules/@dr-types'),
				Path.resolve(root, 'node_modules/dr-comp-package/wfh/types')
			],
			module: 'esnext'
		},
		angularCompilerOptions: {
			trace: true,
			strictMetadataEmit: true
		}
	};
	var tsConfigPath = Path.resolve(tempDir, 'angular-app-tsconfig.json');
	fs.writeFileSync(tsConfigPath, JSON.stringify(tsjson, null, '  '));
	return tsConfigPath;
}

function setupApiForAngularCli() {
	let ngParam: AngularCliParam = api.config()._angularCli;
	if (!ngParam || api.ngEntryComponent)
		return;
	if (!ngParam.browserOptions.preserveSymlinks) {
		throw new Error('In order to get DRCP builder work,\
		you must set property `preserveSymlinks` to be true in project\'s angular.json file \
		');
	}
	let webpackConfig = ngParam.webpackConfig;
	let ngEntryComponent = api.findPackageByFile(Path.resolve(ngParam.projectRoot));
	Object.assign(Object.getPrototypeOf(api), {
		webpackConfig,
		ngEntryComponent
	});
	api.config.set(['outputPathMap', ngEntryComponent.longName], '/');
	configWebpack(ngParam, webpackConfig, api.config());

	ngParam.vfsHost.hookRead = readHook;
	log.info('Setup api object for Angular');
}