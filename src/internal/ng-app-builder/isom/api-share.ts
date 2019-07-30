import Url from 'url';
import trimStart from 'lodash/trimStart';



export function createNgRouterPath(baseHrefPath?: string) {
  /**@function ngRouterPath
   * @memberOf __api
   * e.g.
   * Assume application is deployed on 'http://foobar.com/base-href' as "deployUrl" in angular.json.
   * Current feature package is `@bk/feature-a`, its `ngRoutePath` is by default 'feature-a',
   * feature package `@bk/feature-b`'s `ngRoutePath` is by default 'feature-b'
   *  ```ts
   * __api.ngRouterPath('action')  // "/base-href/feature-a/action"
   * __api.ngRouterPath('@bk/feature-b', 'action')   // "/base-href/feature-b/action"
   * ```
   * @return the configured Angular router path for specific (current) feature package
   */
  return function ngRouterPath(packageName: string, subPath?: string) {
    const url = this.assetsUrl(packageName, subPath);
    const currUrl = Url.parse(url).pathname || '';
    if (baseHrefPath) {
      if (currUrl.indexOf(baseHrefPath) === 0) {
        return trimStart(currUrl.slice(baseHrefPath.length), '/');
      }
    }
    return trimStart(currUrl, '/');
  };
}
