import {parse} from 'url';
import Path from 'path';
// import api from '__api';
import _ from 'lodash';
// import {createNgRouterPath} from '../../isom/api-share';
import {walkPackages } from '@wfh/plink/wfh/dist/package-mgr/package-info-gathering';
import {initInjectorForNodePackages} from '@wfh/plink/wfh/dist/package-runner';

/**
 * @deprecated
 * @param deployUrl
 * @param ssr 
 */
export default async function walkPackagesAndSetupInjector(deployUrl: string, ssr = false):
  Promise<ReturnType<typeof walkPackages>> {

  const packageInfo = walkPackages();
  const apiProto = initInjectorForNodePackages()[1];
  // await initWebInjector(pks, apiProto);

  const publicUrlObj = parse(deployUrl || '');
  // const baseHrefPath = baseHref ? parse(baseHref).pathname : undefined;

  Object.assign(apiProto, {
    deployUrl,
    ssr,
    ngBaseRouterPath: publicUrlObj.pathname ? _.trim(publicUrlObj.pathname, '/') : '',
    // ngRouterPath: createNgRouterPath(baseHrefPath ? baseHrefPath : undefined),
    ssrRequire(requirePath: string) {
      if (ssr)
        return require(Path.join(this.__dirname, requirePath));
    }
  });
  return packageInfo;
}

