/* eslint-disable max-len */
import * as fs from 'fs-extra';
import _ from 'lodash';
import log4js from 'log4js';
import Path from 'path';
import chalk from 'chalk';
import { setTsCompilerOptForNodePath, CompilerOptions } from './package-mgr/package-list-helper';
import {filterEffect} from '../../packages/redux-toolkit-observable/dist/rx-utils';
import { getProjectList, pathToProjKey, getState as getPkgState, getStore as pkgStore, updateGitIgnores, slice as pkgSlice,
  isCwdWorkspace, workspaceDir } from './package-mgr';
import { stateFactory, ofPayloadAction, action$Of } from './store';
import * as _recp from './recipe-manager';
import {symbolicLinkPackages} from './rwPackageJson';
import {getPackageSettingFiles} from './config';
import * as rx from 'rxjs';
import * as op from 'rxjs/operators';
import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import {plinkEnv, closestCommonParentDir} from './utils/misc';

const {workDir, distDir, rootDir: rootPath} = plinkEnv;


// import Selector from './utils/ts-ast-query';
const log = log4js.getLogger('plink.editor-helper');
const {parse} = require('comment-json');
interface EditorHelperState {
  /** tsconfig files should be changed according to linked packages state */
  tsconfigByRelPath: Map<string, HookedTsconfig>;
  /** problematic symlinks which must be removed before running
   * node_modules symlink is under source package directory, it will not work with "--preserve-symlinks",
   * in which case, Node.js will regard a workspace node_module and its symlink inside source package as
   * twe different directory, and causes problem
   */
  nodeModuleSymlinks?: Set<string>;
}

interface HookedTsconfig {
  /** absolute path or path relative to root path, any path that is stored in Redux store, the better it is in form of
   * relative path of Root path
   */
  relPath: string;
  baseUrl: string;
  originJson: any;
}

const initialState: EditorHelperState = {
  tsconfigByRelPath: new Map()
};

const slice = stateFactory.newSlice({
  name: 'editor-helper',
  initialState,
  reducers: {
    clearSymlinks(s) {},
    hookTsconfig(s, {payload}: PayloadAction<string[]>) {},
    unHookTsconfig(s, {payload}: PayloadAction<string[]>) {
      for (const file of payload) {
        const relPath = relativePath(file);
        s.tsconfigByRelPath.delete(relPath);
      }
    },
    unHookAll() {},
    clearSymlinksDone(S) {}
  }
});

export const dispatcher = stateFactory.bindActionCreators(slice);

stateFactory.addEpic<EditorHelperState>((action$, state$) => {
  let noModuleSymlink: Set<string>;

  return rx.merge(
    pkgStore().pipe(
      filterEffect(s => [s.linkedDrcp, s.installedDrcp]),
      op.filter(([linkedDrcp, installedDrcp]) => linkedDrcp != null || installedDrcp != null),
      op.map(([linkedDrcp, installedDrcp]) => {
        // if (getPkgState().linkedDrcp) {
        const plinkDir = linkedDrcp || installedDrcp!;
        const file = Path.resolve(plinkDir.realPath, 'wfh/tsconfig.json');
        const relPath = Path.relative(rootPath, file).replace(/\\/g, '/');
        if (!getState().tsconfigByRelPath.has(relPath)) {
          process.nextTick(() => dispatcher.hookTsconfig([file]));
        }
        return rx.EMPTY;
      })
    ),
    action$.pipe(ofPayloadAction(pkgSlice.actions._setCurrentWorkspace),
      op.concatMap(({payload: wsKey}) => {
        if (wsKey == null)
          return rx.EMPTY;
        if (noModuleSymlink == null) {
          noModuleSymlink = new Set();
          for (const projDir of getPkgState().project2Packages.keys()) {
            const rootPkgJson = require(Path.resolve(plinkEnv.rootDir, projDir, 'package.json')) as {plink?: {noModuleSymlink?: string[]}};
            for (const dir of (rootPkgJson.plink?.noModuleSymlink || []).map(item => Path.resolve(plinkEnv.rootDir, projDir, item))) {
              noModuleSymlink.add(dir);
            }
          }
        }

        const currWorkspaceDir = workspaceDir(wsKey);
        return rx.from(_recp.allSrcDirs()).pipe(
          op.map(item => item.projDir ? Path.resolve(item.projDir, item.srcDir) : item.srcDir),
          op.filter(dir => !noModuleSymlink.has(dir)),
          op.mergeMap(destDir => {
            if (fs.existsSync(Path.join(destDir, 'package.json'))) {
              dispatcher._change(s => {
                if (s.nodeModuleSymlinks == null)
                  s.nodeModuleSymlinks = new Set([Path.join(destDir, 'node_modules')]);
                else
                  s.nodeModuleSymlinks.add(Path.join(destDir, 'node_modules'));
              });
            }
            return rx.of({name: 'node_modules', realPath: Path.join(currWorkspaceDir, 'node_modules')}).pipe(
              symbolicLinkPackages(destDir)
            );
          })
        );
      })
    ),
    action$.pipe(ofPayloadAction(slice.actions.clearSymlinks),
      op.concatMap(() => {
        return rx.from(_recp.allSrcDirs()).pipe(
          op.map(item => item.projDir ? Path.resolve(item.projDir, item.srcDir, 'node_modules') :
            Path.resolve(item.srcDir, 'node_modules')),
          op.mergeMap(dir => {
            return rx.from(fs.promises.lstat(dir)).pipe(
              op.filter(stat => stat.isSymbolicLink()),
              op.mergeMap(stat => {
                log.info('remove symlink ' + dir);
                return fs.promises.unlink(dir);
              })
            );
          }),
          op.finalize(() => dispatcher.clearSymlinksDone())
        );
      })
    ),
    action$.pipe(ofPayloadAction(pkgSlice.actions.workspaceChanged),
      op.concatMap(async ({payload: wsKeys}) => {
        const wsDir = isCwdWorkspace() ? workDir :
          getPkgState().currWorkspace ? Path.resolve(rootPath, getPkgState().currWorkspace!)
          : undefined;
        await writePackageSettingType();
        updateTsconfigFileForProjects(wsKeys[wsKeys.length - 1]);
        await Promise.all(Array.from(getState().tsconfigByRelPath.values())
          .map(data => updateHookedTsconfig(data, wsDir)));
      })
    ),
    action$.pipe(ofPayloadAction(slice.actions.hookTsconfig),
      op.mergeMap(action => {
        return action.payload;
      }),
      op.mergeMap((file) => {
        const relPath = Path.relative(rootPath, file).replace(/\\/g, '/');
        const backupFile = backupTsConfigOf(file);
        const isBackupExists = fs.existsSync(backupFile);
        const fileContent = isBackupExists ? fs.readFileSync(backupFile, 'utf8') : fs.readFileSync(file, 'utf8');
        const json = JSON.parse(fileContent) as {compilerOptions: CompilerOptions};
        const data: HookedTsconfig = {
          relPath,
          baseUrl: json.compilerOptions.baseUrl,
          originJson: json
        };
        dispatcher._change(s => {
          s.tsconfigByRelPath.set(relPath, data);
        });

        if (!isBackupExists) {
          fs.writeFileSync(backupFile, fileContent);
        }
        const wsDir = isCwdWorkspace() ? workDir :
          getPkgState().currWorkspace ? Path.resolve(rootPath, getPkgState().currWorkspace!)
          : undefined;
        return updateHookedTsconfig(data, wsDir);
      })
    ),
    action$.pipe(ofPayloadAction(slice.actions.unHookTsconfig),
      op.mergeMap(({payload}) => payload),
      op.mergeMap(file => {
        const absFile = Path.resolve(rootPath, file);
        const backup = backupTsConfigOf(absFile);
        if (fs.existsSync(backup)) {
          log.info('Roll back:', absFile);
          return fs.promises.copyFile(backup, absFile);
        }
        return Promise.resolve();
      })
    ),
    action$.pipe(ofPayloadAction(slice.actions.unHookAll),
      op.tap(() => {
        dispatcher.unHookTsconfig(Array.from(getState().tsconfigByRelPath.keys()));
      })
    )
  ).pipe(
    op.ignoreElements(),
    op.catchError((err, caught) => {
      log.error(err);
      return caught;
    })
  );
});

export function getAction$(type: keyof (typeof slice)['caseReducers']) {
  return action$Of(stateFactory, slice.actions[type] as ActionCreatorWithPayload<any, any>);
}

export function getState() {
  return stateFactory.sliceState(slice);
}

export function getStore() {
  return stateFactory.sliceStore(slice);
}

function relativePath(file: string) {
  return Path.relative(rootPath, file).replace(/\\/g, '/');
}

function updateTsconfigFileForProjects(wsKey: string, includeProject?: string) {
  const ws = getPkgState().workspaces.get(wsKey);
  if (ws == null)
    return;

  const projectDirs = getProjectList();
  const workspaceDir = Path.resolve(rootPath, wsKey);

  const recipeManager = require('./recipe-manager') as typeof _recp;

  const srcRootDir = closestCommonParentDir(projectDirs);

  if (includeProject) {
    writeTsConfigForProj(includeProject);
  } else {
    for (const proj of projectDirs) {
      writeTsConfigForProj(proj);
    }
  }

  function writeTsConfigForProj(proj: string) {
    const include: string[] = [];
    recipeManager.eachRecipeSrc(proj, (srcDir: string) => {
      let includeDir = Path.relative(proj, srcDir).replace(/\\/g, '/');
      if (includeDir && includeDir !== '/')
        includeDir += '/';
      include.push(includeDir + '**/*.ts');
      include.push(includeDir + '**/*.tsx');
    });

    if (pathToProjKey(proj) === getPkgState().linkedDrcpProject) {
      include.push('main/wfh/**/*.ts');
    }
    include.push('dist/*.package-settings.d.ts');
    const tsconfigFile = createTsConfig(proj, srcRootDir, workspaceDir, {},
      // {'_package-settings': [Path.relative(proj, packageSettingDtsFileOf(workspaceDir))
      //   .replace(/\\/g, '/')
      //   .replace(/\.d\.ts$/, '')]
      // },
      include
    );
    const projDir = Path.resolve(proj);
    updateGitIgnores({file: Path.resolve(proj, '.gitignore'),
      lines: [
        Path.relative(projDir, tsconfigFile).replace(/\\/g, '/')
      ]
    });
    updateGitIgnores({
      file: Path.resolve(rootPath, '.gitignore'),
      lines: [Path.relative(rootPath, Path.resolve(workspaceDir, 'types')).replace(/\\/g, '/')]
    });
  }
}

function writePackageSettingType() {
  const done = new Array<Promise<unknown>>(getPkgState().workspaces.size);
  let i = 0;
  for (const wsKey of getPkgState().workspaces.keys()) {
    let header = '';
    let body = 'export interface PackagesConfig {\n';
    for (const [typeFile, typeExport, _defaultFile, _defaultExport, pkg] of getPackageSettingFiles(wsKey)) {
      const varName = pkg.shortName.replace(/-([^])/g, (match, g1: string) => g1.toUpperCase());
      const typeName = varName.charAt(0).toUpperCase() + varName.slice(1);
      header += `import {${typeExport} as ${typeName}} from '${pkg.name}/${typeFile}';\n`;
      body += `  '${pkg.name}': ${typeName};\n`;
    }
    body += '}\n';
    // const workspaceDir = Path.resolve(rootPath, wsKey);
    const file = Path.join(distDir, wsKey + '.package-settings.d.ts');
    log.info(`write setting file: ${chalk.blue(file)}`);
    done[i++] = fs.promises.writeFile(file, header + body);
    // const dir = Path.dirname(file);
    // const srcRootDir = closestCommonParentDir([
    //   dir,
    //   closestCommonParentDir(Array.from(packages4WorkspaceKey(wsKey)).map(pkg => pkg.realPath))
    // ]);
    // createTsConfig(dir, srcRootDir, workspaceDir, {}, ['*.ts']);
  }
  return Promise.all(done);
}

/**
 * 
 * @param pkgName 
 * @param dir 
 * @param workspace 
 * @param drcpDir 
 * @param include 
 * @return tsconfig file path
 */
function createTsConfig(proj: string, srcRootDir: string, workspace: string,
  extraPathMapping: {[path: string]: string[]},
  include = ['**/*.ts']) {
  const tsjson: {extends?: string; include: string[]; compilerOptions?: Partial<CompilerOptions>} = {
    extends: undefined,
    include
  };
  const drcpDir = (getPkgState().linkedDrcp || getPkgState().installedDrcp)!.realPath;
  // tsjson.include = [];
  tsjson.extends = Path.relative(proj, Path.resolve(drcpDir, 'wfh/tsconfig-base.json'));
  if (!Path.isAbsolute(tsjson.extends) && !tsjson.extends.startsWith('..')) {
    tsjson.extends = './' + tsjson.extends;
  }
  tsjson.extends = tsjson.extends.replace(/\\/g, '/');

  const rootDir = Path.relative(proj, srcRootDir).replace(/\\/g, '/') || '.';
  tsjson.compilerOptions = {
    rootDir,
      // noResolve: true, // Do not add this, VC will not be able to understand rxjs module
    skipLibCheck: false,
    jsx: 'preserve',
    target: 'es2015',
    module: 'commonjs',
    strict: true,
    declaration: false, // Important: to avoid https://github.com/microsoft/TypeScript/issues/29808#issuecomment-487811832
    paths: extraPathMapping
  };
  setTsCompilerOptForNodePath(proj, proj, tsjson.compilerOptions, {
    workspaceDir: workspace,
    enableTypeRoots: true,
    realPackagePaths: true
  });
  const tsconfigFile = Path.resolve(proj, 'tsconfig.json');
  writeTsConfigFile(tsconfigFile, tsjson);
  return tsconfigFile;
}

function backupTsConfigOf(file: string) {
  // const tsconfigDir = Path.dirname(file);
  const m = /([^/\\.]+)(\.[^/\\.]+)?$/.exec(file);
  const backupFile = Path.resolve(file.slice(0, file.length - m![0].length) + m![1] + '.orig' + m![2]);
  return backupFile;
}


async function updateHookedTsconfig(data: HookedTsconfig, workspaceDir?: string) {
  const file = Path.isAbsolute(data.relPath) ? data.relPath :
    Path.resolve(rootPath, data.relPath);
  const tsconfigDir = Path.dirname(file);
  const backup = backupTsConfigOf(file);

  const json = (fs.existsSync(backup) ?
    JSON.parse(await fs.promises.readFile(backup, 'utf8')) : _.cloneDeep(data.originJson) ) as  {compilerOptions?: CompilerOptions};

  if (json.compilerOptions?.paths && json.compilerOptions.paths['_package-settings'] != null) {
    delete json.compilerOptions.paths['_package-settings'];
  }
  const newCo = setTsCompilerOptForNodePath(tsconfigDir, data.baseUrl,
    json.compilerOptions as any, {
      workspaceDir, enableTypeRoots: true, realPackagePaths: true
    });
  json.compilerOptions = newCo;
  log.info('update:', chalk.blue(file));
  return fs.promises.writeFile(file, JSON.stringify(json, null, '  '));
}

function overrideTsConfig(src: any, target: any) {
  for (const key of Object.keys(src)) {
    if (key === 'compilerOptions') {
      if (target.compilerOptions)
        Object.assign(target.compilerOptions, src.compilerOptions);
    } else {
      target[key] = src[key];
    }
  }
}

function writeTsConfigFile(tsconfigFile: string, tsconfigOverrideSrc: any) {
  if (fs.existsSync(tsconfigFile)) {
    const existing = fs.readFileSync(tsconfigFile, 'utf8');
    const existingJson = parse(existing);
    overrideTsConfig(tsconfigOverrideSrc, existingJson);
    const newJsonStr = JSON.stringify(existingJson, null, '  ');
    if (newJsonStr !== existing) {
      log.info('Write tsconfig: ' + chalk.blue(tsconfigFile));
      fs.writeFileSync(tsconfigFile, JSON.stringify(existingJson, null, '  '));
    } else {
      log.debug(`${tsconfigFile} is not changed.`);
    }
  } else {
    log.info('Create tsconfig: ' + chalk.blue(tsconfigFile));
    fs.writeFileSync(tsconfigFile, JSON.stringify(tsconfigOverrideSrc, null, '  '));
  }
}

// async function writeTsconfigForEachPackage(workspaceDir: string, pks: PackageInfo[],
//   onGitIgnoreFileUpdate: (file: string, content: string) => void) {

//   const drcpDir = getState().linkedDrcp ? getState().linkedDrcp!.realPath :
//     Path.dirname(require.resolve('@wfh/plink/package.json'));

//   const igConfigFiles = pks.map(pk => {
//     // commonPaths[0] = Path.resolve(pk.realPath, 'node_modules');
//     return createTsConfig(pk.name, pk.realPath, workspaceDir, drcpDir);
//   });

//   appendGitignore(igConfigFiles, onGitIgnoreFileUpdate);
// }

// function findGitIngoreFile(startDir: string): string | null {
//   let dir = startDir;
//   while (true) {
//     const test = Path.resolve(startDir, '.gitignore');
//     if (fs.existsSync(test)) {
//       return test;
//     }
//     const parent = Path.dirname(dir);
//     if (parent === dir)
//       return null;
//     dir = parent;
//   }
// }
