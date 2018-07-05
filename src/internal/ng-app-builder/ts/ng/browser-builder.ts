/* tslint:disable max-line-length */
import './node-inject';
import {
		BuildEvent,
		// Builder,
		BuilderConfiguration
		// BuilderContext
	} from '@angular-devkit/architect';
import { Path, /*getSystemPath,*/ normalize, resolve, virtualFs } from '@angular-devkit/core';
import * as fs from 'fs';
import { Observable, concat, of } from 'rxjs';
import { concatMap, last, tap } from 'rxjs/operators';
const webpack = require('webpack');
import { getWebpackStatsConfig } from '@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/utils';
import { augmentAppWithServiceWorker } from '@angular-devkit/build-angular/src/angular-cli-files/utilities/service-worker';
import {
	statsErrorsToString,
	statsToString,
	statsWarningsToString
} from '@angular-devkit/build-angular/src/angular-cli-files/utilities/stats';
import { addFileReplacements, normalizeAssetPatterns } from '@angular-devkit/build-angular/src/utils';
import {
	BrowserBuilderSchema
} from '@angular-devkit/build-angular/src/browser/schema';

import {BrowserBuilder as GoogleBrowserBuilder, NormalizedBrowserBuilderSchema} from '@angular-devkit/build-angular';
import * as drcpCommon from './common';
import ReadHookHost from '../utils/read-hook-vfshost';

export class BrowserBuilder extends GoogleBrowserBuilder {

	run(builderConfig: BuilderConfiguration<BrowserBuilderSchema>): Observable<BuildEvent> {
		const options = builderConfig.options as drcpCommon.AngularBuilderOptions;
		const root = this.context.workspace.root;
		const projectRoot = resolve(root, builderConfig.root);
		const host = new ReadHookHost(this.context.host as virtualFs.Host<fs.Stats>);

		return of(null).pipe(
			concatMap(() => options.deleteOutputPath
				? this._deleteOutputDir0(root, normalize(options.outputPath), this.context.host)
				: of(null)),
			concatMap(() => addFileReplacements(root, host, options.fileReplacements)),
			concatMap(() => normalizeAssetPatterns(
				options.assets, host, root, projectRoot, builderConfig.sourceRoot)),
			// Replace the assets in options with the normalized version.
			tap((assetPatternObjects => options.assets = assetPatternObjects)),
			concatMap(() => {
				// Ensure Build Optimizer is only used with AOT.
				if (options.buildOptimizer && !options.aot) {
					throw new Error('The `--build-optimizer` option cannot be used without `--aot`.');
				}

				return drcpCommon.compile(builderConfig.root, options, () => {
					return this.buildWebpackConfig(root, projectRoot, host,
						options as NormalizedBrowserBuilderSchema);
				}, host);
			}),
			concatMap((webpackConfig: any) => new Observable(obs => {

				const webpackCompiler = webpack(webpackConfig);
				const statsConfig = getWebpackStatsConfig(options.verbose);

				const callback: any = (err: Error, stats: any) => {
					if (err) {
						return obs.error(err);
					}

					const json = stats.toJson(statsConfig);
					if (options.verbose) {
						this.context.logger.info(stats.toString(statsConfig));
					} else {
						this.context.logger.info(statsToString(json, statsConfig));
					}

					if (stats.hasWarnings()) {
						this.context.logger.warn(statsWarningsToString(json, statsConfig));
					}
					if (stats.hasErrors()) {
						this.context.logger.error(statsErrorsToString(json, statsConfig));
					}

					if (options.watch) {
						obs.next({ success: !stats.hasErrors() });

						// Never complete on watch mode.
						return;
					} else {
						if (builderConfig.options.serviceWorker) {
							augmentAppWithServiceWorker(
								this.context.host,
								root,
								projectRoot,
								resolve(root, normalize(options.outputPath)),
								options.baseHref || '/',
								options.ngswConfigPath
							).then(
								() => {
									obs.next({ success: !stats.hasErrors() });
									obs.complete();
								},
								(err: Error) => {
									// We error out here because we're not in watch mode anyway (see above).
									obs.error(err);
								}
							);
						} else {
							obs.next({ success: !stats.hasErrors() });
							obs.complete();
						}
					}
				};

				try {
					if (options.watch) {
						const watching = webpackCompiler.watch({ poll: options.poll }, callback);

						// Teardown logic. Close the watcher when unsubscribed from.
						return () => watching.close(() => { });
					} else {
						webpackCompiler.run(callback);
					}
				} catch (err) {
					if (err) {
						this.context.logger.error(
							'\nAn error occured during the build:\n' + ((err && err.stack) || err));
					}
					throw err;
				}
			}))
		);
	}

	private _deleteOutputDir0(root: Path, outputPath: Path, host: virtualFs.Host) {
		const resolvedOutputPath = resolve(root, outputPath);
		if (resolvedOutputPath === root) {
		  throw new Error('Output path MUST not be project root directory!');
		}

		return host.exists(resolvedOutputPath).pipe(
		  concatMap(exists => exists
			// TODO: remove this concat once host ops emit an event.
			? concat(host.delete(resolvedOutputPath), of(null)).pipe(last())
			// ? of(null)
			: of(null))
		);
	  }
}

export default BrowserBuilder;
