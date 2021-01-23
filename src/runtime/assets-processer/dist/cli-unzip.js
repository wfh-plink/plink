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
exports.unZip = exports.listZip = void 0;
const yauzl_1 = __importDefault(require("yauzl"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
function listZip(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const zip = yield new Promise((resolve, rej) => {
            yauzl_1.default.open(fileName, { lazyEntries: true }, (err, zip) => {
                if (err) {
                    return rej(err);
                }
                resolve(zip);
            });
        });
        const list = [];
        if (zip == null) {
            throw new Error(`yauzl can not list zip file ${fileName}`);
        }
        zip.on('entry', (entry) => {
            list.push(entry.fileName);
            // tslint:disable-next-line: no-console
            console.log(entry.fileName + chalk_1.default.green(` (size: ${entry.uncompressedSize >> 10} Kb)`));
            zip.readEntry();
        });
        zip.readEntry();
        return new Promise(resolve => {
            zip.on('end', () => resolve(list));
        });
    });
}
exports.listZip = listZip;
function unZip(fileName, toDir = process.cwd()) {
    return __awaiter(this, void 0, void 0, function* () {
        const zip = yield new Promise((resolve, rej) => {
            yauzl_1.default.open(fileName, { lazyEntries: true }, (err, zip) => {
                if (err) {
                    return rej(err);
                }
                resolve(zip);
            });
        });
        if (zip == null) {
            throw new Error(`yauzl can not unzip zip file ${fileName}`);
        }
        zip.on('entry', (entry) => {
            if (entry.fileName.endsWith('/')) {
                // some zip format contains directory
                zip.readEntry();
                return;
            }
            // tslint:disable-next-line: no-console
            console.log(entry.fileName + chalk_1.default.gray(` (size: ${entry.uncompressedSize >> 10} Kb)`));
            zip.openReadStream(entry, (err, readStream) => {
                if (err) {
                    console.error(`yauzl is unable to extract file ${entry.fileName}`, err);
                    zip.readEntry();
                    return;
                }
                readStream.on('end', () => { zip.readEntry(); });
                const target = path_1.default.resolve(toDir, entry.fileName);
                // tslint:disable-next-line: no-console
                console.log(`write ${target} ` + chalk_1.default.gray(` (size: ${entry.uncompressedSize >> 10} Kb)`));
                const dir = path_1.default.dirname(target);
                if (!fs_1.existsSync(dir))
                    fs_extra_1.mkdirpSync(dir);
                readStream.pipe(fs_1.createWriteStream(target));
            });
        });
        zip.readEntry();
        return new Promise(resolve => {
            zip.on('end', () => resolve());
        });
    });
}
exports.unZip = unZip;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLXVuemlwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpLXVuemlwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQixrREFBMEI7QUFDMUIsMkJBQW1EO0FBQ25ELHVDQUFvQztBQUNwQyxnREFBd0I7QUFFeEIsU0FBc0IsT0FBTyxDQUFDLFFBQWdCOztRQUM1QyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksT0FBTyxDQUE0QixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUN4RSxlQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDckQsSUFBSSxHQUFHLEVBQUU7b0JBQ1AsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2pCO2dCQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLElBQUksR0FBYSxFQUFFLENBQUM7UUFDMUIsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUM1RDtRQUNELEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBa0IsRUFBRSxFQUFFO1lBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTFCLHVDQUF1QztZQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsZUFBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLEtBQUssQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDekYsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFD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Q2pDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUExQ0Qsc0JBMENDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHlhdXpsIGZyb20gJ3lhdXpsJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgeyBjcmVhdGVXcml0ZVN0cmVhbSwgZXhpc3RzU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7bWtkaXJwU3luY30gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0WmlwKGZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgY29uc3QgemlwID0gYXdhaXQgbmV3IFByb21pc2U8eWF1emwuWmlwRmlsZSB8IHVuZGVmaW5lZD4oKHJlc29sdmUsIHJlaikgPT4ge1xuICAgIHlhdXpsLm9wZW4oZmlsZU5hbWUsIHtsYXp5RW50cmllczogdHJ1ZX0sIChlcnIsIHppcCkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gcmVqKGVycik7XG4gICAgICB9XG4gICAgICByZXNvbHZlKHppcCk7XG4gICAgfSk7XG4gIH0pO1xuICBjb25zdCBsaXN0OiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoemlwID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHlhdXpsIGNhbiBub3QgbGlzdCB6aXAgZmlsZSAke2ZpbGVOYW1lfWApO1xuICB9XG4gIHppcC5vbignZW50cnknLCAoZW50cnk6IHlhdXpsLkVudHJ5KSA9PiB7XG4gICAgbGlzdC5wdXNoKGVudHJ5LmZpbGVOYW1lKTtcblxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKGVudHJ5LmZpbGVOYW1lICsgY2hhbGsuZ3JlZW4oYCAoc2l6ZTogJHtlbnRyeS51bmNvbXByZXNzZWRTaXplID4+IDEwfSBLYilgKSk7XG4gICAgemlwLnJlYWRFbnRyeSgpO1xuICB9KTtcbiAgemlwLnJlYWRFbnRyeSgpO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZTx0eXBlb2YgbGlzdD4ocmVzb2x2ZSA9PiB7XG4gICAgemlwLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKGxpc3QpKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1blppcChmaWxlTmFtZTogc3RyaW5nLCB0b0RpciA9IHByb2Nlc3MuY3dkKCkpIHtcbiAgY29uc3QgemlwID0gYXdhaXQgbmV3IFByb21pc2U8eWF1emwuWmlwRmlsZSB8IHVuZGVmaW5lZD4oKHJlc29sdmUsIHJlaikgPT4ge1xuICAgIHlhdXpsLm9wZW4oZmlsZU5hbWUsIHtsYXp5RW50cmllczogdHJ1ZX0sIChlcnIsIHppcCkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gcmVqKGVycik7XG4gICAgICB9XG4gICAgICByZXNvbHZlKHppcCk7XG4gICAgfSk7XG4gIH0pO1xuICBpZiAoemlwID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHlhdXpsIGNhbiBub3QgdW56aXAgemlwIGZpbGUgJHtmaWxlTmFtZX1gKTtcbiAgfVxuICB6aXAub24oJ2VudHJ5JywgKGVudHJ5OiB5YXV6bC5FbnRyeSkgPT4ge1xuICAgIGlmIChlbnRyeS5maWxlTmFtZS5lbmRzV2l0aCgnLycpKSB7XG4gICAgICAvLyBzb21lIHppcCBmb3JtYXQgY29udGFpbnMgZGlyZWN0b3J5XG4gICAgICB6aXAucmVhZEVudHJ5KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKGVudHJ5LmZpbGVOYW1lICsgY2hhbGsuZ3JheShgIChzaXplOiAke2VudHJ5LnVuY29tcHJlc3NlZFNpemUgPj4gMTB9IEtiKWApKTtcblxuICAgIHppcC5vcGVuUmVhZFN0cmVhbShlbnRyeSwgKGVyciwgcmVhZFN0cmVhbSkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGB5YXV6bCBpcyB1bmFibGUgdG8gZXh0cmFjdCBmaWxlICR7ZW50cnkuZmlsZU5hbWV9YCwgZXJyKTtcbiAgICAgICAgemlwLnJlYWRFbnRyeSgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZWFkU3RyZWFtIS5vbignZW5kJywgKCkgPT4ge3ppcC5yZWFkRW50cnkoKTt9KTtcbiAgICAgIGNvbnN0IHRhcmdldCA9IFBhdGgucmVzb2x2ZSh0b0RpciwgZW50cnkuZmlsZU5hbWUpO1xuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmxvZyhgd3JpdGUgJHt0YXJnZXR9IGAgKyBjaGFsay5ncmF5KGAgKHNpemU6ICR7ZW50cnkudW5jb21wcmVzc2VkU2l6ZSA+PiAxMH0gS2IpYCkpO1xuICAgICAgY29uc3QgZGlyID0gUGF0aC5kaXJuYW1lKHRhcmdldCk7XG4gICAgICBpZiAoIWV4aXN0c1N5bmMoZGlyKSlcbiAgICAgICAgbWtkaXJwU3luYyhkaXIpO1xuICAgICAgcmVhZFN0cmVhbSEucGlwZShjcmVhdGVXcml0ZVN0cmVhbSh0YXJnZXQpKTtcbiAgICB9KTtcbiAgfSk7XG4gIHppcC5yZWFkRW50cnkoKTtcblxuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4ocmVzb2x2ZSA9PiB7XG4gICAgemlwLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKCkpO1xuICB9KTtcbn1cbiJdfQ==