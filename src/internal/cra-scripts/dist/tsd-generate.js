"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTsd = void 0;
const utils_1 = require("./utils");
const plink_1 = require("@wfh/plink");
const types_1 = require("./types");
const utils_2 = require("./utils");
const lodash_1 = __importDefault(require("lodash"));
function buildTsd(packages, overridePackgeDirs = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if (packages == null) {
            const opts = utils_1.getCmdOptions();
            packages = [opts.buildTarget];
        }
        const pkgs = [...plink_1.findPackagesByNames(packages)].map((pkg, i) => {
            if (pkg == null) {
                throw new Error(`Can not find package ${packages[i]}`);
            }
            return pkg;
        });
        const _overridePackgeDirs = Object.assign({}, overridePackgeDirs);
        for (const pkg of pkgs) {
            if (_overridePackgeDirs[pkg.name] == null) {
                _overridePackgeDirs[pkg.name] = {
                    destDir: 'build',
                    srcDir: '',
                    files: [lodash_1.default.get(pkg.json.plink ? pkg.json.plink : pkg.json.dr, types_1.PKG_LIB_ENTRY_PROP, types_1.PKG_LIB_ENTRY_DEFAULT)]
                };
            }
        }
        // const targetPackage = pkg.name;
        const workerData = {
            package: pkgs.map(pkg => pkg.name), ed: true, jsx: true, watch: utils_1.getCmdOptions().watch,
            pathsJsons: [],
            overridePackgeDirs: _overridePackgeDirs
        };
        const { tsc } = require('@wfh/plink/wfh/dist/ts-cmd');
        workerData.compilerOptions = utils_2.runTsConfigHandlers4LibTsd();
        yield tsc(workerData);
    });
}
exports.buildTsd = buildTsd;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHNkLWdlbmVyYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHNkLWdlbmVyYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQUF3QztBQUV4QyxzQ0FBK0M7QUFDL0MsbUNBQWtFO0FBQ2xFLG1DQUFtRDtBQUVuRCxvREFBdUI7QUFFdkIsU0FBc0IsUUFBUSxDQUFDLFFBQW1CLEVBQUUscUJBQXdELEVBQUU7O1FBRTVHLElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtZQUNwQixNQUFNLElBQUksR0FBRyxxQkFBYSxFQUFFLENBQUM7WUFDN0IsUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQy9CO1FBRUQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLDJCQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzdELElBQUksR0FBRyxJQUFJLElBQUksRUFBRTtnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixRQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ3pEO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sbUJBQW1CLHFCQUEwQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3ZGLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ3RCLElBQUksbUJBQW1CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtnQkFDekMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHO29CQUM5QixPQUFPLEVBQUUsT0FBTztvQkFDaEIsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsS0FBSyxFQUFFLENBQUMsZ0JBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSwwQkFBa0IsRUFBRSw2QkFBcUIsQ0FBQyxDQUFDO2lCQUN6RyxDQUFDO2FBQ0g7U0FDRjtRQUNELGtDQUFrQztRQUNsQyxNQUFNLFVBQVUsR0FBZ0I7WUFDOUIsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxxQkFBYSxFQUFFLENBQUMsS0FBSztZQUNyRixVQUFVLEVBQUUsRUFBRTtZQUNkLGtCQUFrQixFQUFFLG1CQUFtQjtTQUN4QyxDQUFDO1FBQ0YsTUFBTSxFQUFDLEdBQUcsRUFBQyxHQUFHLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBa0IsQ0FBQztRQUNyRSxVQUFVLENBQUMsZUFBZSxHQUFHLGtDQUEwQixFQUFFLENBQUM7UUFDMUQsTUFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDeEIsQ0FBQztDQUFBO0FBakNELDRCQWlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldENtZE9wdGlvbnMgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7VHNjQ21kUGFyYW19IGZyb20gJ0B3ZmgvcGxpbmsvd2ZoL2Rpc3QvdHMtY21kJztcbmltcG9ydCB7ZmluZFBhY2thZ2VzQnlOYW1lc30gZnJvbSAnQHdmaC9wbGluayc7XG5pbXBvcnQge1BLR19MSUJfRU5UUllfUFJPUCwgUEtHX0xJQl9FTlRSWV9ERUZBVUxUfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7cnVuVHNDb25maWdIYW5kbGVyczRMaWJUc2R9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0ICogYXMgX3RzY21kIGZyb20gJ0B3ZmgvcGxpbmsvd2ZoL2Rpc3QvdHMtY21kJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZFRzZChwYWNrYWdlcz86IHN0cmluZ1tdLCBvdmVycmlkZVBhY2tnZURpcnM6IFRzY0NtZFBhcmFtWydvdmVycmlkZVBhY2tnZURpcnMnXSA9IHt9KSB7XG5cbiAgaWYgKHBhY2thZ2VzID09IG51bGwpIHtcbiAgICBjb25zdCBvcHRzID0gZ2V0Q21kT3B0aW9ucygpO1xuICAgIHBhY2thZ2VzID0gW29wdHMuYnVpbGRUYXJnZXRdO1xuICB9XG5cbiAgY29uc3QgcGtncyA9IFsuLi5maW5kUGFja2FnZXNCeU5hbWVzKHBhY2thZ2VzKV0ubWFwKChwa2csIGkpID0+IHtcbiAgICBpZiAocGtnID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2FuIG5vdCBmaW5kIHBhY2thZ2UgJHtwYWNrYWdlcyFbaV19YCk7XG4gICAgfVxuICAgIHJldHVybiBwa2c7XG4gIH0pO1xuXG4gIGNvbnN0IF9vdmVycmlkZVBhY2tnZURpcnM6IFRzY0NtZFBhcmFtWydvdmVycmlkZVBhY2tnZURpcnMnXSA9IHsuLi5vdmVycmlkZVBhY2tnZURpcnN9O1xuICBmb3IgKGNvbnN0IHBrZyBvZiBwa2dzKSB7XG4gICAgaWYgKF9vdmVycmlkZVBhY2tnZURpcnNbcGtnLm5hbWVdID09IG51bGwpIHtcbiAgICAgIF9vdmVycmlkZVBhY2tnZURpcnNbcGtnLm5hbWVdID0ge1xuICAgICAgICBkZXN0RGlyOiAnYnVpbGQnLFxuICAgICAgICBzcmNEaXI6ICcnLFxuICAgICAgICBmaWxlczogW18uZ2V0KHBrZy5qc29uLnBsaW5rID8gcGtnLmpzb24ucGxpbmsgOiBwa2cuanNvbi5kciwgUEtHX0xJQl9FTlRSWV9QUk9QLCBQS0dfTElCX0VOVFJZX0RFRkFVTFQpXVxuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgLy8gY29uc3QgdGFyZ2V0UGFja2FnZSA9IHBrZy5uYW1lO1xuICBjb25zdCB3b3JrZXJEYXRhOiBUc2NDbWRQYXJhbSA9IHtcbiAgICBwYWNrYWdlOiBwa2dzLm1hcChwa2cgPT4gcGtnLm5hbWUpLCBlZDogdHJ1ZSwganN4OiB0cnVlLCB3YXRjaDogZ2V0Q21kT3B0aW9ucygpLndhdGNoLFxuICAgIHBhdGhzSnNvbnM6IFtdLFxuICAgIG92ZXJyaWRlUGFja2dlRGlyczogX292ZXJyaWRlUGFja2dlRGlyc1xuICB9O1xuICBjb25zdCB7dHNjfSA9IHJlcXVpcmUoJ0B3ZmgvcGxpbmsvd2ZoL2Rpc3QvdHMtY21kJykgYXMgdHlwZW9mIF90c2NtZDtcbiAgd29ya2VyRGF0YS5jb21waWxlck9wdGlvbnMgPSBydW5Uc0NvbmZpZ0hhbmRsZXJzNExpYlRzZCgpO1xuICBhd2FpdCB0c2Mod29ya2VyRGF0YSk7XG59XG4iXX0=