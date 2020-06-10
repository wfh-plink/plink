"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("./utils");
const build_target_helper_1 = require("./build-target-helper");
const path_1 = tslib_1.__importDefault(require("path"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const drcpWorkdir = findDrcpWorkdir();
function paths() {
    const cmdPublicUrl = utils_1.getCmdOptions().argv.get('publicUrl') || utils_1.getCmdOptions().argv.get('public-url');
    if (cmdPublicUrl) {
        process.env.PUBLIC_URL = cmdPublicUrl + '';
    }
    const paths = require(path_1.default.resolve('node_modules/react-scripts/config/paths'));
    const changedPaths = paths;
    const cmdOption = utils_1.getCmdOptions();
    const { dir, packageJson } = build_target_helper_1.findPackage(cmdOption.buildTarget);
    // console.log('[debug] ', cmdOption);
    if (cmdOption.buildType === 'lib') {
        changedPaths.appBuild = path_1.default.resolve(dir, 'build');
        changedPaths.appIndexJs = path_1.default.resolve(dir, lodash_1.default.get(packageJson, 'dr.cra-build-entry', 'public_api.ts'));
    }
    else if (cmdOption.buildType === 'app') {
        changedPaths.appBuild = path_1.default.resolve(drcpWorkdir, 'dist/static');
        // const {dir} = findPackage(cmdOption.buildTarget);
        // changedPaths.appBuild = Path.resolve(dir, 'build');
        // changedPaths.appIndexJs = Path.resolve(dir, _.get(packageJson, 'dr.cra-serve-entry', 'serve_index.ts'));
    }
    // tslint:disable-next-line: no-console
    console.log('[cra-scripts-paths] changed react-scripts paths:\n', changedPaths);
    return changedPaths;
}
exports.default = paths;
function findDrcpWorkdir() {
    let dir = path_1.default.resolve();
    let parent = null;
    while (true) {
        const testDir = path_1.default.resolve(dir, 'node_modules', 'dr-comp-package');
        if (fs_1.default.existsSync(testDir)) {
            return dir;
        }
        parent = path_1.default.dirname(dir);
        if (parent === dir || parent == null)
            throw new Error('Can not find DRCP workspace');
        dir = parent;
    }
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AYmsvY3JhLXNjcmlwdHMvdHMvY3JhLXNjcmlwdHMtcGF0aHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQXNDO0FBQ3RDLCtEQUFrRDtBQUNsRCx3REFBd0I7QUFDeEIsNERBQXVCO0FBQ3ZCLG9EQUFvQjtBQXlCcEIsTUFBTSxXQUFXLEdBQUcsZUFBZSxFQUFFLENBQUM7QUFFdEMsU0FBd0IsS0FBSztJQUMzQixNQUFNLFlBQVksR0FBRyxxQkFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxxQkFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNyRyxJQUFJLFlBQVksRUFBRTtRQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxZQUFZLEdBQUcsRUFBRSxDQUFDO0tBQzVDO0lBQ0QsTUFBTSxLQUFLLEdBQW9CLE9BQU8sQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLHlDQUF5QyxDQUFDLENBQUMsQ0FBQztJQUNoRyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7SUFDM0IsTUFBTSxTQUFTLEdBQUcscUJBQWEsRUFBRSxDQUFDO0lBQ2xDLE1BQU0sRUFBQyxHQUFHLEVBQUUsV0FBVyxFQUFDLEdBQUcsaUNBQVcsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDOUQsc0NBQXNDO0lBQ3RDLElBQUksU0FBUyxDQUFDLFNBQVMsS0FBSyxLQUFLLEVBQUU7UUFDakMsWUFBWSxDQUFDLFFBQVEsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuRCxZQUFZLENBQUMsVUFBVSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGdCQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO0tBQ3hHO1NBQU0sSUFBSSxTQUFTLENBQUMsU0FBUyxLQUFLLEtBQUssRUFBRTtRQUN4QyxZQUFZLENBQUMsUUFBUSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2pFLG9EQUFvRDtRQUNwRCxzREFBc0Q7UUFDdEQsMkdBQTJHO0tBQzVHO0lBQ0MsdUNBQXVDO0lBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0RBQW9ELEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDbEYsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQXRCRCx3QkFzQkM7QUFFRCxTQUFTLGVBQWU7SUFDdEIsSUFBSSxHQUFHLEdBQUcsY0FBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3pCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztJQUNsQixPQUFPLElBQUksRUFBRTtRQUNYLE1BQU0sT0FBTyxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JFLElBQUksWUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUMxQixPQUFPLEdBQUcsQ0FBQztTQUNaO1FBQ0QsTUFBTSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsSUFBSSxNQUFNLEtBQUssR0FBRyxJQUFJLE1BQU0sSUFBSSxJQUFJO1lBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUNqRCxHQUFHLEdBQUcsTUFBTSxDQUFDO0tBQ2Q7QUFDSCxDQUFDIiwiZmlsZSI6Im5vZGVfbW9kdWxlcy9AYmsvY3JhLXNjcmlwdHMvZGlzdC9jcmEtc2NyaXB0cy1wYXRocy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Z2V0Q21kT3B0aW9uc30gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge2ZpbmRQYWNrYWdlfSBmcm9tICcuL2J1aWxkLXRhcmdldC1oZWxwZXInO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuZXhwb3J0IGludGVyZmFjZSBDcmFTY3JpcHRzUGF0aHMge1xuICBkb3RlbnY6IHN0cmluZztcbiAgYXBwUGF0aDogc3RyaW5nO1xuICBhcHBCdWlsZDogc3RyaW5nO1xuICBhcHBQdWJsaWM6IHN0cmluZztcbiAgYXBwSHRtbDogc3RyaW5nO1xuICBhcHBJbmRleEpzOiBzdHJpbmc7XG4gIGFwcFBhY2thZ2VKc29uOiBzdHJpbmc7XG4gIGFwcFNyYzogc3RyaW5nO1xuICBhcHBUc0NvbmZpZzogc3RyaW5nO1xuICBhcHBKc0NvbmZpZzogc3RyaW5nO1xuICB5YXJuTG9ja0ZpbGU6IHN0cmluZztcbiAgdGVzdHNTZXR1cDogc3RyaW5nO1xuICBwcm94eVNldHVwOiBzdHJpbmc7XG4gIGFwcE5vZGVNb2R1bGVzOiBzdHJpbmc7XG4gIHB1YmxpY1VybE9yUGF0aDogc3RyaW5nO1xuICAvLyBUaGVzZSBwcm9wZXJ0aWVzIG9ubHkgZXhpc3QgYmVmb3JlIGVqZWN0aW5nOlxuICBvd25QYXRoOiBzdHJpbmc7XG4gIG93bk5vZGVNb2R1bGVzOiBzdHJpbmc7IC8vIFRoaXMgaXMgZW1wdHkgb24gbnBtIDNcbiAgYXBwVHlwZURlY2xhcmF0aW9uczogc3RyaW5nO1xuICBvd25UeXBlRGVjbGFyYXRpb25zOiBzdHJpbmc7XG59XG5cbmNvbnN0IGRyY3BXb3JrZGlyID0gZmluZERyY3BXb3JrZGlyKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhdGhzKCkge1xuICBjb25zdCBjbWRQdWJsaWNVcmwgPSBnZXRDbWRPcHRpb25zKCkuYXJndi5nZXQoJ3B1YmxpY1VybCcpIHx8IGdldENtZE9wdGlvbnMoKS5hcmd2LmdldCgncHVibGljLXVybCcpO1xuICBpZiAoY21kUHVibGljVXJsKSB7XG4gICAgcHJvY2Vzcy5lbnYuUFVCTElDX1VSTCA9IGNtZFB1YmxpY1VybCArICcnO1xuICB9XG4gIGNvbnN0IHBhdGhzOiBDcmFTY3JpcHRzUGF0aHMgPSByZXF1aXJlKFBhdGgucmVzb2x2ZSgnbm9kZV9tb2R1bGVzL3JlYWN0LXNjcmlwdHMvY29uZmlnL3BhdGhzJykpO1xuICBjb25zdCBjaGFuZ2VkUGF0aHMgPSBwYXRocztcbiAgY29uc3QgY21kT3B0aW9uID0gZ2V0Q21kT3B0aW9ucygpO1xuICBjb25zdCB7ZGlyLCBwYWNrYWdlSnNvbn0gPSBmaW5kUGFja2FnZShjbWRPcHRpb24uYnVpbGRUYXJnZXQpO1xuICAvLyBjb25zb2xlLmxvZygnW2RlYnVnXSAnLCBjbWRPcHRpb24pO1xuICBpZiAoY21kT3B0aW9uLmJ1aWxkVHlwZSA9PT0gJ2xpYicpIHtcbiAgICBjaGFuZ2VkUGF0aHMuYXBwQnVpbGQgPSBQYXRoLnJlc29sdmUoZGlyLCAnYnVpbGQnKTtcbiAgICBjaGFuZ2VkUGF0aHMuYXBwSW5kZXhKcyA9IFBhdGgucmVzb2x2ZShkaXIsIF8uZ2V0KHBhY2thZ2VKc29uLCAnZHIuY3JhLWJ1aWxkLWVudHJ5JywgJ3B1YmxpY19hcGkudHMnKSk7XG4gIH0gZWxzZSBpZiAoY21kT3B0aW9uLmJ1aWxkVHlwZSA9PT0gJ2FwcCcpIHtcbiAgICBjaGFuZ2VkUGF0aHMuYXBwQnVpbGQgPSBQYXRoLnJlc29sdmUoZHJjcFdvcmtkaXIsICdkaXN0L3N0YXRpYycpO1xuICAgIC8vIGNvbnN0IHtkaXJ9ID0gZmluZFBhY2thZ2UoY21kT3B0aW9uLmJ1aWxkVGFyZ2V0KTtcbiAgICAvLyBjaGFuZ2VkUGF0aHMuYXBwQnVpbGQgPSBQYXRoLnJlc29sdmUoZGlyLCAnYnVpbGQnKTtcbiAgICAvLyBjaGFuZ2VkUGF0aHMuYXBwSW5kZXhKcyA9IFBhdGgucmVzb2x2ZShkaXIsIF8uZ2V0KHBhY2thZ2VKc29uLCAnZHIuY3JhLXNlcnZlLWVudHJ5JywgJ3NlcnZlX2luZGV4LnRzJykpO1xuICB9XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coJ1tjcmEtc2NyaXB0cy1wYXRoc10gY2hhbmdlZCByZWFjdC1zY3JpcHRzIHBhdGhzOlxcbicsIGNoYW5nZWRQYXRocyk7XG4gIHJldHVybiBjaGFuZ2VkUGF0aHM7XG59XG5cbmZ1bmN0aW9uIGZpbmREcmNwV29ya2RpcigpIHtcbiAgbGV0IGRpciA9IFBhdGgucmVzb2x2ZSgpO1xuICBsZXQgcGFyZW50ID0gbnVsbDtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCB0ZXN0RGlyID0gUGF0aC5yZXNvbHZlKGRpciwgJ25vZGVfbW9kdWxlcycsICdkci1jb21wLXBhY2thZ2UnKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyh0ZXN0RGlyKSkge1xuICAgICAgcmV0dXJuIGRpcjtcbiAgICB9XG4gICAgcGFyZW50ID0gUGF0aC5kaXJuYW1lKGRpcik7XG4gICAgaWYgKHBhcmVudCA9PT0gZGlyIHx8IHBhcmVudCA9PSBudWxsKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gbm90IGZpbmQgRFJDUCB3b3Jrc3BhY2UnKTtcbiAgICBkaXIgPSBwYXJlbnQ7XG4gIH1cbn1cblxuIl19
