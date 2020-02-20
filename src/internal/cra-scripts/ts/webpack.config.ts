// tslint:disable:no-console
import _ from 'lodash';
import Path from 'path';
import fs from 'fs-extra';
import {Configuration, RuleSetRule, Compiler, RuleSetUseItem, RuleSetLoader} from 'webpack';
// import { RawSource } from 'webpack-sources';
import {drawPuppy, printConfig, getCmdOptions} from './utils';
import {createLazyPackageFileFinder} from 'dr-comp-package/wfh/dist/package-utils';
import change4lib from './webpack-lib';
import {findPackage} from './build-target-helper';
import {ConfigHandlerMgr} from 'dr-comp-package/wfh/dist/config-handler';
import {ConfigureHandler} from './types';

// import chalk from 'chalk';
const ProgressPlugin = require('webpack/lib/ProgressPlugin');


const findPackageByFile = createLazyPackageFileFinder();


export = function(webpackEnv: string) {

  drawPuppy('Pooing on create-react-app', `If you want to know how Webpack is configured, check:\n  ${Path.resolve('/logs')}\n  ${__filename}`);

  const cmdOption = getCmdOptions();
  // console.log('webpackEnv=', webpackEnv);
  // `npm run build` by default is in production mode, below hacks the way react-scripts does
  if (cmdOption.argv.get('dev') || cmdOption.argv.get('watch')) {
    webpackEnv = 'development';
    console.log('Development mode is on:', webpackEnv);
  } else {
    process.env.GENERATE_SOURCEMAP = 'false';
  }
  const origWebpackConfig = require('react-scripts/config/webpack.config');
  const config: Configuration = origWebpackConfig(webpackEnv);
  console.log(__filename, config.output!.publicPath);
  // Make sure babel compiles source folder out side of current src directory
  findAndChangeRule(config.module!.rules);

  const {dir, packageJson} = findPackage(cmdOption.buildTarget);
  if (cmdOption.buildType === 'app') {
    // TODO: do not hard code
    config.resolve!.alias!['alias:dr.cra-start-entry'] = packageJson.name + '/' + packageJson.dr['cra-start-entry'];
    console.log(packageJson.name + '/' + packageJson.dr['cra-start-entry']);
  }


  // Remove ModulesScopePlugin from resolve plugins, it stops us using source fold out side of project directory
  if (config.resolve && config.resolve.plugins) {
    const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
    const srcScopePluginIdx = config.resolve.plugins.findIndex(plugin => plugin instanceof ModuleScopePlugin);
    if (srcScopePluginIdx >= 0) {
      config.resolve.plugins.splice(srcScopePluginIdx, 1);
    }
  }

  // Move project node_modules to first position in resolve order
  if (config.resolve && config.resolve.modules) {
    const topModuleDir = Path.resolve('node_modules');
    const pwdIdx = config.resolve.modules.findIndex(m => m === topModuleDir);
    if (pwdIdx > 0) {
      config.resolve.modules.splice(pwdIdx, 1);
    }
    config.resolve.modules.unshift(topModuleDir);
  }

  Object.assign(config.resolve!.alias, require('rxjs/_esm2015/path-mapping')());
  Object.assign(config.optimization!.splitChunks, {
    chunks: 'all',
    // name: false, default is false for production
    cacheGroups: {
      lazyVendor: {
        name: 'lazy-vendor',
        chunks: 'async',
        enforce: true,
        test: /[\\/]node_modules[\\/]/, // TODO: exclude Dr package source file
        priority: 1
      }
    }
  });
  config.plugins!.push(new (class {
    apply(compiler: Compiler) {
      compiler.hooks.emit.tap('drcp-cli-stats', compilation => {
        setTimeout(() => {
          console.log('');
          console.log(compilation.getStats().toString('normal'));
          console.log('');
        }, 0);
        // const data = JSON.stringify(compilation.getStats().toJson('normal'));
        // compilation.assets['stats.json'] = new RawSource(data);
      });
    }
  })());

  config.plugins!.push(new ProgressPlugin({ profile: true }));

  config.stats = 'normal'; // Not working

  const ssrConfig = (global as any).__SSR;
  if (ssrConfig) {
    ssrConfig(config);
  }

  if (cmdOption.buildType === 'lib')
    change4lib(cmdOption.buildTarget, config);

  const configFileInPackage = Path.resolve(dir, _.get(packageJson, ['dr', 'config-overrides-path'], 'config-overrides.ts'));
  if (fs.existsSync(configFileInPackage)) {
    const cfgMgr = new ConfigHandlerMgr([configFileInPackage]);
    cfgMgr.runEachSync<ConfigureHandler>((cfgFile, result, handler) => {
      handler.webpack(config, webpackEnv, cmdOption);
    });
  }

  fs.mkdirpSync('logs');
  fs.writeFile('logs/webpack.config.debug.js', printConfig(config), (err) => {
    // just for debug
  });
  return config;
};

function findAndChangeRule(rules: RuleSetRule[]): void {
  const craPaths = require('react-scripts/config/paths');
  // TODO: check in case CRA will use Rule.use instead of "loader"
  checkSet(rules);
  for (const rule of rules) {
    if (Array.isArray(rule.use)) {
      checkSet(rule.use);

    } else if (Array.isArray(rule.loader)) {
        checkSet(rule.loader);
    } else if (rule.oneOf) {
      return findAndChangeRule(rule.oneOf);
    }
  }

  function checkSet(set: (RuleSetRule | RuleSetUseItem)[]) {
    for (let i = 0; i < set.length ; i++) {
      const rule = set[i];
      if (typeof rule === 'string' && (rule.indexOf('file-loader') >= 0 || rule.indexOf('url-loader') >= 0)) {
        set[i] = {
          loader: rule,
          options: {
            outputPath(url: string, resourcePath: string, context: string) {
              const pk = findPackageByFile(resourcePath);
              return `${(pk ? pk.shortName : 'external')}/${url}`;
            }
          }
        };
      } else if ((typeof (rule as RuleSetRule | RuleSetLoader).loader) === 'string' &&
        (((rule as RuleSetRule | RuleSetLoader).loader as string).indexOf('file-loader') >= 0 ||
        ((rule as RuleSetRule | RuleSetLoader).loader as string).indexOf('url-loader') >= 0
        )) {
        ((set[i] as RuleSetRule | RuleSetLoader).options as any)!.outputPath = (url: string, resourcePath: string, context: string) => {
          const pk = findPackageByFile(resourcePath);
          return `${(pk ? pk.shortName : 'external')}/${url}`;
        };
      }

      if ((rule as RuleSetRule).include && typeof (rule as RuleSetRule).loader === 'string' &&
        (rule as RuleSetLoader).loader!.indexOf(Path.sep + 'babel-loader' + Path.sep)) {
        delete (rule as RuleSetRule).include;
        const origTest = (rule as RuleSetRule).test;
        (rule as RuleSetRule).test = (file) => {
          const pk = findPackageByFile(file);

          const yes = ((pk && pk.dr) || file.startsWith(craPaths.appSrc)) &&
            (origTest instanceof RegExp) ? origTest.test(file) :
              (origTest instanceof Function ? origTest(file) : origTest === file);
          // console.log(`[webpack.config] babel-loader: ${file}`, yes);
          return yes;
        };
      }
    }
  }
  return;
}
