import './node-inject';
import {DevServerBuilder, DevServerBuilderOptions} from '@angular-devkit/build-angular';
import {
	BuildEvent,
	// Builder,
	BuilderConfiguration
	// BuilderContext,
  } from '@angular-devkit/architect';
import { /*Path, getSystemPath,*/ resolve, tags, virtualFs } from '@angular-devkit/core';
import { checkPort } from '@angular-devkit/build-angular/src/angular-cli-files/utilities/check-port';
import * as url from 'url';
// import {
// 	statsErrorsToString,
// 	statsToString,
// 	statsWarningsToString
// 	} from '@angular-devkit/build-angular/src/angular-cli-files/utilities/stats';

import { NormalizedBrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser';
import { BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { addFileReplacements, normalizeAssetPatterns } from '@angular-devkit/build-angular/src/utils';
import * as fs from 'fs';
import * as Rx from 'rxjs';
import { concatMap, map, tap } from 'rxjs/operators';
// import * as _ from 'lodash';
// const opn = require('opn');
// import * as Path from 'path';

import * as common from './common';
import {BrowserBuilder} from './browser-builder';
import ReadHookHost from '../utils/read-hook-vfshost';

export type buildWebpackConfigFunc = (browserOptions: NormalizedBrowserBuilderSchema) => any;

// export interface DevServerBuilderOptions extends DevServerBuilderOptions0 {
// 	drcpArgs: any;
// }
// export interface AngularCliParam {
// 	builderConfig: BuilderConfiguration<DevServerBuilderOptions>;
// 	buildWebpackConfig: buildWebpackConfigFunc;
// 	browserOptions: NormalizedBrowserBuilderSchema;
// 	argv: any;
// }

export default class DrcpDevServer extends DevServerBuilder {
	run(builderConfig: BuilderConfiguration<DevServerBuilderOptions>): Rx.Observable<BuildEvent> {
		this.context.logger.info('Hellow from DRCP with Angular');
		const options = builderConfig.options;
		const root = this.context.workspace.root;
		const projectRoot = resolve(root, builderConfig.root);
		const host = new ReadHookHost(this.context.host as virtualFs.Host<fs.Stats>);
		let browserOptions: BrowserBuilderSchema;

		return checkPort(options.port, options.host)
		.pipe(
			tap((port) => options.port = port),
			concatMap(() => this._getBrowserOptions1(options)),
			tap((opts) => browserOptions = opts),
			concatMap(() => addFileReplacements(root, host, browserOptions.fileReplacements)),
			concatMap(() => normalizeAssetPatterns(
				browserOptions.assets, host, root, projectRoot, builderConfig.sourceRoot)),
				// Replace the assets in options with the normalized version.
			tap((assetPatternObjects => browserOptions.assets = assetPatternObjects)),
			concatMap(() => {
				const browserBuilder = new BrowserBuilder(this.context);

				// DRCP
				// browserOptions.tsConfig = Path.join(process.cwd(), 'dist', 'webpack-temp', 'angular-app-tsconfig.json');
				function buildWebpackConfig(browserOptions: common.AngularBuilderOptions): any {
					return browserBuilder.buildWebpackConfig(
						root, projectRoot, host, browserOptions as NormalizedBrowserBuilderSchema);
				}
				// const webpackConfig = browserBuilder.buildWebpackConfig(
				// 	root, projectRoot, host, browserOptions as NormalizedBrowserBuilderSchema);
				// const statsConfig = getWebpackStatsConfig(browserOptions.verbose);

				// Resolve public host and client address.
				// let clientAddress = `${options.ssl ? 'https' : 'http'}://0.0.0.0:0`;
				if (options.publicHost) {
					let publicHost = options.publicHost;
					if (!/^\w+:\/\//.test(publicHost)) {
						publicHost = `${options.ssl ? 'https' : 'http'}://${publicHost}`;
					}
					const clientUrl = url.parse(publicHost);
					options.publicHost = clientUrl.host;
					//   clientAddress = url.format(clientUrl);
				}

				// Resolve serve address.
				const serverAddress = url.format({
					protocol: options.ssl ? 'https' : 'http',
					hostname: options.host === '0.0.0.0' ? 'localhost' : options.host,
					port: options.port.toString()
				});

				// Add live reload config.
				// if (options.liveReload) {
				//   this._addLiveReload(options, browserOptions, webpackConfig, clientAddress);
				// } else if (options.hmr) {
				//   this.context.logger.warn('Live reload is disabled. HMR option ignored.');
				// }

				this.context.logger.info(tags.oneLine`
					**
					Angular Live Development Server is listening on ${options.host}:
					${options.port}, open your browser on ${serverAddress}
					**
				`);

				return common.startDrcpServer(builderConfig.root, builderConfig, browserOptions as common.AngularBuilderOptions,
					buildWebpackConfig, host);
			})
		);
	}

	private _getBrowserOptions1(options: DevServerBuilderOptions) {
		const architect = this.context.architect;
		const [project, target, configuration] = options.browserTarget.split(':');
		// Override browser build watch setting.
		const overrides = { watch: options.watch };
		const browserTargetSpec = { project, target, configuration, overrides };
		const builderConfig = architect.getBuilderConfiguration<BrowserBuilderSchema>(
		  browserTargetSpec);

		// Update the browser options with the same options we support in serve, if defined.
		builderConfig.options = {
			...(options.optimization !== undefined ? { optimization: options.optimization } : {}),
			...(options.aot !== undefined ? { aot: options.aot } : {}),
			...(options.sourceMap !== undefined ? { sourceMap: options.sourceMap } : {}),
			...(options.evalSourceMap !== undefined ? { evalSourceMap: options.evalSourceMap } : {}),
			...(options.vendorChunk !== undefined ? { vendorChunk: options.vendorChunk } : {}),
			...(options.commonChunk !== undefined ? { commonChunk: options.commonChunk } : {}),
			...(options.baseHref !== undefined ? { baseHref: options.baseHref } : {}),
			...(options.progress !== undefined ? { progress: options.progress } : {}),
			...(options.poll !== undefined ? { poll: options.poll } : {}),

			...builderConfig.options
		};

		return architect.getBuilderDescription(builderConfig).pipe(
			concatMap(browserDescription =>
				architect.validateBuilderOptions(builderConfig, browserDescription)),
			map(browserConfig => browserConfig.options)
		);
	}
}

// export default DevServerBuilder;
