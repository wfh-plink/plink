"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectorSetup = void 0;
const url_1 = require("url");
const path_1 = __importDefault(require("path"));
// import api from '__api';
const lodash_1 = __importDefault(require("lodash"));
const api_share_1 = require("../../isom/api-share");
const package_info_gathering_1 = require("@wfh/plink/wfh/dist/package-mgr/package-info-gathering");
const package_runner_1 = require("@wfh/plink/wfh/dist/package-runner");
function walkPackagesAndSetupInjector(browserOptions, ssr = false) {
    const packageInfo = package_info_gathering_1.walkPackages();
    injectorSetup(packageInfo, browserOptions.drcpArgs, browserOptions.deployUrl, browserOptions.baseHref, ssr);
    return packageInfo;
}
exports.default = walkPackagesAndSetupInjector;
function injectorSetup(packageInfo, drcpArgs, deployUrl, baseHref, ssr = false) {
    const [pks, apiProto] = package_runner_1.initInjectorForNodePackages(drcpArgs, packageInfo);
    package_runner_1.initWebInjector(pks, apiProto);
    const publicUrlObj = url_1.parse(deployUrl || '');
    const baseHrefPath = baseHref ? url_1.parse(baseHref).pathname : undefined;
    Object.assign(apiProto, {
        deployUrl,
        ssr,
        ngBaseRouterPath: publicUrlObj.pathname ? lodash_1.default.trim(publicUrlObj.pathname, '/') : '',
        ngRouterPath: api_share_1.createNgRouterPath(baseHrefPath ? baseHrefPath : undefined),
        ssrRequire(requirePath) {
            if (ssr)
                return require(path_1.default.join(this.__dirname, requirePath));
        }
    });
}
exports.injectorSetup = injectorSetup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3Itc2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmplY3Rvci1zZXR1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw2QkFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLDJCQUEyQjtBQUMzQixvREFBdUI7QUFDdkIsb0RBQXdEO0FBQ3hELG1HQUFxRjtBQUNyRix1RUFBZ0c7QUFHaEcsU0FBd0IsNEJBQTRCLENBQUMsY0FBcUMsRUFBRSxHQUFHLEdBQUcsS0FBSztJQUVyRyxNQUFNLFdBQVcsR0FBRyxxQ0FBWSxFQUFFLENBQUM7SUFDbkMsYUFBYSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1RyxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDO0FBTEQsK0NBS0M7QUFFRCxTQUFnQixhQUFhLENBQUMsV0FBNEMsRUFDeEUsUUFBMkMsRUFDM0MsU0FBNkMsRUFDN0MsUUFBMkMsRUFBRSxHQUFHLEdBQUcsS0FBSztJQUN4RCxNQUFNLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxHQUFHLDRDQUEyQixDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUMzRSxnQ0FBZSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUUvQixNQUFNLFlBQVksR0FBRyxXQUFLLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsV0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBRXJFLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO1FBQ3RCLFNBQVM7UUFDVCxHQUFHO1FBQ0gsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsZ0JBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNqRixZQUFZLEVBQUUsOEJBQWtCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN6RSxVQUFVLENBQUMsV0FBbUI7WUFDNUIsSUFBSSxHQUFHO2dCQUNMLE9BQU8sT0FBTyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBcEJELHNDQW9CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cGFyc2V9IGZyb20gJ3VybCc7XG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJztcbi8vIGltcG9ydCBhcGkgZnJvbSAnX19hcGknO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7Y3JlYXRlTmdSb3V0ZXJQYXRofSBmcm9tICcuLi8uLi9pc29tL2FwaS1zaGFyZSc7XG5pbXBvcnQge3dhbGtQYWNrYWdlcyB9IGZyb20gJ0B3ZmgvcGxpbmsvd2ZoL2Rpc3QvcGFja2FnZS1tZ3IvcGFja2FnZS1pbmZvLWdhdGhlcmluZyc7XG5pbXBvcnQge2luaXRJbmplY3RvckZvck5vZGVQYWNrYWdlcywgaW5pdFdlYkluamVjdG9yfSBmcm9tICdAd2ZoL3BsaW5rL3dmaC9kaXN0L3BhY2thZ2UtcnVubmVyJztcbmltcG9ydCB7QW5ndWxhckJ1aWxkZXJPcHRpb25zfSBmcm9tICcuL2NvbW1vbic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHdhbGtQYWNrYWdlc0FuZFNldHVwSW5qZWN0b3IoYnJvd3Nlck9wdGlvbnM6IEFuZ3VsYXJCdWlsZGVyT3B0aW9ucywgc3NyID0gZmFsc2UpOlxuICBSZXR1cm5UeXBlPHR5cGVvZiB3YWxrUGFja2FnZXM+IHtcbiAgY29uc3QgcGFja2FnZUluZm8gPSB3YWxrUGFja2FnZXMoKTtcbiAgaW5qZWN0b3JTZXR1cChwYWNrYWdlSW5mbywgYnJvd3Nlck9wdGlvbnMuZHJjcEFyZ3MsIGJyb3dzZXJPcHRpb25zLmRlcGxveVVybCwgYnJvd3Nlck9wdGlvbnMuYmFzZUhyZWYsIHNzcik7XG4gIHJldHVybiBwYWNrYWdlSW5mbztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluamVjdG9yU2V0dXAocGFja2FnZUluZm86IFJldHVyblR5cGU8dHlwZW9mIHdhbGtQYWNrYWdlcz4sXG4gIGRyY3BBcmdzOiBBbmd1bGFyQnVpbGRlck9wdGlvbnNbJ2RyY3BBcmdzJ10sXG4gIGRlcGxveVVybDogQW5ndWxhckJ1aWxkZXJPcHRpb25zWydkZXBsb3lVcmwnXSxcbiAgYmFzZUhyZWY6IEFuZ3VsYXJCdWlsZGVyT3B0aW9uc1snYmFzZUhyZWYnXSwgc3NyID0gZmFsc2UpIHtcbiAgY29uc3QgW3BrcywgYXBpUHJvdG9dID0gaW5pdEluamVjdG9yRm9yTm9kZVBhY2thZ2VzKGRyY3BBcmdzLCBwYWNrYWdlSW5mbyk7XG4gIGluaXRXZWJJbmplY3Rvcihwa3MsIGFwaVByb3RvKTtcblxuICBjb25zdCBwdWJsaWNVcmxPYmogPSBwYXJzZShkZXBsb3lVcmwgfHwgJycpO1xuICBjb25zdCBiYXNlSHJlZlBhdGggPSBiYXNlSHJlZiA/IHBhcnNlKGJhc2VIcmVmKS5wYXRobmFtZSA6IHVuZGVmaW5lZDtcblxuICBPYmplY3QuYXNzaWduKGFwaVByb3RvLCB7XG4gICAgZGVwbG95VXJsLFxuICAgIHNzcixcbiAgICBuZ0Jhc2VSb3V0ZXJQYXRoOiBwdWJsaWNVcmxPYmoucGF0aG5hbWUgPyBfLnRyaW0ocHVibGljVXJsT2JqLnBhdGhuYW1lLCAnLycpIDogJycsXG4gICAgbmdSb3V0ZXJQYXRoOiBjcmVhdGVOZ1JvdXRlclBhdGgoYmFzZUhyZWZQYXRoID8gYmFzZUhyZWZQYXRoIDogdW5kZWZpbmVkKSxcbiAgICBzc3JSZXF1aXJlKHJlcXVpcmVQYXRoOiBzdHJpbmcpIHtcbiAgICAgIGlmIChzc3IpXG4gICAgICAgIHJldHVybiByZXF1aXJlKFBhdGguam9pbih0aGlzLl9fZGlybmFtZSwgcmVxdWlyZVBhdGgpKTtcbiAgICB9XG4gIH0pO1xufVxuIl19