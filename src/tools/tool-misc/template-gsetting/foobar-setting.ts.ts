import {config, InjectorConfigHandler} from '@wfh/plink';

/**
 * Package setting type
 */
export interface $__Foobar__$Setting {
  /** Description of config property */
  disabled: boolean;
}

/**
 * Plink runs this funtion to get package level setting value,
 * function name "defaultSetting" must be also configured in package.json file
 */
export function defaultSetting(): $__Foobar__$Setting {
  const defaultValue: $__Foobar__$Setting = {
    disabled: false
  };
  // Return settings based on command line option "dev"
  if (config().cliOptions?.dev) {
    defaultValue.disabled = true;
  }

  const env = config().cliOptions?.env;
  // Return settings based on command line option "env"
  if (env === 'local') {
    defaultValue.disabled = true;
  }

  return defaultValue;
}

/**
 * The return setting value is merged with files specified by command line options "--prop" and "-c"
 * @return setting of current package
 */
export function getSetting() {
  // tslint:disable:no-string-literal
  return config()['$__foobarPackage__$']!;
}

const otherConfigures: InjectorConfigHandler = {
    /** For Node.js runtime, replace module in "require()" or import syntax */
    setupNodeInjector(factory, setting) {
      // factory.fromPackage('@wfh/foobar').alias('moduleA', 'moduleB');
    },
    /** For Client framework build tool (React, Angular), replace module in "require()" or import syntax */
    setupWebInjector(factory, setting) {
      // factory.fromPackage('@wfh/foobar').alias('moduleA', 'moduleB');
    }
};

export default otherConfigures;