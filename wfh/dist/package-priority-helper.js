"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const log = require('log4js').getLogger('packagePriorityHelper');
const beforeOrAfter = {};
const priorityStrReg = /(before|after)\s+(\S+)/;
// tslint:disable max-line-length
function orderPackages(packages, run, priorityProperty) {
    const numberTypePrio = [];
    const beforePackages = {};
    const afterPackages = {};
    if (priorityProperty == null)
        priorityProperty = 'priority';
    packages.forEach(pk => {
        const priority = _.get(pk, priorityProperty);
        if (_.isNumber(priority)) {
            numberTypePrio.push(pk);
        }
        else if (_.isString(priority)) {
            const res = priorityStrReg.exec(priority);
            if (!res) {
                throw new Error('Invalid format of package.json - priority in ' +
                    pk.longName + ': ' + priority);
            }
            const targetPackageName = res[2];
            if (res[1] === 'before') {
                if (!beforePackages[targetPackageName]) {
                    beforePackages[targetPackageName] = [];
                    beforeOrAfter[targetPackageName] = 1; // track target package
                }
                beforePackages[targetPackageName].push(pk);
            }
            else if (res[1] === 'after') {
                if (!afterPackages[targetPackageName]) {
                    afterPackages[targetPackageName] = [];
                    beforeOrAfter[targetPackageName] = 1; // track target package
                }
                afterPackages[targetPackageName].push(pk);
            }
        }
        else {
            _.set(pk, priorityProperty, 5000);
            numberTypePrio.push(pk);
        }
    });
    numberTypePrio.sort(function (pk1, pk2) {
        return _.get(pk2, priorityProperty) - _.get(pk1, priorityProperty);
    });
    const notFound = _.difference(_.keys(beforeOrAfter), _.map(packages, pk => pk.longName));
    if (notFound.length > 0) {
        const err = 'Priority depended packages are not found: ' + notFound;
        log.error(err);
        return Promise.reject(new Error(err));
    }
    function runPackagesSync(packages) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const pk of packages) {
                yield runPackage(pk);
            }
        });
    }
    function runPackagesAsync(packages) {
        return Promise.all(packages.map(runPackage));
    }
    function runPackage(pk) {
        return __awaiter(this, void 0, void 0, function* () {
            yield beforeHandlersFor(pk.longName);
            log.debug(pk.longName, ' starts with priority: ', _.get(pk, priorityProperty));
            const anyRes = run(pk);
            yield Promise.resolve(anyRes);
            log.debug(pk.longName, ' ends');
            yield afterHandlersFor(pk.longName);
        });
    }
    function beforeHandlersFor(name) {
        return runPackagesAsync(beforePackages[name] ? beforePackages[name] : []);
    }
    function afterHandlersFor(name) {
        return runPackagesAsync(afterPackages[name] ? afterPackages[name] : []);
    }
    return runPackagesSync(numberTypePrio);
}
exports.orderPackages = orderPackages;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS1wcmlvcml0eS1oZWxwZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9wYWNrYWdlLXByaW9yaXR5LWhlbHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QjtBQUc1QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFFakUsTUFBTSxhQUFhLEdBQTRCLEVBQUUsQ0FBQztBQUNsRCxNQUFNLGNBQWMsR0FBRyx3QkFBd0IsQ0FBQztBQUdoRCxpQ0FBaUM7QUFDakMsU0FBZ0IsYUFBYSxDQUFDLFFBQTJCLEVBQUUsR0FBb0MsRUFBRSxnQkFBeUI7SUFDekgsTUFBTSxjQUFjLEdBQXNCLEVBQUUsQ0FBQztJQUM3QyxNQUFNLGNBQWMsR0FBdUMsRUFBRSxDQUFDO0lBQzlELE1BQU0sYUFBYSxHQUF1QyxFQUFFLENBQUM7SUFDN0QsSUFBSSxnQkFBZ0IsSUFBSSxJQUFJO1FBQzNCLGdCQUFnQixHQUFHLFVBQVUsQ0FBQztJQUMvQixRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQ3JCLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLGdCQUFpQixDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDeEI7YUFBTSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDaEMsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDO29CQUM5RCxFQUFFLENBQUMsUUFB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QyxFQUFFLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sZ0JBQWdCLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7S0FBQTtJQUVELFNBQVMsaUJBQWlCLENBQUMsSUFBWTtRQUN0QyxPQUFPLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFZO1FBQ3JDLE9BQU8sZ0JBQWdCLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRCxPQUFPLGVBQWUsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBM0VELHNDQTJFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBQYWNrYWdlTm9kZUluc3RhbmNlIGZyb20gJy4vcGFja2FnZU5vZGVJbnN0YW5jZSc7XG5pbXBvcnQgUGFja2FnZUJyb3dzZXJJbnN0YW5jZSBmcm9tICcuL2J1aWxkLXV0aWwvdHMvcGFja2FnZS1pbnN0YW5jZSc7XG5jb25zdCBsb2cgPSByZXF1aXJlKCdsb2c0anMnKS5nZXRMb2dnZXIoJ3BhY2thZ2VQcmlvcml0eUhlbHBlcicpO1xuXG5jb25zdCBiZWZvcmVPckFmdGVyOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSA9IHt9O1xuY29uc3QgcHJpb3JpdHlTdHJSZWcgPSAvKGJlZm9yZXxhZnRlcilcXHMrKFxcUyspLztcbmV4cG9ydCB0eXBlIFBhY2thZ2VJbnN0YW5jZSA9IFBhY2thZ2VCcm93c2VySW5zdGFuY2UgfCBQYWNrYWdlTm9kZUluc3RhbmNlO1xuXG4vLyB0c2xpbnQ6ZGlzYWJsZSBtYXgtbGluZS1sZW5ndGhcbmV4cG9ydCBmdW5jdGlvbiBvcmRlclBhY2thZ2VzKHBhY2thZ2VzOiBQYWNrYWdlSW5zdGFuY2VbXSwgcnVuOiAoLi4uYXJnOiBhbnlbXSkgPT4gUHJvbWlzZTxhbnk+LCBwcmlvcml0eVByb3BlcnR5Pzogc3RyaW5nKSB7XG5cdGNvbnN0IG51bWJlclR5cGVQcmlvOiBQYWNrYWdlSW5zdGFuY2VbXSA9IFtdO1xuXHRjb25zdCBiZWZvcmVQYWNrYWdlczoge1trZXk6IHN0cmluZ106IFBhY2thZ2VJbnN0YW5jZVtdfSA9IHt9O1xuXHRjb25zdCBhZnRlclBhY2thZ2VzOiB7W2tleTogc3RyaW5nXTogUGFja2FnZUluc3RhbmNlW119ID0ge307XG5cdGlmIChwcmlvcml0eVByb3BlcnR5ID09IG51bGwpXG5cdFx0cHJpb3JpdHlQcm9wZXJ0eSA9ICdwcmlvcml0eSc7XG5cdHBhY2thZ2VzLmZvckVhY2gocGsgPT4ge1xuXHRcdGNvbnN0IHByaW9yaXR5ID0gXy5nZXQocGssIHByaW9yaXR5UHJvcGVydHkhKTtcblx0XHRpZiAoXy5pc051bWJlcihwcmlvcml0eSkpIHtcblx0XHRcdG51bWJlclR5cGVQcmlvLnB1c2gocGspO1xuXHRcdH0gZWxzZSBpZiAoXy5pc1N0cmluZyhwcmlvcml0eSkpIHtcblx0XHRcdGNvbnN0IHJlcyA9IHByaW9yaXR5U3RyUmVnLmV4ZWMocHJpb3JpdHkpO1xuXHRcdFx0aWYgKCFyZXMpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGZvcm1hdCBvZiBwYWNrYWdlLmpzb24gLSBwcmlvcml0eSBpbiAnICtcblx0XHRcdFx0XHRway5sb25nTmFtZSArICc6ICcgKyBwcmlvcml0eSk7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCB0YXJnZXRQYWNrYWdlTmFtZSA9IHJlc1syXTtcblx0XHRcdGlmIChyZXNbMV0gPT09ICdiZWZvcmUnKSB7XG5cdFx0XHRcdGlmICghYmVmb3JlUGFja2FnZXNbdGFyZ2V0UGFja2FnZU5hbWVdKSB7XG5cdFx0XHRcdFx0YmVmb3JlUGFja2FnZXNbdGFyZ2V0UGFja2FnZU5hbWVdID0gW107XG5cdFx0XHRcdFx0YmVmb3JlT3JBZnRlclt0YXJnZXRQYWNrYWdlTmFtZV0gPSAxOyAvLyB0cmFjayB0YXJnZXQgcGFja2FnZVxuXHRcdFx0XHR9XG5cdFx0XHRcdGJlZm9yZVBhY2thZ2VzW3RhcmdldFBhY2thZ2VOYW1lXS5wdXNoKHBrKTtcblx0XHRcdH0gZWxzZSBpZiAocmVzWzFdID09PSAnYWZ0ZXInKSB7XG5cdFx0XHRcdGlmICghYWZ0ZXJQYWNrYWdlc1t0YXJnZXRQYWNrYWdlTmFtZV0pIHtcblx0XHRcdFx0XHRhZnRlclBhY2thZ2VzW3RhcmdldFBhY2thZ2VOYW1lXSA9IFtdO1xuXHRcdFx0XHRcdGJlZm9yZU9yQWZ0ZXJbdGFyZ2V0UGFja2FnZU5hbWVdID0gMTsgLy8gdHJhY2sgdGFyZ2V0IHBhY2thZ2Vcblx0XHRcdFx0fVxuXHRcdFx0XHRhZnRlclBhY2thZ2VzW3RhcmdldFBhY2thZ2VOYW1lXS5wdXNoKHBrKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Xy5zZXQocGssIHByaW9yaXR5UHJvcGVydHkhLCA1MDAwKTtcblx0XHRcdG51bWJlclR5cGVQcmlvLnB1c2gocGspO1xuXHRcdH1cblx0fSk7XG5cblx0bnVtYmVyVHlwZVByaW8uc29ydChmdW5jdGlvbihwazEsIHBrMikge1xuXHRcdHJldHVybiBfLmdldChwazIsIHByaW9yaXR5UHJvcGVydHkhKSAtIF8uZ2V0KHBrMSwgcHJpb3JpdHlQcm9wZXJ0eSEpO1xuXHR9KTtcblxuXHRjb25zdCBub3RGb3VuZCA9IF8uZGlmZmVyZW5jZShfLmtleXMoYmVmb3JlT3JBZnRlciksIF8ubWFwKHBhY2thZ2VzLCBwayA9PiBway5sb25nTmFtZSkpO1xuXHRpZiAobm90Rm91bmQubGVuZ3RoID4gMCkge1xuXHRcdGNvbnN0IGVyciA9ICdQcmlvcml0eSBkZXBlbmRlZCBwYWNrYWdlcyBhcmUgbm90IGZvdW5kOiAnICsgIG5vdEZvdW5kO1xuXHRcdGxvZy5lcnJvcihlcnIpO1xuXHRcdHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoZXJyKSk7XG5cdH1cblxuXHRhc3luYyBmdW5jdGlvbiBydW5QYWNrYWdlc1N5bmMocGFja2FnZXM6IFBhY2thZ2VJbnN0YW5jZVtdKSB7XG5cdFx0Zm9yIChjb25zdCBwayBvZiBwYWNrYWdlcykge1xuXHRcdFx0YXdhaXQgcnVuUGFja2FnZShwayk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gcnVuUGFja2FnZXNBc3luYyhwYWNrYWdlczogUGFja2FnZUluc3RhbmNlW10pIHtcblx0XHRyZXR1cm4gUHJvbWlzZS5hbGwocGFja2FnZXMubWFwKHJ1blBhY2thZ2UpKTtcblx0fVxuXG5cdGFzeW5jIGZ1bmN0aW9uIHJ1blBhY2thZ2UocGs6IFBhY2thZ2VJbnN0YW5jZSkge1xuXHRcdGF3YWl0IGJlZm9yZUhhbmRsZXJzRm9yKHBrLmxvbmdOYW1lKTtcblx0XHRsb2cuZGVidWcocGsubG9uZ05hbWUsICcgc3RhcnRzIHdpdGggcHJpb3JpdHk6ICcsIF8uZ2V0KHBrLCBwcmlvcml0eVByb3BlcnR5ISkpO1xuXHRcdGNvbnN0IGFueVJlcyA9IHJ1bihwayk7XG5cdFx0YXdhaXQgUHJvbWlzZS5yZXNvbHZlKGFueVJlcyk7XG5cdFx0bG9nLmRlYnVnKHBrLmxvbmdOYW1lLCAnIGVuZHMnKTtcblx0XHRhd2FpdCBhZnRlckhhbmRsZXJzRm9yKHBrLmxvbmdOYW1lKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGJlZm9yZUhhbmRsZXJzRm9yKG5hbWU6IHN0cmluZykge1xuXHRcdHJldHVybiBydW5QYWNrYWdlc0FzeW5jKGJlZm9yZVBhY2thZ2VzW25hbWVdID8gYmVmb3JlUGFja2FnZXNbbmFtZV0gOiBbXSk7XG5cdH1cblxuXHRmdW5jdGlvbiBhZnRlckhhbmRsZXJzRm9yKG5hbWU6IHN0cmluZykge1xuXHRcdHJldHVybiBydW5QYWNrYWdlc0FzeW5jKGFmdGVyUGFja2FnZXNbbmFtZV0gPyBhZnRlclBhY2thZ2VzW25hbWVdIDogW10pO1xuXHR9XG5cblx0cmV0dXJuIHJ1blBhY2thZ2VzU3luYyhudW1iZXJUeXBlUHJpbyk7XG59XG4iXX0=