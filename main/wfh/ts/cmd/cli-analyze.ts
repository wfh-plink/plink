import {AnalyzeOptions} from './types';
import os from 'os';
import Path from 'path';
import glob from 'glob';
import _ from 'lodash';
import { PayloadAction } from '@reduxjs/toolkit';
import { stateFactory, ofPayloadAction } from '../store';
import { ignoreElements, catchError, map, concatMap} from 'rxjs/operators';
import * as op from 'rxjs/operators';
import {merge, from} from 'rxjs';
import {Context} from './cli-analyse-worker';
import {createCliTable} from '../utils/misc';
import log4js from 'log4js';
import {Pool} from '../../../thread-promise-pool/dist';
import chalk from 'chalk';
import {findPackagesByNames} from './utils';
import {getState} from '../package-mgr';

const log = log4js.getLogger('plink.analyse');
const cpus = os.cpus().length;

export default async function(packages: string[], opts: AnalyzeOptions) {
  if (opts.file && opts.file.length > 0) {
    dispatcher.analyzeFile(opts.file);
  } else if (opts.dir) {
    dispatcher.analyzeFile([opts.dir.replace(/\\/g, '/') + '/**/*']);
  } else {
    // log.warn('Sorry, not implemented yet, use with argument "-f" for now.');
    let i = 0;
    for (const pkg of findPackagesByNames(getState(), packages)) {
      if (pkg == null) {
        log.error(`Can not find package for name "${packages[i]}"`);
        continue;
      }
      dispatcher.analyzeFile([pkg.realPath.replace(/\\/g, '/') + '/**/*']);
      i++;
    }
  }
  getStore().pipe(
    map(s => s.result), op.distinctUntilChanged(),
    op.skip(1),
    op.tap((result) => {
      if (result!.canNotResolve.length > 0) {
        const table = createCliTable({horizontalLines: false});
        table.push([{colSpan: 2, content: chalk.bold('Can not resolve dependecies'), hAlign: 'center'}]);
        table.push([{hAlign: 'right', content: '--'}, '--------']);
        let i = 1;
        for (const msg of result!.canNotResolve) {
          // tslint:disable-next-line: no-console
          console.log(`Can not resolve dependecy: ${JSON.stringify(msg, null, '  ')}`);
          table.push([{hAlign: 'right', content: i++}, JSON.stringify(msg, null, '  ')]);
        }
        // tslint:disable-next-line: no-console
        console.log(table.toString());
      }

      if (result!.cyclic.length > 0) {
        let i = 1;
        const table = createCliTable({horizontalLines: false});
        table.push([{colSpan: 2, content: chalk.bold('Cyclic dependecies'), hAlign: 'center'}]);
        table.push([{hAlign: 'right', content: '--'}, '--------']);
        for (const msg of result!.cyclic) {
          table.push([{hAlign: 'right', content: i++}, msg]);
        }
        // tslint:disable-next-line: no-console
        console.log(table.toString());
      }

      if (result!.externalDeps.length > 0) {
        let i = 1;
        const table = createCliTable({horizontalLines: false});
        table.push([{colSpan: 2, content: chalk.bold('External dependecies'), hAlign: 'center'}]);
        if (!opts.j) {
          table.push([{hAlign: 'right', content: '--'}, '--------']);
          for (const msg of result!.externalDeps) {
            table.push([{hAlign: 'right', content: i++}, msg]);
          }
        }
        // tslint:disable-next-line: no-console
        console.log(table.toString());
        if (opts.j) {
          // tslint:disable-next-line: no-console
          console.log(JSON.stringify(result!.externalDeps, null, '  '));
        }
      }

      if (result!.relativeDepsOutSideDir.length > 0) {
        let i = 1;
        const table = createCliTable({horizontalLines: false});
        table.push([{
          colSpan: 2,
          content: chalk.bold(`Dependencies outside of ${result!.commonDir}`),
          hAlign: 'center'
        }]);
        table.push([{hAlign: 'right', content: '--'}, '--------']);
        for (const msg of result!.relativeDepsOutSideDir) {
          table.push([{hAlign: 'right', content: i++}, msg]);
        }
        // tslint:disable-next-line: no-console
        console.log(table.toString());
      }
    }),
    op.take(1)
  ).subscribe();

}
interface AnalyzeState {
  inputFiles?: string[];
  result?: ReturnType<Context['toPlainObject']>;
}

const initState: AnalyzeState = {
};

const slice = stateFactory.newSlice({
  name: 'analyze',
  initialState: initState,
  reducers: {
    /** payload: glob patterns */
    analyzeFile(d, {payload}: PayloadAction<string[]>) {
      d.inputFiles = payload;
    }
  }
});

export function getStore() {
  return stateFactory.sliceStore(slice);
}

export const dispatcher = stateFactory.bindActionCreators(slice);

stateFactory.addEpic<{analyze: AnalyzeState}>((action$, state$) => {
  return merge(
    action$.pipe(ofPayloadAction(slice.actions.analyzeFile),
      concatMap((action) => from(analyseFiles(action.payload))),
      map(result => {
        dispatcher._change(s => s.result = result);
      })
    )
  ).pipe(
    catchError((err, src) => {
      console.error(err);
      return src;
    }),
    ignoreElements()
  );
});


async function analyseFiles(files: string[]) {
  const matchDones = files.map(pattern => new Promise<string[]>((resolve, reject) => {
    glob(pattern, {nodir: true}, (err, matches) => {
      if (err) {
        return reject(err);
      }
      resolve(matches);
    });
  }));
  files = _.flatten((await Promise.all(matchDones)))
  // .map(file => {
  //   console.log(file);
  //   return file;
  // })
  .filter(f => /\.[jt]sx?$/.test(f));
  const threadPool = new Pool(cpus - 1, 0, {
    // initializer: {file: 'source-map-support/register'},
    verbose: false
  });

  return await threadPool.submitProcess<ReturnType<Context['toPlainObject']>>({
    file: Path.resolve(__dirname, 'cli-analyse-worker.js'),
    exportFn: 'dfsTraverseFiles',
    args: [files.map(p => Path.resolve(p))]
  });

}