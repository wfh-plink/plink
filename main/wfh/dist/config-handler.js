"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.setTsCompilerOptForNodePath = exports.ConfigHandlerMgr = void 0;
/* tslint:disable no-console */
const Path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const lodash_1 = __importDefault(require("lodash"));
const { parse } = require('comment-json');
const { cyan, green } = chalk_1.default;
const ts_node_1 = require("ts-node");
const misc_1 = require("./utils/misc");
// import {registerExtension, jsonToCompilerOptions} from './ts-compiler';
const fs_1 = __importDefault(require("fs"));
class ConfigHandlerMgr {
    constructor(files) {
        this.configHandlers = ConfigHandlerMgr.initConfigHandlers(files, misc_1.getRootDir());
    }
    static initConfigHandlers(files, rootPath) {
        const exporteds = [];
        if (!ConfigHandlerMgr._tsNodeRegistered) {
            ConfigHandlerMgr._tsNodeRegistered = true;
            const internalTscfgFile = Path.resolve(__dirname, '../tsconfig-base.json');
            const { compilerOptions } = parse(fs_1.default.readFileSync(internalTscfgFile, 'utf8'));
            setTsCompilerOptForNodePath(process.cwd(), './', compilerOptions);
            compilerOptions.module = 'commonjs';
            compilerOptions.noUnusedLocals = false;
            compilerOptions.diagnostics = true;
            compilerOptions.declaration = false;
            delete compilerOptions.rootDir;
            // console.log(compilerOptions);
            ts_node_1.register({
                typeCheck: true,
                compilerOptions,
                compiler: require.resolve('typescript'),
                /**
                 * Important!! prevent ts-node looking for tsconfig.json from current working directory
                 */
                skipProject: true,
                transformers: {
                    after: [
                        context => (src) => {
                            console.log('ts-node compiles:', src.fileName);
                            // console.log(src.text);
                            return src;
                        }
                    ]
                }
            });
        }
        files.forEach(file => {
            const exp = require(Path.resolve(file));
            exporteds.push({ file, handler: exp.default ? exp.default : exp });
        });
        return exporteds;
    }
    /**
       *
       * @param func parameters: (filePath, last returned result, handler function),
       * returns the changed result, keep the last result, if resturns undefined
       * @returns last result
       */
    runEach(func) {
        return __awaiter(this, void 0, void 0, function* () {
            let lastRes;
            for (const { file, handler } of this.configHandlers) {
                console.log(green(Path.basename(__filename, '.js') + ' - ') + ' run', cyan(file));
                const currRes = yield func(file, lastRes, handler);
                if (currRes !== undefined)
                    lastRes = currRes;
            }
            return lastRes;
        });
    }
    runEachSync(func) {
        let lastRes;
        for (const { file, handler } of this.configHandlers) {
            console.log(green(Path.basename(__filename, '.js') + ' - ') + ' run', cyan(file));
            const currRes = func(file, lastRes, handler);
            if (currRes !== undefined)
                lastRes = currRes;
        }
        return lastRes;
    }
}
exports.ConfigHandlerMgr = ConfigHandlerMgr;
ConfigHandlerMgr._tsNodeRegistered = false;
/**
 * Set "baseUrl", "paths" and "typeRoots" property based on Root path, process.cwd()
 * and process.env.NODE_PATHS
 * @param tsconfigDir project directory where tsconfig file is (virtual), "typeRoots" is relative to this parameter
 * @param baseUrl compiler option "baseUrl", "paths" will be relative to this paremter
 * @param assigneeOptions
 */
function setTsCompilerOptForNodePath(tsconfigDir, baseUrl = './', assigneeOptions, opts = { enableTypeRoots: false }) {
    let pathsDirs = [];
    // workspace node_modules should be the first
    if (opts.workspaceDir != null) {
        pathsDirs.push(Path.resolve(opts.workspaceDir, 'node_modules'));
    }
    if (opts.extraNodePath && opts.extraNodePath.length > 0) {
        pathsDirs.push(...opts.extraNodePath);
    }
    if (process.env.NODE_PATH) {
        pathsDirs.push(...process.env.NODE_PATH.split(Path.delimiter));
    }
    // console.log('temp..............', pathsDirs);
    // console.log('extraNodePath', opts.extraNodePath);
    pathsDirs = lodash_1.default.uniq(pathsDirs);
    if (opts.noSymlinks) {
        const { symlinkDir } = JSON.parse(process.env.__plink);
        const idx = pathsDirs.indexOf(symlinkDir);
        if (idx >= 0) {
            pathsDirs.splice(idx, 1);
        }
    }
    if (Path.isAbsolute(baseUrl)) {
        let relBaseUrl = Path.relative(tsconfigDir, baseUrl);
        if (!relBaseUrl.startsWith('.'))
            relBaseUrl = './' + relBaseUrl;
        baseUrl = relBaseUrl;
    }
    // console.log('+++++++++', pathsDirs, opts.extraNodePath);
    assigneeOptions.baseUrl = baseUrl.replace(/\\/g, '/');
    if (assigneeOptions.paths == null)
        assigneeOptions.paths = { '*': [] };
    else
        assigneeOptions.paths['*'] = [];
    // console.log('pathsDirs', pathsDirs);
    for (const dir of pathsDirs) {
        const relativeDir = Path.relative(Path.resolve(tsconfigDir, baseUrl), dir).replace(/\\/g, '/');
        // IMPORTANT: `@type/*` must be prio to `/*`, for those packages have no type definintion
        assigneeOptions.paths['*'].push(relativeDir + '/@types/*');
        assigneeOptions.paths['*'].push(relativeDir + '/*');
    }
    assigneeOptions.typeRoots = [
        Path.relative(tsconfigDir, Path.resolve(__dirname, '..', 'types')).replace(/\\/g, '/')
    ];
    if (opts.workspaceDir != null) {
        assigneeOptions.typeRoots.push(Path.relative(tsconfigDir, Path.resolve(opts.workspaceDir, 'types')).replace(/\\/g, '/'));
    }
    if (opts.enableTypeRoots) {
        assigneeOptions.typeRoots.push(...pathsDirs.map(dir => {
            const relativeDir = Path.relative(tsconfigDir, dir).replace(/\\/g, '/');
            return relativeDir + '/@types';
        }));
    }
    if (opts.extraTypeRoot) {
        assigneeOptions.typeRoots.push(...opts.extraTypeRoot.map(dir => Path.relative(tsconfigDir, dir).replace(/\\/g, '/')));
    }
    return assigneeOptions;
}
exports.setTsCompilerOptForNodePath = setTsCompilerOptForNodePath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLWhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9jb25maWctaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQStCO0FBQy9CLDJDQUE2QjtBQUM3QixrREFBMEI7QUFDMUIsb0RBQXVCO0FBQ3ZCLE1BQU0sRUFBQyxLQUFLLEVBQUMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDeEMsTUFBTSxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUMsR0FBRyxlQUFLLENBQUM7QUFDNUIscUNBQW1EO0FBR25ELHVDQUF3QztBQUN4QywwRUFBMEU7QUFDMUUsNENBQW9CO0FBMERwQixNQUFhLGdCQUFnQjtJQWtEM0IsWUFBWSxLQUFlO1FBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGlCQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFqRE8sTUFBTSxDQUFDLGtCQUFrQixDQUFDLEtBQWUsRUFBRSxRQUFnQjtRQUNqRSxNQUFNLFNBQVMsR0FBa0QsRUFBRSxDQUFDO1FBRXBFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsRUFBRTtZQUN2QyxnQkFBZ0IsQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFFMUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxLQUFLLENBQzdCLFlBQUUsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLENBQzNDLENBQUM7WUFFRiwyQkFBMkIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBRWxFLGVBQWUsQ0FBQyxNQUFNLEdB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QUksRUFBRTtRQUM3QixlQUFlLENBQUMsU0FBUyxDQUFDLElBQUksQ0FDNUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQzdGO0lBQ0QsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFHO1FBQ3pCLGVBQWUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNwRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3hFLE9BQU8sV0FBVyxHQUFHLFNBQVMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ0w7SUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7UUFDdEIsZUFBZSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDdEQsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNoRTtJQUVELE9BQU8sZUFBa0MsQ0FBQztBQUM1QyxDQUFDO0FBeEVELGtFQXdFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlIG5vLWNvbnNvbGUgKi9cbmltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmNvbnN0IHtwYXJzZX0gPSByZXF1aXJlKCdjb21tZW50LWpzb24nKTtcbmNvbnN0IHtjeWFuLCBncmVlbn0gPSBjaGFsaztcbmltcG9ydCB7cmVnaXN0ZXIgYXMgcmVnaXN0ZXJUc05vZGV9IGZyb20gJ3RzLW5vZGUnO1xuaW1wb3J0IHtHbG9iYWxPcHRpb25zIGFzIENsaU9wdGlvbnN9IGZyb20gJy4vY21kL3R5cGVzJztcbmltcG9ydCB7UGxpbmtFbnZ9IGZyb20gJy4vbm9kZS1wYXRoJztcbmltcG9ydCB7Z2V0Um9vdERpcn0gZnJvbSAnLi91dGlscy9taXNjJztcbi8vIGltcG9ydCB7cmVnaXN0ZXJFeHRlbnNpb24sIGpzb25Ub0NvbXBpbGVyT3B0aW9uc30gZnJvbSAnLi90cy1jb21waWxlcic7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEJhc2VEcmNwU2V0dGluZyB7XG4gIHBvcnQ6IG51bWJlciB8IHN0cmluZztcbiAgcHVibGljUGF0aDogc3RyaW5nO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIHBhY2thZ2UtbWdyL2luZGV4I2dldFByb2plY3RMaXN0KCkgaW5zdGVhZCAqL1xuICBwcm9qZWN0TGlzdDogdW5kZWZpbmVkO1xuICBsb2NhbElQOiBzdHJpbmc7XG4gIGRldk1vZGU6IGJvb2xlYW47XG4gIGRlc3REaXI6IHN0cmluZztcbiAgc3RhdGljRGlyOiBzdHJpbmc7XG4gIHJlY2lwZUZvbGRlcj86IHN0cmluZztcbiAgcm9vdFBhdGg6IHN0cmluZztcbiAgLy8gbG9nNGpzUmVsb2FkU2Vjb25kczogbnVtYmVyO1xuICBsb2dTdGF0OiBib29sZWFuO1xuICBwYWNrYWdlU2NvcGVzOiBzdHJpbmdbXTtcbiAgaW5zdGFsbGVkUmVjaXBlczogc3RyaW5nW107XG4gIHdmaFNyY1BhdGg6IHN0cmluZztcbn1cbmV4cG9ydCBpbnRlcmZhY2UgRHJjcFNldHRpbmdzIGV4dGVuZHMgQmFzZURyY3BTZXR0aW5nIHtcbiAgW3Byb3A6IHN0cmluZ106IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEcmNwQ29uZmlnIHtcbiAgZG9uZTogUHJvbWlzZTxEcmNwU2V0dGluZ3M+O1xuICBjb25maWdIYW5kbGVyTWdyKCk6IENvbmZpZ0hhbmRsZXJNZ3I7XG4gIGdldDxLIGV4dGVuZHMga2V5b2YgQmFzZURyY3BTZXR0aW5nPihwYXRoOiBLLCBkZWZhdWx0VmFsdWU/OiBCYXNlRHJjcFNldHRpbmdbS10pOiBCYXNlRHJjcFNldHRpbmdbS107XG4gIGdldChwYXRoOiBzdHJpbmd8c3RyaW5nW10sIGRlZmF1bHRWYWx1ZT86IGFueSk6IGFueTtcbiAgc2V0PEsgZXh0ZW5kcyBrZXlvZiBCYXNlRHJjcFNldHRpbmc+KHBhdGg6IEssIHZhbHVlOiBCYXNlRHJjcFNldHRpbmdbS10gfCBhbnkpOiB2b2lkO1xuICBzZXQocGF0aDogc3RyaW5nfHN0cmluZ1tdLCB2YWx1ZTogYW55KTogdm9pZDtcbiAgLyoqXG4gICAqIFJlc29sdmUgYSBwYXRoIGJhc2VkIG9uIGByb290UGF0aGBcbiAgICogQG5hbWUgcmVzb2x2ZVxuICAgKiBAbWVtYmVyb2YgY29uZmlnXG4gICAqIEBwYXJhbSAge3N0cmluZ30gcHJvcGVydHkgbmFtZSBvciBwcm9wZXJ0eSBwYXRoLCBsaWtlIFwibmFtZVwiLCBcIm5hbWUuY2hpbGRQcm9wWzFdXCJcbiAgICogQHJldHVybiB7c3RyaW5nfSAgICAgYWJzb2x1dGUgcGF0aFxuICAgKi9cbiAgcmVzb2x2ZShkaXI6ICdkZXN0RGlyJ3wnc3RhdGljRGlyJ3wnc2VydmVyRGlyJywgLi4ucGF0aDogc3RyaW5nW10pOiBzdHJpbmc7XG4gIHJlc29sdmUoLi4ucGF0aDogc3RyaW5nW10pOiBzdHJpbmc7XG4gICgpOiBEcmNwU2V0dGluZ3M7XG4gIGxvYWQoKTogUHJvbWlzZTxEcmNwU2V0dGluZ3M+O1xuICByZWxvYWQoKTogUHJvbWlzZTxEcmNwU2V0dGluZ3M+O1xuICBsb2FkU3luYygpOiBEcmNwU2V0dGluZ3M7XG4gIGluaXQoYXJndjogQ2xpT3B0aW9ucyk6IFByb21pc2U8RHJjcFNldHRpbmdzPjtcbiAgaW5pdFN5bmMoYXJndjogQ2xpT3B0aW9ucyk6IERyY3BTZXR0aW5ncztcbiAgd2ZoU3JjUGF0aCgpOiBzdHJpbmcgfCBmYWxzZTtcbiAgc2V0RGVmYXVsdChwcm9wUGF0aDogc3RyaW5nLCB2YWx1ZTogYW55KTogRHJjcFNldHRpbmdzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZ0hhbmRsZXIge1xuICAvKipcblx0ICogXG5cdCAqIEBwYXJhbSBjb25maWdTZXR0aW5nIE92ZXJyaWRlIHByb3BlcnRpZXMgZnJvbSBkaXN0L2NvbmZpZy55YW1sLCB3aGljaCBpcyBhbHNvIHlvdSBnZXQgZnJvbSBgYXBpLmNvbmZpZygpYFxuXHQgKiBAcGFyYW0gZHJjcENsaUFyZ3YgKGRlcHJlY2F0ZWQpIE92ZXJyaWRlIGNvbW1hbmQgbGluZSBhcmd1bWVtbnQgZm9yIERSQ1Bcblx0ICovXG4gIG9uQ29uZmlnKGNvbmZpZ1NldHRpbmc6IERyY3BTZXR0aW5ncywgZHJjcENsaUFyZ3Y/OiB7W3Byb3A6IHN0cmluZ106IGFueX0pOiBQcm9taXNlPHZvaWQ+IHwgdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIENvbmZpZ0hhbmRsZXJNZ3Ige1xuICBwcml2YXRlIHN0YXRpYyBfdHNOb2RlUmVnaXN0ZXJlZCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgc3RhdGljIGluaXRDb25maWdIYW5kbGVycyhmaWxlczogc3RyaW5nW10sIHJvb3RQYXRoOiBzdHJpbmcpOiBBcnJheTx7ZmlsZTogc3RyaW5nLCBoYW5kbGVyOiBDb25maWdIYW5kbGVyfT4ge1xuICAgIGNvbnN0IGV4cG9ydGVkczogQXJyYXk8e2ZpbGU6IHN0cmluZywgaGFuZGxlcjogQ29uZmlnSGFuZGxlcn0+ID0gW107XG5cbiAgICBpZiAoIUNvbmZpZ0hhbmRsZXJNZ3IuX3RzTm9kZVJlZ2lzdGVyZWQpIHtcbiAgICAgIENvbmZpZ0hhbmRsZXJNZ3IuX3RzTm9kZVJlZ2lzdGVyZWQgPSB0cnVlO1xuXG4gICAgICBjb25zdCBpbnRlcm5hbFRzY2ZnRmlsZSA9IFBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi90c2NvbmZpZy1iYXNlLmpzb24nKTtcbiAgICAgIGNvbnN0IHtjb21waWxlck9wdGlvbnN9ID0gcGFyc2UoXG4gICAgICAgIGZzLnJlYWRGaWxlU3luYyhpbnRlcm5hbFRzY2ZnRmlsZSwgJ3V0ZjgnKVxuICAgICAgKTtcblxuICAgICAgc2V0VHNDb21waWxlck9wdEZvck5vZGVQYXRoKHByb2Nlc3MuY3dkKCksICcuLycsIGNvbXBpbGVyT3B0aW9ucyk7XG5cbiAgICAgIGNvbXBpbGVyT3B0aW9ucy5tb2R1bGUgPSAnY29tbW9uanMnO1xuICAgICAgY29tcGlsZXJPcHRpb25zLm5vVW51c2VkTG9jYWxzID0gZmFsc2U7XG4gICAgICBjb21waWxlck9wdGlvbnMuZGlhZ25vc3RpY3MgPSB0cnVlO1xuICAgICAgY29tcGlsZXJPcHRpb25zLmRlY2xhcmF0aW9uID0gZmFsc2U7XG4gICAgICBkZWxldGUgY29tcGlsZXJPcHRpb25zLnJvb3REaXI7XG5cbiAgICAgIC8vIGNvbnNvbGUubG9nKGNvbXBpbGVyT3B0aW9ucyk7XG4gICAgICByZWdpc3RlclRzTm9kZSh7XG4gICAgICAgIHR5cGVDaGVjazogdHJ1ZSxcbiAgICAgICAgY29tcGlsZXJPcHRpb25zLFxuICAgICAgICBjb21waWxlcjogcmVxdWlyZS5yZXNvbHZlKCd0eXBlc2NyaXB0JyksXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbXBvcnRhbnQhISBwcmV2ZW50IHRzLW5vZGUgbG9va2luZyBmb3IgdHNjb25maWcuanNvbiBmcm9tIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnlcbiAgICAgICAgICovXG4gICAgICAgIHNraXBQcm9qZWN0OiB0cnVlXG4gICAgICAgICx0cmFuc2Zvcm1lcnM6IHtcbiAgICAgICAgICBhZnRlcjogW1xuICAgICAgICAgICAgY29udGV4dCA9PiAoc3JjKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0cy1ub2RlIGNvbXBpbGVzOicsIHNyYy5maWxlTmFtZSk7XG4gICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHNyYy50ZXh0KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHNyYztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBmaWxlcy5mb3JFYWNoKGZpbGUgPT4ge1xuICAgICAgY29uc3QgZXhwID0gcmVxdWlyZShQYXRoLnJlc29sdmUoZmlsZSkpO1xuICAgICAgZXhwb3J0ZWRzLnB1c2goe2ZpbGUsIGhhbmRsZXI6IGV4cC5kZWZhdWx0ID8gZXhwLmRlZmF1bHQgOiBleHB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gZXhwb3J0ZWRzO1xuICB9XG4gIHByb3RlY3RlZCBjb25maWdIYW5kbGVyczogQXJyYXk8e2ZpbGU6IHN0cmluZywgaGFuZGxlcjogQ29uZmlnSGFuZGxlcn0+O1xuXG4gIGNvbnN0cnVjdG9yKGZpbGVzOiBzdHJpbmdbXSkge1xuICAgIHRoaXMuY29uZmlnSGFuZGxlcnMgPSBDb25maWdIYW5kbGVyTWdyLmluaXRDb25maWdIYW5kbGVycyhmaWxlcywgZ2V0Um9vdERpcigpKTtcbiAgfVxuXG4gIC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIGZ1bmMgcGFyYW1ldGVyczogKGZpbGVQYXRoLCBsYXN0IHJldHVybmVkIHJlc3VsdCwgaGFuZGxlciBmdW5jdGlvbiksXG5cdCAqIHJldHVybnMgdGhlIGNoYW5nZWQgcmVzdWx0LCBrZWVwIHRoZSBsYXN0IHJlc3VsdCwgaWYgcmVzdHVybnMgdW5kZWZpbmVkXG5cdCAqIEByZXR1cm5zIGxhc3QgcmVzdWx0XG5cdCAqL1xuICBhc3luYyBydW5FYWNoPEg+KGZ1bmM6IChmaWxlOiBzdHJpbmcsIGxhc3RSZXN1bHQ6IGFueSwgaGFuZGxlcjogSCkgPT4gUHJvbWlzZTxhbnk+IHwgYW55KSB7XG4gICAgbGV0IGxhc3RSZXM6IGFueTtcbiAgICBmb3IgKGNvbnN0IHtmaWxlLCBoYW5kbGVyfSBvZiB0aGlzLmNvbmZpZ0hhbmRsZXJzKSB7XG4gICAgICBjb25zb2xlLmxvZyhncmVlbihQYXRoLmJhc2VuYW1lKF9fZmlsZW5hbWUsICcuanMnKSArICcgLSAnKSArICcgcnVuJywgY3lhbihmaWxlKSk7XG4gICAgICBjb25zdCBjdXJyUmVzID0gYXdhaXQgZnVuYyhmaWxlLCBsYXN0UmVzLCBoYW5kbGVyIGFzIGFueSBhcyBIKTtcbiAgICAgIGlmIChjdXJyUmVzICE9PSB1bmRlZmluZWQpXG4gICAgICAgIGxhc3RSZXMgPSBjdXJyUmVzO1xuICAgIH1cbiAgICByZXR1cm4gbGFzdFJlcztcbiAgfVxuXG4gIHJ1bkVhY2hTeW5jPEg+KGZ1bmM6IChmaWxlOiBzdHJpbmcsIGxhc3RSZXN1bHQ6IGFueSwgaGFuZGxlcjogSCkgPT4gUHJvbWlzZTxhbnk+IHwgYW55KSB7XG4gICAgbGV0IGxhc3RSZXM6IGFueTtcbiAgICBmb3IgKGNvbnN0IHtmaWxlLCBoYW5kbGVyfSBvZiB0aGlzLmNvbmZpZ0hhbmRsZXJzKSB7XG4gICAgICBjb25zb2xlLmxvZyhncmVlbihQYXRoLmJhc2VuYW1lKF9fZmlsZW5hbWUsICcuanMnKSArICcgLSAnKSArICcgcnVuJywgY3lhbihmaWxlKSk7XG4gICAgICBjb25zdCBjdXJyUmVzID0gZnVuYyhmaWxlLCBsYXN0UmVzLCBoYW5kbGVyIGFzIGFueSBhcyBIKTtcbiAgICAgIGlmIChjdXJyUmVzICE9PSB1bmRlZmluZWQpXG4gICAgICAgIGxhc3RSZXMgPSBjdXJyUmVzO1xuICAgIH1cbiAgICByZXR1cm4gbGFzdFJlcztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBpbGVyT3B0aW9uU2V0T3B0IHtcbiAgLyoqIFdpbGwgYWRkIHR5cGVSb290cyBwcm9wZXJ0eSBmb3Igc3BlY2lmaWMgd29ya3NwYWNlICovXG4gIHdvcmtzcGFjZURpcj86IHN0cmluZztcbiAgZW5hYmxlVHlwZVJvb3RzPzogYm9vbGVhbjtcbiAgLyoqIERlZmF1bHQgZmFsc2UsIERvIG5vdCBpbmNsdWRlIGxpbmtlZCBwYWNrYWdlIHN5bWxpbmtzIGRpcmVjdG9yeSBpbiBwYXRoKi9cbiAgbm9TeW1saW5rcz86IGJvb2xlYW47XG4gIGV4dHJhTm9kZVBhdGg/OiBzdHJpbmdbXTtcbiAgZXh0cmFUeXBlUm9vdD86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBpbGVyT3B0aW9ucyB7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgdHlwZVJvb3RzOiBzdHJpbmdbXTtcbiAgcGF0aHM6IHtbcGF0aDogc3RyaW5nXTogc3RyaW5nW119O1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG4vKipcbiAqIFNldCBcImJhc2VVcmxcIiwgXCJwYXRoc1wiIGFuZCBcInR5cGVSb290c1wiIHByb3BlcnR5IGJhc2VkIG9uIFJvb3QgcGF0aCwgcHJvY2Vzcy5jd2QoKVxuICogYW5kIHByb2Nlc3MuZW52Lk5PREVfUEFUSFNcbiAqIEBwYXJhbSB0c2NvbmZpZ0RpciBwcm9qZWN0IGRpcmVjdG9yeSB3aGVyZSB0c2NvbmZpZyBmaWxlIGlzICh2aXJ0dWFsKSwgXCJ0eXBlUm9vdHNcIiBpcyByZWxhdGl2ZSB0byB0aGlzIHBhcmFtZXRlclxuICogQHBhcmFtIGJhc2VVcmwgY29tcGlsZXIgb3B0aW9uIFwiYmFzZVVybFwiLCBcInBhdGhzXCIgd2lsbCBiZSByZWxhdGl2ZSB0byB0aGlzIHBhcmVtdGVyXG4gKiBAcGFyYW0gYXNzaWduZWVPcHRpb25zIFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0VHNDb21waWxlck9wdEZvck5vZGVQYXRoKFxuICB0c2NvbmZpZ0Rpcjogc3RyaW5nLFxuICBiYXNlVXJsID0gJy4vJyxcbiAgYXNzaWduZWVPcHRpb25zOiBQYXJ0aWFsPENvbXBpbGVyT3B0aW9ucz4sXG4gIG9wdHM6IENvbXBpbGVyT3B0aW9uU2V0T3B0ID0ge2VuYWJsZVR5cGVSb290czogZmFsc2V9KSB7XG5cbiAgbGV0IHBhdGhzRGlyczogc3RyaW5nW10gPSBbXTtcbiAgLy8gd29ya3NwYWNlIG5vZGVfbW9kdWxlcyBzaG91bGQgYmUgdGhlIGZpcnN0XG4gIGlmIChvcHRzLndvcmtzcGFjZURpciAhPSBudWxsKSB7XG4gICAgcGF0aHNEaXJzLnB1c2goUGF0aC5yZXNvbHZlKG9wdHMud29ya3NwYWNlRGlyLCAnbm9kZV9tb2R1bGVzJykpO1xuICB9XG4gIGlmIChvcHRzLmV4dHJhTm9kZVBhdGggJiYgb3B0cy5leHRyYU5vZGVQYXRoLmxlbmd0aCA+IDApIHtcbiAgICBwYXRoc0RpcnMucHVzaCguLi5vcHRzLmV4dHJhTm9kZVBhdGgpO1xuICB9XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX1BBVEgpIHtcbiAgICBwYXRoc0RpcnMucHVzaCguLi5wcm9jZXNzLmVudi5OT0RFX1BBVEguc3BsaXQoUGF0aC5kZWxpbWl0ZXIpKTtcbiAgfVxuXG4gIC8vIGNvbnNvbGUubG9nKCd0ZW1wLi4uLi4uLi4uLi4uLi4nLCBwYXRoc0RpcnMpO1xuICAvLyBjb25zb2xlLmxvZygnZXh0cmFOb2RlUGF0aCcsIG9wdHMuZXh0cmFOb2RlUGF0aCk7XG5cbiAgcGF0aHNEaXJzID0gXy51bmlxKHBhdGhzRGlycyk7XG5cbiAgaWYgKG9wdHMubm9TeW1saW5rcykge1xuICAgIGNvbnN0IHtzeW1saW5rRGlyfSA9IEpTT04ucGFyc2UocHJvY2Vzcy5lbnYuX19wbGluayEpIGFzIFBsaW5rRW52O1xuICAgIGNvbnN0IGlkeCA9IHBhdGhzRGlycy5pbmRleE9mKHN5bWxpbmtEaXIpO1xuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgcGF0aHNEaXJzLnNwbGljZShpZHgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChQYXRoLmlzQWJzb2x1dGUoYmFzZVVybCkpIHtcbiAgICBsZXQgcmVsQmFzZVVybCA9IFBhdGgucmVsYXRpdmUodHNjb25maWdEaXIsIGJhc2VVcmwpO1xuICAgIGlmICghcmVsQmFzZVVybC5zdGFydHNXaXRoKCcuJykpXG4gICAgICByZWxCYXNlVXJsID0gJy4vJyArIHJlbEJhc2VVcmw7XG4gICAgYmFzZVVybCA9IHJlbEJhc2VVcmw7XG4gIH1cbiAgLy8gY29uc29sZS5sb2coJysrKysrKysrKycsIHBhdGhzRGlycywgb3B0cy5leHRyYU5vZGVQYXRoKTtcbiAgYXNzaWduZWVPcHRpb25zLmJhc2VVcmwgPSBiYXNlVXJsLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgaWYgKGFzc2lnbmVlT3B0aW9ucy5wYXRocyA9PSBudWxsKVxuICAgIGFzc2lnbmVlT3B0aW9ucy5wYXRocyA9IHsnKic6IFtdfTtcbiAgZWxzZVxuICAgIGFzc2lnbmVlT3B0aW9ucy5wYXRoc1snKiddID0gW107XG5cbiAgLy8gY29uc29sZS5sb2coJ3BhdGhzRGlycycsIHBhdGhzRGlycyk7XG4gIGZvciAoY29uc3QgZGlyIG9mIHBhdGhzRGlycykge1xuICAgIGNvbnN0IHJlbGF0aXZlRGlyID0gUGF0aC5yZWxhdGl2ZShQYXRoLnJlc29sdmUodHNjb25maWdEaXIsIGJhc2VVcmwpLCBkaXIpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAvLyBJTVBPUlRBTlQ6IGBAdHlwZS8qYCBtdXN0IGJlIHByaW8gdG8gYC8qYCwgZm9yIHRob3NlIHBhY2thZ2VzIGhhdmUgbm8gdHlwZSBkZWZpbmludGlvblxuICAgIGFzc2lnbmVlT3B0aW9ucy5wYXRoc1snKiddLnB1c2gocmVsYXRpdmVEaXIgKyAnL0B0eXBlcy8qJyk7XG4gICAgYXNzaWduZWVPcHRpb25zLnBhdGhzWycqJ10ucHVzaChyZWxhdGl2ZURpciArICcvKicpO1xuICB9XG5cbiAgYXNzaWduZWVPcHRpb25zLnR5cGVSb290cyA9IFtcbiAgICBQYXRoLnJlbGF0aXZlKHRzY29uZmlnRGlyLCBQYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAndHlwZXMnKSkucmVwbGFjZSgvXFxcXC9nLCAnLycpXG4gIF07XG4gIGlmIChvcHRzLndvcmtzcGFjZURpciAhPSBudWxsKSB7XG4gICAgYXNzaWduZWVPcHRpb25zLnR5cGVSb290cy5wdXNoKFxuICAgICAgUGF0aC5yZWxhdGl2ZSh0c2NvbmZpZ0RpciwgUGF0aC5yZXNvbHZlKG9wdHMud29ya3NwYWNlRGlyLCAndHlwZXMnKSkucmVwbGFjZSgvXFxcXC9nLCAnLycpKTtcbiAgfVxuICBpZiAob3B0cy5lbmFibGVUeXBlUm9vdHMgKSB7XG4gICAgYXNzaWduZWVPcHRpb25zLnR5cGVSb290cy5wdXNoKC4uLnBhdGhzRGlycy5tYXAoZGlyID0+IHtcbiAgICAgIGNvbnN0IHJlbGF0aXZlRGlyID0gUGF0aC5yZWxhdGl2ZSh0c2NvbmZpZ0RpciwgZGlyKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICByZXR1cm4gcmVsYXRpdmVEaXIgKyAnL0B0eXBlcyc7XG4gICAgfSkpO1xuICB9XG5cbiAgaWYgKG9wdHMuZXh0cmFUeXBlUm9vdCkge1xuICAgIGFzc2lnbmVlT3B0aW9ucy50eXBlUm9vdHMucHVzaCguLi5vcHRzLmV4dHJhVHlwZVJvb3QubWFwKFxuICAgICAgZGlyID0+IFBhdGgucmVsYXRpdmUodHNjb25maWdEaXIsIGRpcikucmVwbGFjZSgvXFxcXC9nLCAnLycpKSk7XG4gIH1cblxuICByZXR1cm4gYXNzaWduZWVPcHRpb25zIGFzIENvbXBpbGVyT3B0aW9ucztcbn1cblxuIl19