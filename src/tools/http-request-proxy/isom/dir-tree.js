"use strict";
/**
 * Basically it is a copy of require-injector/dist/dir-tree, but for browser side
 * and not related to local file system, as a pure data structure
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const has_1 = tslib_1.__importDefault(require("lodash/has"));
const repeat_1 = tslib_1.__importDefault(require("lodash/repeat"));
const each_1 = tslib_1.__importDefault(require("lodash/each"));
class DirTree {
    constructor(caseSensitive = false) {
        this.caseSensitive = caseSensitive;
        this.root = { map: {}, name: '' };
    }
    putData(path, data) {
        var tree = this.ensureNode(path);
        tree.data = data;
    }
    getData(path) {
        var tree = this.findNode(path);
        return tree ? tree.data : null;
    }
    /**
     * @return Array of data
     */
    getAllData(path) {
        if (!Array.isArray(path)) {
            if (this.caseSensitive)
                path = path.toLowerCase();
            return this.getAllData(path.replace(/\\/g, '/').split('/'));
        }
        var tree = this.root;
        var datas = [];
        if (has_1.default(tree, 'data'))
            datas.push(tree.data);
        path.every(name => {
            if (has_1.default(tree, ['map', name])) {
                tree = tree.map[name];
                if (has_1.default(tree, 'data'))
                    datas.push(tree.data);
                return true;
            }
            tree = null;
            return false;
        });
        return datas;
    }
    ensureNode(path) {
        if (!Array.isArray(path)) {
            if (this.caseSensitive)
                path = path.toLowerCase();
            return this.ensureNode(path.replace(/\\/g, '/').split('/'));
        }
        var tree = this.root;
        each_1.default(path, name => {
            if (has_1.default(tree, ['map', name])) {
                tree = tree.map[name];
            }
            else {
                var child = { map: {}, name };
                tree.map[name] = child;
                tree = child;
            }
        });
        return tree;
    }
    findNode(path) {
        if (!Array.isArray(path)) {
            if (this.caseSensitive)
                path = path.toLowerCase();
            return this.findNode(path.replace(/\\/g, '/').split('/'));
        }
        var tree = this.root;
        path.every(name => {
            if (has_1.default(tree, ['map', name])) {
                tree = tree.map[name];
                return true;
            }
            tree = null;
            return false;
        });
        return tree;
    }
    traverse(level = 0, tree, lines) {
        var isRoot = false;
        if (!tree)
            tree = this.root;
        if (!lines) {
            isRoot = true;
            lines = [];
        }
        var indent = repeat_1.default('│  ', level);
        lines.push(indent + '├─ ' + tree.name + (tree.data ? ' [x]' : ''));
        each_1.default(tree.map, (subTree) => {
            this.traverse(level + 1, subTree, lines);
        });
        return isRoot ? lines.join('\n') : lines;
    }
    toString() {
        return this.traverse();
    }
}
exports.DirTree = DirTree;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHIvaHR0cC1yZXF1ZXN0LXByb3h5L2lzb20vZGlyLXRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBRUgsNkRBQThCO0FBQzlCLG1FQUFvQztBQUNwQywrREFBZ0M7QUFPaEMsTUFBYSxPQUFPO0lBR25CLFlBQW9CLGdCQUFnQixLQUFLO1FBQXJCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBRnpDLFNBQUksR0FBZ0IsRUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUMsQ0FBQztJQUVJLENBQUM7SUFFN0MsT0FBTyxDQUFDLElBQVksRUFBRSxJQUFPO1FBQzVCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUFZO1FBQ25CLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNoQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxVQUFVLENBQUMsSUFBdUI7UUFDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDekIsSUFBSSxJQUFJLENBQUMsYUFBYTtnQkFDckIsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDNUQ7UUFDRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3JC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QUM7UUFDbkIsSUFBSSxDQUFDLElBQUk7WUFDUixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1gsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNkLEtBQUssR0FBRyxFQUFFLENBQUM7U0FDWDtRQUNELElBQUksTUFBTSxHQUFHLGdCQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25DLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25FLGNBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDMUMsQ0FBQztJQUVELFFBQVE7UUFDUCxPQUFPLElBQUksQ0FBQyxRQUFRLEVBQVksQ0FBQztJQUNsQyxDQUFDO0NBQ0Q7QUFqR0QsMEJBaUdDIiwiZmlsZSI6Im5vZGVfbW9kdWxlcy9AZHIvaHR0cC1yZXF1ZXN0LXByb3h5L2lzb20vZGlyLXRyZWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEJhc2ljYWxseSBpdCBpcyBhIGNvcHkgb2YgcmVxdWlyZS1pbmplY3Rvci9kaXN0L2Rpci10cmVlLCBidXQgZm9yIGJyb3dzZXIgc2lkZVxuICogYW5kIG5vdCByZWxhdGVkIHRvIGxvY2FsIGZpbGUgc3lzdGVtLCBhcyBhIHB1cmUgZGF0YSBzdHJ1Y3R1cmVcbiAqL1xuXG5pbXBvcnQgX2hhcyBmcm9tICdsb2Rhc2gvaGFzJztcbmltcG9ydCBfcmVwZWF0IGZyb20gJ2xvZGFzaC9yZXBlYXQnO1xuaW1wb3J0IF9lYWNoIGZyb20gJ2xvZGFzaC9lYWNoJztcblxuZXhwb3J0IGludGVyZmFjZSBUcmVlTm9kZTxUPiB7XG5cdG1hcDoge1tjaGlsZDogc3RyaW5nXTogVHJlZU5vZGU8VD59O1xuXHRuYW1lOiBzdHJpbmc7XG5cdGRhdGE/OiBUO1xufVxuZXhwb3J0IGNsYXNzIERpclRyZWU8VD4ge1xuXHRyb290OiBUcmVlTm9kZTxUPiA9IHttYXA6IHt9LCBuYW1lOiAnJ307XG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSBjYXNlU2Vuc2l0aXZlID0gZmFsc2UpIHt9XG5cblx0cHV0RGF0YShwYXRoOiBzdHJpbmcsIGRhdGE6IFQpIHtcblx0XHR2YXIgdHJlZSA9IHRoaXMuZW5zdXJlTm9kZShwYXRoKTtcblx0XHR0cmVlLmRhdGEgPSBkYXRhO1xuXHR9XG5cblx0Z2V0RGF0YShwYXRoOiBzdHJpbmcpOiBUIHtcblx0XHR2YXIgdHJlZSA9IHRoaXMuZmluZE5vZGUocGF0aCk7XG5cdFx0cmV0dXJuIHRyZWUgPyB0cmVlLmRhdGEgOiBudWxsO1xuXHR9XG5cblx0LyoqXG5cdCAqIEByZXR1cm4gQXJyYXkgb2YgZGF0YVxuXHQgKi9cblx0Z2V0QWxsRGF0YShwYXRoOiBzdHJpbmcgfCBzdHJpbmdbXSk6IFRbXSB7XG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KHBhdGgpKSB7XG5cdFx0XHRpZiAodGhpcy5jYXNlU2Vuc2l0aXZlKVxuXHRcdFx0XHRwYXRoID0gcGF0aC50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0QWxsRGF0YShwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5zcGxpdCgnLycpKTtcblx0XHR9XG5cdFx0dmFyIHRyZWUgPSB0aGlzLnJvb3Q7XG5cdFx0dmFyIGRhdGFzOiBUW10gPSBbXTtcblx0XHRpZiAoX2hhcyh0cmVlLCAnZGF0YScpKVxuXHRcdFx0ZGF0YXMucHVzaCh0cmVlLmRhdGEpO1xuXHRcdHBhdGguZXZlcnkobmFtZSA9PiB7XG5cdFx0XHRpZiAoX2hhcyh0cmVlLCBbJ21hcCcsIG5hbWVdKSkge1xuXHRcdFx0XHR0cmVlID0gdHJlZS5tYXBbbmFtZV07XG5cdFx0XHRcdGlmIChfaGFzKHRyZWUsICdkYXRhJykpXG5cdFx0XHRcdFx0ZGF0YXMucHVzaCh0cmVlLmRhdGEpO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdHRyZWUgPSBudWxsO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0pO1xuXHRcdHJldHVybiBkYXRhcztcblx0fVxuXG5cdGVuc3VyZU5vZGUocGF0aDogc3RyaW5nIHwgc3RyaW5nW10pOiBUcmVlTm9kZTxUPiB7XG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KHBhdGgpKSB7XG5cdFx0XHRpZiAodGhpcy5jYXNlU2Vuc2l0aXZlKVxuXHRcdFx0XHRwYXRoID0gcGF0aC50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0cmV0dXJuIHRoaXMuZW5zdXJlTm9kZShwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5zcGxpdCgnLycpKTtcblx0XHR9XG5cdFx0dmFyIHRyZWUgPSB0aGlzLnJvb3Q7XG5cdFx0X2VhY2gocGF0aCwgbmFtZSA9PiB7XG5cdFx0XHRpZiAoX2hhcyh0cmVlLCBbJ21hcCcsIG5hbWVdKSkge1xuXHRcdFx0XHR0cmVlID0gdHJlZS5tYXBbbmFtZV07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgY2hpbGQgPSB7bWFwOiB7fSwgbmFtZX07XG5cdFx0XHRcdHRyZWUubWFwW25hbWVdID0gY2hpbGQ7XG5cdFx0XHRcdHRyZWUgPSBjaGlsZDtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gdHJlZTtcblx0fVxuXG5cdGZpbmROb2RlKHBhdGg6IHN0cmluZyB8IHN0cmluZ1tdKTogVHJlZU5vZGU8VD4ge1xuXHRcdGlmICghQXJyYXkuaXNBcnJheShwYXRoKSkge1xuXHRcdFx0aWYgKHRoaXMuY2FzZVNlbnNpdGl2ZSlcblx0XHRcdFx0cGF0aCA9IHBhdGgudG9Mb3dlckNhc2UoKTtcblx0XHRcdHJldHVybiB0aGlzLmZpbmROb2RlKHBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpLnNwbGl0KCcvJykpO1xuXHRcdH1cblx0XHR2YXIgdHJlZSA9IHRoaXMucm9vdDtcblx0XHRwYXRoLmV2ZXJ5KG5hbWUgPT4ge1xuXHRcdFx0aWYgKF9oYXModHJlZSwgWydtYXAnLCBuYW1lXSkpIHtcblx0XHRcdFx0dHJlZSA9IHRyZWUubWFwW25hbWVdO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdHRyZWUgPSBudWxsO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0pO1xuXHRcdHJldHVybiB0cmVlO1xuXHR9XG5cblx0dHJhdmVyc2UobGV2ZWw6IG51bWJlciA9IDAsIHRyZWU/OiBUcmVlTm9kZTxUPiwgbGluZXM/OiBzdHJpbmdbXSkge1xuXHRcdHZhciBpc1Jvb3QgPSBmYWxzZTtcblx0XHRpZiAoIXRyZWUpXG5cdFx0XHR0cmVlID0gdGhpcy5yb290O1xuXHRcdGlmICghbGluZXMpIHtcblx0XHRcdGlzUm9vdCA9IHRydWU7XG5cdFx0XHRsaW5lcyA9IFtdO1xuXHRcdH1cblx0XHR2YXIgaW5kZW50ID0gX3JlcGVhdCgn4pSCICAnLCBsZXZlbCk7XG5cdFx0bGluZXMucHVzaChpbmRlbnQgKyAn4pSc4pSAICcgKyB0cmVlLm5hbWUgKyAodHJlZS5kYXRhID8gJyBbeF0nIDogJycpKTtcblx0XHRfZWFjaCh0cmVlLm1hcCwgKHN1YlRyZWUpID0+IHtcblx0XHRcdHRoaXMudHJhdmVyc2UobGV2ZWwgKyAxLCBzdWJUcmVlLCBsaW5lcyk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGlzUm9vdCA/IGxpbmVzLmpvaW4oJ1xcbicpIDogbGluZXM7XG5cdH1cblxuXHR0b1N0cmluZygpIHtcblx0XHRyZXR1cm4gdGhpcy50cmF2ZXJzZSgpIGFzIHN0cmluZztcblx0fVxufVxuIl19