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
exports.forkFile = void 0;
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const misc_1 = require("./utils/misc");
const log4js_1 = __importDefault(require("log4js"));
const log = log4js_1.default.getLogger('plink.fork-for-preserver-symlink');
function forkFile(moduleName) {
    return __awaiter(this, void 0, void 0, function* () {
        process.on('SIGINT', () => {
            // eslint-disable-next-line no-console
            console.log('bye');
            process.exit(0);
        });
        let recovered = false;
        const renamedNodeModules = yield renameNodeModuleSymlink();
        process.on('beforeExit', () => {
            if (recovered)
                return;
            recovered = true;
            const suffixLen = '.lock'.length;
            for (const link of renamedNodeModules) {
                const orig = link.slice(0, link.length - suffixLen);
                if (!fs_1.default.existsSync(orig)) {
                    void fs_1.default.promises.rename(link, orig);
                    log.info('recover ' + link);
                }
            }
        });
        let argv = process.argv.slice(2);
        const foundCmdOptIdx = argv.findIndex(arg => arg === '--cwd' || arg === '--space');
        const workdir = foundCmdOptIdx >= 0 ? path_1.default.resolve(misc_1.plinkEnv.rootDir, argv[foundCmdOptIdx + 1]) : null;
        if (workdir) {
            argv.splice(foundCmdOptIdx, 2);
            // process.env.PLINK_WORK_DIR = workdir;
        }
        process.execArgv.push('--preserve-symlinks-main', '--preserve-symlinks');
        const foundDebugOptIdx = argv.findIndex(arg => arg === '--inspect' || arg === '--inspect-brk');
        const env = Object.assign({}, process.env);
        if (foundDebugOptIdx >= 0) {
            env.NODE_OPTIONS = env.NODE_OPTIONS ? env.NODE_OPTIONS + ' ' + argv[foundDebugOptIdx] : argv[foundDebugOptIdx];
            argv.splice(foundDebugOptIdx, 1);
        }
        const debugOptIdx = argv.findIndex(arg => arg === '--debug');
        if (debugOptIdx >= 0) {
            env.NODE_OPTIONS = env.NODE_OPTIONS ? env.NODE_OPTIONS + ' --inspect-brk' : '--inspect-brk';
            argv.splice(debugOptIdx, 1);
        }
        env.__plink_fork_main = moduleName;
        // env.__plink_save_state = '1';
        if (workdir)
            env.PLINK_WORK_DIR = workdir;
        const cp = (0, child_process_1.fork)(path_1.default.resolve(__dirname, 'fork-preserve-symlink-main.js'), argv, {
            env,
            stdio: 'inherit'
        });
        const { isStateSyncMsg } = require('./store');
        cp.on('message', (msg) => {
            if (isStateSyncMsg(msg)) {
                // const stat = eval('(' + msg.data + ')');
            }
        });
        return;
    });
}
exports.forkFile = forkFile;
/**
 * Temporarily rename <pkg>/node_modules to another name
 * @returns
 */
function renameNodeModuleSymlink() {
    return __awaiter(this, void 0, void 0, function* () {
        const { getState } = require('./editor-helper');
        const links = getState().nodeModuleSymlinks;
        if (links == null)
            return Promise.resolve([]);
        const dones = Array.from(links.values()).map((link) => __awaiter(this, void 0, void 0, function* () {
            try {
                const stat = yield fs_1.default.promises.lstat(link);
                if (!stat.isSymbolicLink() && !stat.isDirectory())
                    return null;
            }
            catch (ex) {
                return null;
            }
            log.info('Temporarliy rename ' + link);
            const newName = link + '.lock';
            if (fs_1.default.existsSync(newName)) {
                yield fs_1.default.promises.unlink(link);
                return newName;
            }
            return fs_1.default.promises.rename(link, newName).then(() => newName);
        }));
        const res = yield Promise.all(dones);
        return res.filter(item => item != null);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yay1mb3ItcHJlc2VydmUtc3ltbGluay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3RzL2ZvcmstZm9yLXByZXNlcnZlLXN5bWxpbmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLGlEQUFtQztBQUNuQyw0Q0FBb0I7QUFDcEIsdUNBQXNDO0FBSXRDLG9EQUE0QjtBQUM1QixNQUFNLEdBQUcsR0FBRyxnQkFBTSxDQUFDLFNBQVMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0FBRWpFLFNBQXNCLFFBQVEsQ0FBQyxVQUFrQjs7UUFDL0MsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLHNDQUFzQztZQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25CLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdEIsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLHVCQUF1QixFQUFFLENBQUM7UUFFM0QsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQzVCLElBQUksU0FBUztnQkFDWCxPQUFPO1lBQ1QsU0FBUyxHQUFHLElBQUksQ0FBQztZQUNqQixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRWpDLEtBQUssTUFBTSxJQUFJLElBQUksa0JBQWtCLEVBQUU7Z0JBQ3JDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxZQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN4QixLQUFLLFlBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFD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TUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBYSxDQUFDO0lBQ3RELENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtmb3JrfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQge3BsaW5rRW52fSBmcm9tICcuL3V0aWxzL21pc2MnO1xuaW1wb3J0ICogYXMgX2VkaXRvckhlbHBlciBmcm9tICcuL2VkaXRvci1oZWxwZXInO1xuaW1wb3J0ICogYXMgX3N0b3JlIGZyb20gJy4vc3RvcmUnO1xuXG5pbXBvcnQgbG9nNGpzIGZyb20gJ2xvZzRqcyc7XG5jb25zdCBsb2cgPSBsb2c0anMuZ2V0TG9nZ2VyKCdwbGluay5mb3JrLWZvci1wcmVzZXJ2ZXItc3ltbGluaycpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZm9ya0ZpbGUobW9kdWxlTmFtZTogc3RyaW5nKSB7XG4gIHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKCdieWUnKTtcbiAgICBwcm9jZXNzLmV4aXQoMCk7XG4gIH0pO1xuXG4gIGxldCByZWNvdmVyZWQgPSBmYWxzZTtcbiAgY29uc3QgcmVuYW1lZE5vZGVNb2R1bGVzID0gYXdhaXQgcmVuYW1lTm9kZU1vZHVsZVN5bWxpbmsoKTtcblxuICBwcm9jZXNzLm9uKCdiZWZvcmVFeGl0JywgKCkgPT4ge1xuICAgIGlmIChyZWNvdmVyZWQpXG4gICAgICByZXR1cm47XG4gICAgcmVjb3ZlcmVkID0gdHJ1ZTtcbiAgICBjb25zdCBzdWZmaXhMZW4gPSAnLmxvY2snLmxlbmd0aDtcblxuICAgIGZvciAoY29uc3QgbGluayBvZiByZW5hbWVkTm9kZU1vZHVsZXMpIHtcbiAgICAgIGNvbnN0IG9yaWcgPSBsaW5rLnNsaWNlKDAsIGxpbmsubGVuZ3RoIC0gc3VmZml4TGVuKTtcbiAgICAgIGlmICghZnMuZXhpc3RzU3luYyhvcmlnKSkge1xuICAgICAgICB2b2lkIGZzLnByb21pc2VzLnJlbmFtZShsaW5rLCBvcmlnKTtcbiAgICAgICAgbG9nLmluZm8oJ3JlY292ZXIgJyArIGxpbmspO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cblxuICBsZXQgYXJndiA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcbiAgY29uc3QgZm91bmRDbWRPcHRJZHggPSAgYXJndi5maW5kSW5kZXgoYXJnID0+IGFyZyA9PT0gJy0tY3dkJyB8fCBhcmcgPT09ICctLXNwYWNlJyk7XG4gIGNvbnN0IHdvcmtkaXIgPSBmb3VuZENtZE9wdElkeCA+PSAwID8gUGF0aC5yZXNvbHZlKHBsaW5rRW52LnJvb3REaXIsICBhcmd2W2ZvdW5kQ21kT3B0SWR4ICsgMV0pIDogbnVsbDtcbiAgaWYgKHdvcmtkaXIpIHtcbiAgICBhcmd2LnNwbGljZShmb3VuZENtZE9wdElkeCwgMik7XG4gICAgLy8gcHJvY2Vzcy5lbnYuUExJTktfV09SS19ESVIgPSB3b3JrZGlyO1xuICB9XG5cbiAgcHJvY2Vzcy5leGVjQXJndi5wdXNoKCctLXByZXNlcnZlLXN5bWxpbmtzLW1haW4nLCAnLS1wcmVzZXJ2ZS1zeW1saW5rcycpO1xuICBjb25zdCBmb3VuZERlYnVnT3B0SWR4ID0gYXJndi5maW5kSW5kZXgoYXJnID0+IGFyZyA9PT0gJy0taW5zcGVjdCcgfHwgYXJnID09PSAnLS1pbnNwZWN0LWJyaycpO1xuXG4gIGNvbnN0IGVudjoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IHVuZGVmaW5lZH0gPSB7Li4ucHJvY2Vzcy5lbnZ9O1xuICBpZiAoZm91bmREZWJ1Z09wdElkeCA+PSAwKSB7XG4gICAgZW52Lk5PREVfT1BUSU9OUyA9IGVudi5OT0RFX09QVElPTlMgPyBlbnYuTk9ERV9PUFRJT05TICsgJyAnICsgYXJndltmb3VuZERlYnVnT3B0SWR4XSA6IGFyZ3ZbZm91bmREZWJ1Z09wdElkeF07XG4gICAgYXJndi5zcGxpY2UoZm91bmREZWJ1Z09wdElkeCwgMSk7XG4gIH1cbiAgY29uc3QgZGVidWdPcHRJZHggPSBhcmd2LmZpbmRJbmRleChhcmcgPT4gYXJnID09PSAnLS1kZWJ1ZycpO1xuICBpZiAoZGVidWdPcHRJZHggPj0gMCkge1xuICAgIGVudi5OT0RFX09QVElPTlMgPSBlbnYuTk9ERV9PUFRJT05TID8gZW52Lk5PREVfT1BUSU9OUyArICcgLS1pbnNwZWN0LWJyaycgOiAnLS1pbnNwZWN0LWJyayc7XG4gICAgYXJndi5zcGxpY2UoZGVidWdPcHRJZHgsIDEpO1xuICB9XG5cbiAgZW52Ll9fcGxpbmtfZm9ya19tYWluID0gbW9kdWxlTmFtZTtcbiAgLy8gZW52Ll9fcGxpbmtfc2F2ZV9zdGF0ZSA9ICcxJztcblxuICBpZiAod29ya2RpcilcbiAgICBlbnYuUExJTktfV09SS19ESVIgPSB3b3JrZGlyO1xuXG4gIGNvbnN0IGNwID0gZm9yayhQYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZm9yay1wcmVzZXJ2ZS1zeW1saW5rLW1haW4uanMnKSwgYXJndiwge1xuICAgIGVudixcbiAgICBzdGRpbzogJ2luaGVyaXQnXG4gIH0pO1xuXG4gIGNvbnN0IHtpc1N0YXRlU3luY01zZ30gPSByZXF1aXJlKCcuL3N0b3JlJykgYXMgdHlwZW9mIF9zdG9yZTtcbiAgY3Aub24oJ21lc3NhZ2UnLCAobXNnKSA9PiB7XG4gICAgaWYgKGlzU3RhdGVTeW5jTXNnKG1zZykpIHtcbiAgICAgIC8vIGNvbnN0IHN0YXQgPSBldmFsKCcoJyArIG1zZy5kYXRhICsgJyknKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybjtcbn1cblxuLyoqXG4gKiBUZW1wb3JhcmlseSByZW5hbWUgPHBrZz4vbm9kZV9tb2R1bGVzIHRvIGFub3RoZXIgbmFtZVxuICogQHJldHVybnMgXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlbmFtZU5vZGVNb2R1bGVTeW1saW5rKCkge1xuICBjb25zdCB7Z2V0U3RhdGV9ID0gcmVxdWlyZSgnLi9lZGl0b3ItaGVscGVyJykgYXMgdHlwZW9mIF9lZGl0b3JIZWxwZXI7XG4gIGNvbnN0IGxpbmtzID0gZ2V0U3RhdGUoKS5ub2RlTW9kdWxlU3ltbGlua3M7XG5cbiAgaWYgKGxpbmtzID09IG51bGwpXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gIGNvbnN0IGRvbmVzID0gQXJyYXkuZnJvbShsaW5rcy52YWx1ZXMoKSkubWFwKGFzeW5jIGxpbmsgPT4ge1xuICAgIHRyeSB7XG4gICAgY29uc3Qgc3RhdCA9IGF3YWl0IGZzLnByb21pc2VzLmxzdGF0KGxpbmspO1xuICAgIGlmICghc3RhdC5pc1N5bWJvbGljTGluaygpICYmICFzdGF0LmlzRGlyZWN0b3J5KCkpXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGxvZy5pbmZvKCdUZW1wb3JhcmxpeSByZW5hbWUgJyArIGxpbmspO1xuICAgIGNvbnN0IG5ld05hbWUgPSBsaW5rICsgJy5sb2NrJztcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhuZXdOYW1lKSkge1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMudW5saW5rKGxpbmspO1xuICAgICAgcmV0dXJuIG5ld05hbWU7XG4gICAgfVxuICAgIHJldHVybiBmcy5wcm9taXNlcy5yZW5hbWUobGluaywgbmV3TmFtZSkudGhlbigoKSA9PiBuZXdOYW1lKTtcbiAgfSk7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IFByb21pc2UuYWxsKGRvbmVzKTtcbiAgcmV0dXJuIHJlcy5maWx0ZXIoaXRlbSA9PiBpdGVtICE9IG51bGwpIGFzIHN0cmluZ1tdO1xufVxuIl19