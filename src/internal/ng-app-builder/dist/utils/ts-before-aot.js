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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const typescript_1 = require("typescript");
const patch_text_1 = __importStar(require("./patch-text")), textPatcher = patch_text_1;
const __api_1 = __importDefault(require("__api"));
const vm = require("vm");
const path_1 = require("path");
const default_import_ts_transpiler_1 = __importDefault(require("./default-import-ts-transpiler"));
const chalk = require('chalk');
const log = require('log4js').getLogger(__api_1.default.packageName + '.api-aot-compiler');
function createTsHandlers() {
    const funcs = [];
    for (const pk of __api_1.default.packageInfo.allModules) {
        if (pk.dr && pk.dr.ngTsHandler) {
            const [filePath, exportName] = pk.dr.ngTsHandler.split('#');
            const path = path_1.resolve(pk.realPackagePath, filePath);
            const func = require(path)[exportName];
            funcs.push([
                path + '#' + exportName,
                func
            ]);
        }
    }
    return funcs;
}
let tsHandlers;
class ApiAotCompiler {
    constructor(file, src) {
        this.file = file;
        this.src = src;
        this.replacements = [];
        if (__api_1.default.ssr) {
            this.importTranspiler = new default_import_ts_transpiler_1.default({
                file: this.file,
                modules: [/^lodash(?:\/|$)/]
            });
        }
    }
    parse(transpileExp) {
        const pk = __api_1.default.findPackageByFile(this.file);
        // console.log('parse', this.file, pk == null ? '' : 'yes');
        if (pk == null)
            return this.src;
        if (!tsHandlers)
            tsHandlers = createTsHandlers();
        this.ast = ts.createSourceFile(this.file, this.src, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
        this._callTsHandlers(tsHandlers);
        for (const stm of this.ast.statements) {
            this.traverseTsAst(stm);
        }
        textPatcher._sortAndRemoveOverlap(this.replacements, true, this.src);
        // Remove overlaped replacements to avoid them getting into later `vm.runInNewContext()`,
        // We don't want to single out and evaluate lower level expression like `__api.packageName` from
        // `__api.config.get(__api.packageName)`, we just evaluate the whole latter expression
        const nodeApi = __api_1.default.getNodeApiForPackage(pk);
        nodeApi.__dirname = path_1.dirname(this.file);
        const context = vm.createContext({ __api: nodeApi });
        for (const repl of this.replacements) {
            const origText = repl.text;
            let res;
            try {
                res = vm.runInNewContext(transpileExp(origText), context);
                repl.text = JSON.stringify(res);
                // To bypass TS error "Unreachable code detected" if
                // compiler option "allowUnreachableCode: false"
                // e.g. if (false) {...} --> if (!!false) {...}
                if (repl.text === 'true' || repl.text === 'false')
                    repl.text = '!!' + repl.text;
                else if (repl.text === undefined) {
                    // JSON.stringify(undefined) will not return string of "undefined", but actual undefined
                    repl.text = 'undefined';
                }
            }
            catch (ex) {
                log.error('Evaluate %s, result:', origText, res);
                throw ex;
            }
            log.info(`Evaluate "${chalk.yellow(origText)}" to: ${chalk.cyan(repl.text)} in\n\t` +
                path_1.relative(process.cwd(), this.file));
        }
        if (this.importTranspiler)
            this.importTranspiler.parse(this.ast, this.replacements);
        if (this.replacements.length === 0)
            return this.src;
        textPatcher._sortAndRemoveOverlap(this.replacements, true, this.src);
        return textPatcher._replaceSorted(this.src, this.replacements);
    }
    getApiForFile(file) {
        __api_1.default.findPackageByFile(file);
    }
    _callTsHandlers(tsHandlers) {
        for (const [name, func] of tsHandlers) {
            const change = func(this.ast);
            if (change && change.length > 0) {
                log.info('%s is changed by %s', chalk.cyan(this.ast.fileName), chalk.blue(name));
                this.src = patch_text_1.default(this.src, change);
                this.ast = ts.createSourceFile(this.file, this.src, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
            }
        }
    }
    traverseTsAst(ast, level = 0) {
        if (ast.kind === typescript_1.SyntaxKind.PropertyAccessExpression || ast.kind === typescript_1.SyntaxKind.ElementAccessExpression) {
            const node = ast;
            if (node.expression.kind === typescript_1.SyntaxKind.Identifier && node.expression.getText(this.ast) === '__api') {
                // keep looking up for parents until it is not CallExpression, ElementAccessExpression or PropertyAccessExpression
                const evaluateNode = this.goUpToParentExpress(node);
                this.replacements.push({ start: evaluateNode.getStart(this.ast),
                    end: evaluateNode.getEnd(),
                    text: evaluateNode.getText(this.ast) });
                return;
            }
        }
        // else if (ast.kind === sk.Identifier && ast.getText() === '__api') {
        //   this.replacements.push({start: ast.getStart(), end: ast.getEnd(), text: '"__api"'});
        // }
        ast.forEachChild((sub) => {
            this.traverseTsAst(sub, level + 1);
        });
    }
    /**
       * keep looking up for parents until it is not CallExpression, ElementAccessExpression or PropertyAccessExpression
       */
    goUpToParentExpress(target) {
        let currNode = target;
        while (true) {
            const kind = currNode.parent.kind;
            if (kind === typescript_1.SyntaxKind.CallExpression && currNode.parent.expression === currNode ||
                kind === typescript_1.SyntaxKind.PropertyAccessExpression && currNode.parent.expression === currNode ||
                kind === typescript_1.SyntaxKind.ElementAccessExpression && currNode.parent.expression === currNode) {
                currNode = currNode.parent;
            }
            else {
                break;
            }
        }
        return currNode;
    }
}
exports.default = ApiAotCompiler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHMtYmVmb3JlLWFvdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRzLWJlZm9yZS1hb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBQ2pDLDJDQUE0QztBQUM1Qyx1RkFBeUQ7QUFFekQsa0RBQW1DO0FBQ25DLHlCQUEwQjtBQUMxQiwrQkFBZ0Q7QUFDaEQsa0dBQW1FO0FBRW5FLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLGVBQUcsQ0FBQyxXQUFXLEdBQUcsbUJBQW1CLENBQUMsQ0FBQztBQUsvRSxTQUFTLGdCQUFnQjtJQUN2QixNQUFNLEtBQUssR0FBK0IsRUFBRSxDQUFDO0lBQzdDLEtBQUssTUFBTSxFQUFFLElBQUksZUFBRyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUU7UUFDM0MsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFO1lBQzlCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVELE1BQU0sSUFBSSxHQUFHLGNBQU8sQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQWMsQ0FBQztZQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNULElBQUksR0FBRyxHQUFHLEdBQUcsVUFBVTtnQkFDdkIsSUFBSTthQUNMLENBQUMsQ0FBQztTQUNKO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxJQUFJLFVBQXNDLENBQUM7QUFF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QyxZQUFZLENBQUMsQ0FBQyxHQUFZLEVBQUUsRUFBRTtZQUNoQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7O1NBRUU7SUFDUSxtQkFBbUIsQ0FBQyxNQUFlO1FBQzNDLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQztRQUN0QixPQUFNLElBQUksRUFBRTtZQUNWLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2xDLElBQUksSUFBSSxLQUFLLHVCQUFFLENBQUMsY0FBYyxJQUFLLFFBQVEsQ0FBQyxNQUE0QixDQUFDLFVBQVUsS0FBSyxRQUFRO2dCQUM5RixJQUFJLEtBQUssdUJBQUUsQ0FBQyx3QkFBd0IsSUFBSyxRQUFRLENBQUMsTUFBc0MsQ0FBQyxVQUFVLEtBQUssUUFBUTtnQkFDaEgsSUFBSSxLQUFLLHVCQUFFLENBQUMsdUJBQXVCLElBQUssUUFBUSxDQUFDLE1BQXFDLENBQUMsVUFBVSxLQUFLLFFBQVEsRUFBRTtnQkFDaEgsUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7YUFDNUI7aUJBQU07Z0JBQ0wsTUFBTTthQUNQO1NBQ0Y7UUFDRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0NBQ0Y7QUE3SEQsaUNBNkhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge1N5bnRheEtpbmQgYXMgc2t9IGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHJlcGxhY2VDb2RlLCAqIGFzIHRleHRQYXRjaGVyIGZyb20gJy4vcGF0Y2gtdGV4dCc7XG5pbXBvcnQge1JlcGxhY2VtZW50SW5mfSBmcm9tICcuL3BhdGNoLXRleHQnO1xuaW1wb3J0IGFwaSwge0RyY3BBcGl9IGZyb20gJ19fYXBpJztcbmltcG9ydCB2bSA9IHJlcXVpcmUoJ3ZtJyk7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlLCByZXNvbHZlfSBmcm9tICdwYXRoJztcbmltcG9ydCBJbXBvcnRDbGF1c2VUcmFuc3BpbGUgZnJvbSAnLi9kZWZhdWx0LWltcG9ydC10cy10cmFuc3BpbGVyJztcblxuY29uc3QgY2hhbGsgPSByZXF1aXJlKCdjaGFsaycpO1xuY29uc3QgbG9nID0gcmVxdWlyZSgnbG9nNGpzJykuZ2V0TG9nZ2VyKGFwaS5wYWNrYWdlTmFtZSArICcuYXBpLWFvdC1jb21waWxlcicpO1xuXG5leHBvcnQge1JlcGxhY2VtZW50SW5mfTtcbmV4cG9ydCB0eXBlIFRzSGFuZGxlciA9IChhc3Q6IHRzLlNvdXJjZUZpbGUpID0+IFJlcGxhY2VtZW50SW5mW107XG5cbmZ1bmN0aW9uIGNyZWF0ZVRzSGFuZGxlcnMoKTogQXJyYXk8W3N0cmluZywgVHNIYW5kbGVyXT4ge1xuICBjb25zdCBmdW5jczogQXJyYXk8W3N0cmluZywgVHNIYW5kbGVyXT4gPSBbXTtcbiAgZm9yIChjb25zdCBwayBvZiBhcGkucGFja2FnZUluZm8uYWxsTW9kdWxlcykge1xuICAgIGlmIChway5kciAmJiBway5kci5uZ1RzSGFuZGxlcikge1xuICAgICAgY29uc3QgW2ZpbGVQYXRoLCBleHBvcnROYW1lXSA9IHBrLmRyLm5nVHNIYW5kbGVyLnNwbGl0KCcjJyk7XG4gICAgICBjb25zdCBwYXRoID0gcmVzb2x2ZShway5yZWFsUGFja2FnZVBhdGgsIGZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IGZ1bmMgPSByZXF1aXJlKHBhdGgpW2V4cG9ydE5hbWVdIGFzIFRzSGFuZGxlcjtcbiAgICAgIGZ1bmNzLnB1c2goW1xuICAgICAgICBwYXRoICsgJyMnICsgZXhwb3J0TmFtZSxcbiAgICAgICAgZnVuY1xuICAgICAgXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBmdW5jcztcbn1cblxubGV0IHRzSGFuZGxlcnM6IEFycmF5PFtzdHJpbmcsIFRzSGFuZGxlcl0+O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcGlBb3RDb21waWxlciB7XG4gIGFzdDogdHMuU291cmNlRmlsZTtcblxuICByZXBsYWNlbWVudHM6IFJlcGxhY2VtZW50SW5mW10gPSBbXTtcblxuICBpbXBvcnRUcmFuc3BpbGVyOiBJbXBvcnRDbGF1c2VUcmFuc3BpbGU7XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIGZpbGU6IHN0cmluZywgcHJvdGVjdGVkIHNyYzogc3RyaW5nKSB7XG4gICAgaWYgKGFwaS5zc3IpIHtcbiAgICAgIHRoaXMuaW1wb3J0VHJhbnNwaWxlciA9IG5ldyBJbXBvcnRDbGF1c2VUcmFuc3BpbGUoe1xuICAgICAgICBmaWxlOiB0aGlzLmZpbGUsXG4gICAgICAgIG1vZHVsZXM6IFsvXmxvZGFzaCg/OlxcL3wkKS9dXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwYXJzZSh0cmFuc3BpbGVFeHA6IChzb3VyY2U6IHN0cmluZykgPT4gc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBwayA9IGFwaS5maW5kUGFja2FnZUJ5RmlsZSh0aGlzLmZpbGUpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdwYXJzZScsIHRoaXMuZmlsZSwgcGsgPT0gbnVsbCA/ICcnIDogJ3llcycpO1xuICAgIGlmIChwayA9PSBudWxsKVxuICAgICAgcmV0dXJuIHRoaXMuc3JjO1xuICAgIGlmICghdHNIYW5kbGVycylcbiAgICAgIHRzSGFuZGxlcnMgPSBjcmVhdGVUc0hhbmRsZXJzKCk7XG5cbiAgICB0aGlzLmFzdCA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUodGhpcy5maWxlLCB0aGlzLnNyYywgdHMuU2NyaXB0VGFyZ2V0LkVTTmV4dCxcbiAgICAgIHRydWUsIHRzLlNjcmlwdEtpbmQuVFNYKTtcbiAgICB0aGlzLl9jYWxsVHNIYW5kbGVycyh0c0hhbmRsZXJzKTtcblxuICAgIGZvcihjb25zdCBzdG0gb2YgdGhpcy5hc3Quc3RhdGVtZW50cykge1xuICAgICAgdGhpcy50cmF2ZXJzZVRzQXN0KHN0bSk7XG4gICAgfVxuICAgIHRleHRQYXRjaGVyLl9zb3J0QW5kUmVtb3ZlT3ZlcmxhcCh0aGlzLnJlcGxhY2VtZW50cywgdHJ1ZSwgdGhpcy5zcmMpO1xuICAgIC8vIFJlbW92ZSBvdmVybGFwZWQgcmVwbGFjZW1lbnRzIHRvIGF2b2lkIHRoZW0gZ2V0dGluZyBpbnRvIGxhdGVyIGB2bS5ydW5Jbk5ld0NvbnRleHQoKWAsXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBzaW5nbGUgb3V0IGFuZCBldmFsdWF0ZSBsb3dlciBsZXZlbCBleHByZXNzaW9uIGxpa2UgYF9fYXBpLnBhY2thZ2VOYW1lYCBmcm9tXG4gICAgLy8gYF9fYXBpLmNvbmZpZy5nZXQoX19hcGkucGFja2FnZU5hbWUpYCwgd2UganVzdCBldmFsdWF0ZSB0aGUgd2hvbGUgbGF0dGVyIGV4cHJlc3Npb25cblxuICAgIGNvbnN0IG5vZGVBcGkgPSBhcGkuZ2V0Tm9kZUFwaUZvclBhY2thZ2U8RHJjcEFwaT4ocGspO1xuICAgIG5vZGVBcGkuX19kaXJuYW1lID0gZGlybmFtZSh0aGlzLmZpbGUpO1xuICAgIGNvbnN0IGNvbnRleHQgPSB2bS5jcmVhdGVDb250ZXh0KHtfX2FwaTogbm9kZUFwaX0pO1xuXG4gICAgZm9yIChjb25zdCByZXBsIG9mIHRoaXMucmVwbGFjZW1lbnRzKSB7XG4gICAgICBjb25zdCBvcmlnVGV4dCA9IHJlcGwudGV4dCE7XG4gICAgICBsZXQgcmVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzID0gdm0ucnVuSW5OZXdDb250ZXh0KHRyYW5zcGlsZUV4cChvcmlnVGV4dCksIGNvbnRleHQpO1xuICAgICAgICByZXBsLnRleHQgPSBKU09OLnN0cmluZ2lmeShyZXMpO1xuICAgICAgICAvLyBUbyBieXBhc3MgVFMgZXJyb3IgXCJVbnJlYWNoYWJsZSBjb2RlIGRldGVjdGVkXCIgaWZcbiAgICAgICAgLy8gY29tcGlsZXIgb3B0aW9uIFwiYWxsb3dVbnJlYWNoYWJsZUNvZGU6IGZhbHNlXCJcbiAgICAgICAgLy8gZS5nLiBpZiAoZmFsc2UpIHsuLi59IC0tPiBpZiAoISFmYWxzZSkgey4uLn1cbiAgICAgICAgaWYgKHJlcGwudGV4dCA9PT0gJ3RydWUnIHx8IHJlcGwudGV4dCA9PT0gJ2ZhbHNlJylcbiAgICAgICAgICByZXBsLnRleHQgPSAnISEnICsgcmVwbC50ZXh0O1xuICAgICAgICBlbHNlIGlmIChyZXBsLnRleHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIEpTT04uc3RyaW5naWZ5KHVuZGVmaW5lZCkgd2lsbCBub3QgcmV0dXJuIHN0cmluZyBvZiBcInVuZGVmaW5lZFwiLCBidXQgYWN0dWFsIHVuZGVmaW5lZFxuICAgICAgICAgIHJlcGwudGV4dCA9ICd1bmRlZmluZWQnO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGV4KSB7XG4gICAgICAgIGxvZy5lcnJvcignRXZhbHVhdGUgJXMsIHJlc3VsdDonLCBvcmlnVGV4dCwgcmVzKTtcbiAgICAgICAgdGhyb3cgZXg7XG4gICAgICB9XG4gICAgICBsb2cuaW5mbyhgRXZhbHVhdGUgXCIke2NoYWxrLnllbGxvdyhvcmlnVGV4dCl9XCIgdG86ICR7Y2hhbGsuY3lhbihyZXBsLnRleHQpfSBpblxcblxcdGAgK1xuICAgICAgICByZWxhdGl2ZShwcm9jZXNzLmN3ZCgpLCB0aGlzLmZpbGUpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbXBvcnRUcmFuc3BpbGVyKVxuICAgICAgdGhpcy5pbXBvcnRUcmFuc3BpbGVyLnBhcnNlKHRoaXMuYXN0LCB0aGlzLnJlcGxhY2VtZW50cyk7XG5cbiAgICBpZiAodGhpcy5yZXBsYWNlbWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIHRoaXMuc3JjO1xuICAgIHRleHRQYXRjaGVyLl9zb3J0QW5kUmVtb3ZlT3ZlcmxhcCh0aGlzLnJlcGxhY2VtZW50cywgdHJ1ZSwgdGhpcy5zcmMpO1xuICAgIHJldHVybiB0ZXh0UGF0Y2hlci5fcmVwbGFjZVNvcnRlZCh0aGlzLnNyYywgdGhpcy5yZXBsYWNlbWVudHMpO1xuICB9XG5cbiAgZ2V0QXBpRm9yRmlsZShmaWxlOiBzdHJpbmcpIHtcbiAgICBhcGkuZmluZFBhY2thZ2VCeUZpbGUoZmlsZSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX2NhbGxUc0hhbmRsZXJzKHRzSGFuZGxlcnM6IEFycmF5PFtzdHJpbmcsIFRzSGFuZGxlcl0+KTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgZnVuY10gb2YgdHNIYW5kbGVycykge1xuICAgICAgY29uc3QgY2hhbmdlID0gZnVuYyh0aGlzLmFzdCk7XG4gICAgICBpZiAoY2hhbmdlICYmIGNoYW5nZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxvZy5pbmZvKCclcyBpcyBjaGFuZ2VkIGJ5ICVzJywgY2hhbGsuY3lhbih0aGlzLmFzdC5maWxlTmFtZSksIGNoYWxrLmJsdWUobmFtZSkpO1xuICAgICAgICB0aGlzLnNyYyA9IHJlcGxhY2VDb2RlKHRoaXMuc3JjLCBjaGFuZ2UpO1xuICAgICAgICB0aGlzLmFzdCA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUodGhpcy5maWxlLCB0aGlzLnNyYywgdHMuU2NyaXB0VGFyZ2V0LkVTTmV4dCxcbiAgICAgICAgICB0cnVlLCB0cy5TY3JpcHRLaW5kLlRTWCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIHRyYXZlcnNlVHNBc3QoYXN0OiB0cy5Ob2RlLCBsZXZlbCA9IDApIHtcbiAgICBpZiAoYXN0LmtpbmQgPT09IHNrLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbiB8fCBhc3Qua2luZCA9PT0gc2suRWxlbWVudEFjY2Vzc0V4cHJlc3Npb24pIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBhc3QgYXMgKHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbiB8IHRzLkVsZW1lbnRBY2Nlc3NFeHByZXNzaW9uKTtcbiAgICAgIGlmIChub2RlLmV4cHJlc3Npb24ua2luZCA9PT0gc2suSWRlbnRpZmllciAmJiBub2RlLmV4cHJlc3Npb24uZ2V0VGV4dCh0aGlzLmFzdCkgPT09ICdfX2FwaScpIHtcbiAgICAgICAgLy8ga2VlcCBsb29raW5nIHVwIGZvciBwYXJlbnRzIHVudGlsIGl0IGlzIG5vdCBDYWxsRXhwcmVzc2lvbiwgRWxlbWVudEFjY2Vzc0V4cHJlc3Npb24gb3IgUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uXG4gICAgICAgIGNvbnN0IGV2YWx1YXRlTm9kZSA9IHRoaXMuZ29VcFRvUGFyZW50RXhwcmVzcyhub2RlKTtcbiAgICAgICAgdGhpcy5yZXBsYWNlbWVudHMucHVzaCh7c3RhcnQ6IGV2YWx1YXRlTm9kZS5nZXRTdGFydCh0aGlzLmFzdCksXG4gICAgICAgICAgZW5kOiBldmFsdWF0ZU5vZGUuZ2V0RW5kKCksXG4gICAgICAgICAgdGV4dDogZXZhbHVhdGVOb2RlLmdldFRleHQodGhpcy5hc3QpfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gZWxzZSBpZiAoYXN0LmtpbmQgPT09IHNrLklkZW50aWZpZXIgJiYgYXN0LmdldFRleHQoKSA9PT0gJ19fYXBpJykge1xuICAgIC8vICAgdGhpcy5yZXBsYWNlbWVudHMucHVzaCh7c3RhcnQ6IGFzdC5nZXRTdGFydCgpLCBlbmQ6IGFzdC5nZXRFbmQoKSwgdGV4dDogJ1wiX19hcGlcIid9KTtcbiAgICAvLyB9XG4gICAgYXN0LmZvckVhY2hDaGlsZCgoc3ViOiB0cy5Ob2RlKSA9PiB7XG4gICAgICB0aGlzLnRyYXZlcnNlVHNBc3Qoc3ViLCBsZXZlbCArIDEpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG5cdCAqIGtlZXAgbG9va2luZyB1cCBmb3IgcGFyZW50cyB1bnRpbCBpdCBpcyBub3QgQ2FsbEV4cHJlc3Npb24sIEVsZW1lbnRBY2Nlc3NFeHByZXNzaW9uIG9yIFByb3BlcnR5QWNjZXNzRXhwcmVzc2lvblxuXHQgKi9cbiAgcHJvdGVjdGVkIGdvVXBUb1BhcmVudEV4cHJlc3ModGFyZ2V0OiB0cy5Ob2RlKTogdHMuTm9kZSB7XG4gICAgbGV0IGN1cnJOb2RlID0gdGFyZ2V0O1xuICAgIHdoaWxlKHRydWUpIHtcbiAgICAgIGNvbnN0IGtpbmQgPSBjdXJyTm9kZS5wYXJlbnQua2luZDtcbiAgICAgIGlmIChraW5kID09PSBzay5DYWxsRXhwcmVzc2lvbiAmJiAoY3Vyck5vZGUucGFyZW50IGFzIHRzLkNhbGxFeHByZXNzaW9uKS5leHByZXNzaW9uID09PSBjdXJyTm9kZSB8fFxuICAgICAgICBraW5kID09PSBzay5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24gJiYgKGN1cnJOb2RlLnBhcmVudCBhcyB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pLmV4cHJlc3Npb24gPT09IGN1cnJOb2RlIHx8XG4gICAgICAgIGtpbmQgPT09IHNrLkVsZW1lbnRBY2Nlc3NFeHByZXNzaW9uICYmIChjdXJyTm9kZS5wYXJlbnQgYXMgdHMuRWxlbWVudEFjY2Vzc0V4cHJlc3Npb24pLmV4cHJlc3Npb24gPT09IGN1cnJOb2RlKSB7XG4gICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjdXJyTm9kZTtcbiAgfVxufVxuIl19