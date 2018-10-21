/* tslint:disable max-line-length */
import './node-inject';

import {
	BuildEvent,
	BuilderConfiguration
  } from '@angular-devkit/architect';
  import { WebpackBuilder } from '@angular-devkit/build-webpack';
  import { normalize, resolve, virtualFs } from '@angular-devkit/core';
  import * as fs from 'fs';
  import { Observable, of } from 'rxjs';
  import { concatMap, tap } from 'rxjs/operators';
  import { augmentAppWithServiceWorker } from '@angular-devkit/build-angular/src/angular-cli-files/utilities/service-worker';
  import { normalizeAssetPatterns, normalizeFileReplacements } from '@angular-devkit/build-angular/src/utils';
  import { BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';

import {BrowserBuilder as GoogleBrowserBuilder, NormalizedBrowserBuilderSchema, getBrowserLoggingCb} from '@angular-devkit/build-angular';
import * as drcpCommon from './common';

export default class BrowserBuilder extends GoogleBrowserBuilder {
	run(builderConfig: BuilderConfiguration<BrowserBuilderSchema>): Observable<BuildEvent> {
		const options = builderConfig.options;
		const root = this.context.workspace.root;
		const projectRoot = resolve(root, builderConfig.root);
		const host = new virtualFs.AliasHost(this.context.host as virtualFs.Host<fs.Stats>);
		const webpackBuilder = new WebpackBuilder({ ...this.context, host });

		return of(null).pipe(
			concatMap(() => options.deleteOutputPath
				? (this as any)._deleteOutputDir(root, normalize(options.outputPath), this.context.host)
				: of(null)),
			concatMap(() => normalizeFileReplacements(options.fileReplacements, host, root)),
			tap(fileReplacements => options.fileReplacements = fileReplacements),
			concatMap(() => normalizeAssetPatterns(
				options.assets, host, root, projectRoot, builderConfig.sourceRoot)),
			// Replace the assets in options with the normalized version.
			tap((assetPatternObjects => options.assets = assetPatternObjects)),
			concatMap(() => {
				return drcpCommon.compile(builderConfig.root, builderConfig,
					() => {
						return this.buildWebpackConfig(root, projectRoot, host,
						options as NormalizedBrowserBuilderSchema);
					});
				}),
		  concatMap((webpackConfig) => {
			// let webpackConfig;
			// try {
			//   webpackConfig = this.buildWebpackConfig(root, projectRoot, host,
			// 	options as NormalizedBrowserBuilderSchema);
			// } catch (e) {
			//   return throwError(e);
			// }

			return webpackBuilder.runWebpack(webpackConfig, getBrowserLoggingCb(options.verbose));
		  }),
		  concatMap((buildEvent: BuildEvent) => {
			if (buildEvent.success && !options.watch && options.serviceWorker) {
			  return new Observable(obs => {
				augmentAppWithServiceWorker(
				  this.context.host,
				  root,
				  projectRoot,
				  resolve(root, normalize(options.outputPath)),
				  options.baseHref || '/',
				  options.ngswConfigPath
				).then(
				  () => {
					obs.next({ success: true });
					obs.complete();
				  },
				  (err: Error) => {
					obs.error(err);
				  }
				);
			  });
			} else {
			  return of(buildEvent);
			}
		  })
		);
	}

}
