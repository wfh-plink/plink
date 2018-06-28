/* tslint:disable no-console max-line-length */
const log = require('log4js').getLogger('ChunkInfoPlugin');
const logFd = log;
const logD = log;
const chalk = require('chalk');
const showDependency = false;
const showFileDep = false;
const {cyan, green} = require('chalk');
import * as _ from 'lodash';
import * as Path from 'path';
import api from '__api';
export default class ChunkInfoPlugin {
	compiler: any;
	done = false;

	apply(compiler: any) {
		log.info('----- ChunkInfoPlugin -----');
		this.compiler = compiler;
		compiler.hooks.emit.tapPromise('ChunkInfoPlugin', (compilation: any) => {
			if (this.done)
				return Promise.resolve();
			this.done = true;
			log.info(_.pad(' emit ', 40, '-'));
			return this.printChunkGroups(compilation);
		});
	}

	async printChunkGroups(compilation: any) {
		for (const cg of compilation.chunkGroups) {
			// log.info('Named chunk groups: ' + compilation.namedChunkGroups.keys().join(', '));
			// log.info('entrypoints: ' + compilation.entrypoints.keys().join(', '));
			log.info('');
			log.info(`Chunk group: ${cyan(cg.name || cg.id)}`);
			log.info('├─  children: (%s)', cg.getChildren().map((ck: any) => green(this.getChunkName(ck))).join(', '));
			log.info(`├─  parents: ${cg.getParents().map((ck: any) => green(this.getChunkName(ck))).join(', ')}`);
			this.printChunks(cg.chunks, compilation);
		}
		this.printChunksByEntry(compilation);
	}

	printChunks(chunks: any, compilation: any) {
		var self = this;
		chunks.forEach((chunk: any) => {
			log.info('├─  chunk: %s, isOnlyInitial: %s, ids: %s',
				this.getChunkName(chunk),
				// chunk.parents.map((p: any) => this.getChunkName(p)).join(', '),
				chunk.isOnlyInitial(), chunk.ids);
			// log.info('\tchildren: (%s)', chunk.chunks.map((ck: any) => this.getChunkName(ck)).join(', '));
			log.info('│    ├─ %s %s', chunk.hasRuntime() ? '(has runtime)' : '', chunk.hasEntryModule() ? `(has entryModule: ${this.moduleFileName(chunk.entryModule)})` : '');

			log.info(`│    ├─ ${green('modules')}`);
			(chunk.getModules ? chunk.getModules() : chunk.modules).forEach((module: any) => {
				// Explore each source file path that was included into the module:
				const moduleName = this.moduleFileName(module);
				log.info('│    │  ├─ %s', moduleName);
				const pk = api.findPackageByFile(Path.resolve(this.compiler.options.context, moduleName));
				if (module.buildInfo.fileDependencies && (showFileDep || (pk && pk.dr && module.buildInfo.fileDependencies))) {
					for (const filepath of module.buildInfo.fileDependencies) {
						logFd.info('│    │  │  ├─ %s', chalk.blue('(fileDependency): ' + Path.relative(this.compiler.options.context, filepath)));
					}
				}
				_.each(module.blocks, (block: any) => {
					const cacheGroups = _.map(block.chunkGroup, (cg: any) => cg.name).filter(name => name).join(', ');
					log.info(`│    │  │  ├─ (block ${block.constructor.name}): chunk group (${cacheGroups})`);
					if (showDependency || (pk && pk.dr)) {
						_.each(block.dependencies, (bDep: any) => {
							logD.info(`│    │  │  │  ├─ ${bDep.constructor.name}`);
							if (bDep.module)
								logD.info(`│    │  │  │  │  ├─ .module ${self.moduleFileName(bDep.module)}`);
						});
					}
				});
				if (showDependency) {
					_.each(module.dependencies, (dep: any) => {
						var source = module._source.source();
						logD.debug('│    │  │  ├─ %s', chalk.blue('(dependency %s): ' + dep.constructor.name),
							dep.range ? source.substring(dep.range[0], dep.range[1]) : '');
						if (dep.module)
							logD.debug(`│    │  │  │  ├─ .module ${chalk.blue(self.moduleFileName(dep.module))}`);
					});
				}
			});
			log.info('│    │  ');

			// Explore each asset filename generated by the chunk:
			chunk.files.forEach(function(filename: string) {
				log.info('│    ├── file: %s', filename);
			});
		});
	}

	moduleFileName(m: any) {
		const fileName = m.nameForCondition ? m.nameForCondition() : (m.identifier() || m.name).split('!').slice().pop();
		// return Path.relative(this.compiler.options.context, (m.identifier() || m.name).split('!').slice().pop());
		return Path.relative(this.compiler.options.context, fileName);
	}

	getChunkName(chunk: any) {
		var id = chunk.debugId;
		if (chunk.id)
			id = chunk.id + '-' + chunk.debugId;
		return '#' + id + ' ' + chalk.green(chunk.name || '');
	}

	printChunksByEntry(compilation: any) {
		log.info('Entrypoint chunk tree:');
		_.each(compilation.entrypoints, (entrypoint: any, name: string) => {
			log.info('entrypoint %s', chalk.green(name));
			_.each(entrypoint.chunks, (chunk: any) => log.info('  ├─ %s', chunk.files[0]));
		});
	}

}
