"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable no-console max-line-length */
const log = require('log4js').getLogger('ChunkInfoPlugin');
const logFd = log;
const logD = log;
const chalk = require('chalk');
const showDependency = false;
const showFileDep = true;
const _ = require("lodash");
const Path = require("path");
class ChunkInfoPlugin {
    apply(compiler) {
        console.log('ChunkInfoPlugin');
        this.compiler = compiler;
        compiler.hooks.emit.tapPromise('ChunkInfoPlugin', (compilation) => {
            log.debug(_.pad(' emit ', 40, '-'));
            return this.printChunks(compilation, compilation.chunks);
        });
    }
    printChunks(compilation, chunks) {
        var self = this;
        chunks.forEach((chunk) => {
            log.debug('chunk: %s, parents:(%s), isOnlyInitial: %s, ids: %s', this.getChunkName(chunk), 'TBD', 
            // chunk.parents.map((p: any) => this.getChunkName(p)).join(', '),
            chunk.isOnlyInitial(), chunk.ids);
            log.debug('\tchildren: (%s)', chunk.chunks.map((ck) => this.getChunkName(ck)).join(', '));
            log.debug('\t%s %s', chunk.hasRuntime() ? '(has runtime)' : '', chunk.hasEntryModule() ? `(has entryModule: ${this.simpleModuleId(chunk.entryModule)})` : '');
            log.debug('  ├─ modules');
            (chunk.getModules ? chunk.getModules() : chunk.modules).forEach((module) => {
                // Explore each source file path that was included into the module:
                log.debug('  │  ├─ %s', this.simpleModuleId(module));
                if (showFileDep)
                    _.each(module.fileDependencies, (filepath) => {
                        logFd.debug('  │  │  ├─ %s', chalk.blue('(fileDependency): ' + Path.relative(this.compiler.options.context, filepath)));
                    });
                _.each(module.blocks, (block) => {
                    log.debug('  │  │  ├─ (block %s): %s', block.constructor.name, _.map(block.chunks, (ck) => {
                        return this.getChunkName(ck);
                    }).join(', '));
                    if (showDependency) {
                        _.each(block.dependencies, (bDep) => {
                            logD.debug(`  │  │  │  ├─ ${bDep.constructor.name}`);
                            if (bDep.module)
                                logD.debug(`  │  │  │  │  ├─ .module ${self.simpleModuleId(bDep.module)}`);
                        });
                    }
                });
                if (showDependency) {
                    _.each(module.dependencies, (dep) => {
                        var source = module._source.source();
                        logD.debug('  │  │  ├─ %s', chalk.blue('(dependency %s): ' + dep.constructor.name), dep.range ? source.substring(dep.range[0], dep.range[1]) : '');
                        if (dep.module)
                            logD.debug(`  │  │  │  ├─ .module ${chalk.blue(self.simpleModuleId(dep.module))}`);
                    });
                }
            });
            log.debug('  │  ');
            // Explore each asset filename generated by the chunk:
            chunk.files.forEach(function (filename) {
                log.debug('  ├── file: %s', filename);
            });
        });
        this.printChunksByEntry(compilation);
    }
    simpleModuleId(m) {
        return Path.relative(this.compiler.options.context, (m.identifier() || m.name).split('!').slice().pop());
    }
    getChunkName(chunk) {
        var id = chunk.debugId;
        if (chunk.id)
            id = chunk.id + '-' + chunk.debugId;
        return '#' + id + ' ' + chalk.green(chunk.name || '');
    }
    printChunksByEntry(compilation) {
        log.info('Entrypoint chunk tree:');
        _.each(compilation.entrypoints, (entrypoint, name) => {
            log.info('entrypoint %s', chalk.green(name));
            _.each(entrypoint.chunks, chunk => log.info('  ├─ %s', chunk.files[0]));
        });
    }
}
exports.default = ChunkInfoPlugin;

//# sourceMappingURL=chunk-info.js.map
