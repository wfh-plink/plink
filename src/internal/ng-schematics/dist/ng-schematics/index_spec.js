"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const schematics_1 = require("@angular-devkit/schematics");
const testing_1 = require("@angular-devkit/schematics/testing");
const path = tslib_1.__importStar(require("path"));
const collectionPath = path.join(__dirname, '../collection.json');
describe('ng-schematics', () => {
    it('works', () => {
        const runner = new testing_1.SchematicTestRunner('schematics', collectionPath);
        const tree = runner.runSchematic('ng-schematics', {}, schematics_1.Tree.empty());
        expect(tree.files).toEqual([]);
    });
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHIvbmctc2NoZW1hdGljcy9zcmMvbmctc2NoZW1hdGljcy9pbmRleF9zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJEQUFrRDtBQUNsRCxnRUFBeUU7QUFDekUsbURBQTZCO0FBRzdCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLG9CQUFvQixDQUFDLENBQUM7QUFHbEUsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7UUFDZixNQUFNLE1BQU0sR0FBRyxJQUFJLDZCQUFtQixDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNyRSxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxFQUFFLEVBQUUsaUJBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRXBFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2pDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoibm9kZV9tb2R1bGVzL0Bkci9uZy1zY2hlbWF0aWNzL2Rpc3Qvbmctc2NoZW1hdGljcy9pbmRleF9zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHJlZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IFNjaGVtYXRpY1Rlc3RSdW5uZXIgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90ZXN0aW5nJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cblxuY29uc3QgY29sbGVjdGlvblBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vY29sbGVjdGlvbi5qc29uJyk7XG5cblxuZGVzY3JpYmUoJ25nLXNjaGVtYXRpY3MnLCAoKSA9PiB7XG4gIGl0KCd3b3JrcycsICgpID0+IHtcbiAgICBjb25zdCBydW5uZXIgPSBuZXcgU2NoZW1hdGljVGVzdFJ1bm5lcignc2NoZW1hdGljcycsIGNvbGxlY3Rpb25QYXRoKTtcbiAgICBjb25zdCB0cmVlID0gcnVubmVyLnJ1blNjaGVtYXRpYygnbmctc2NoZW1hdGljcycsIHt9LCBUcmVlLmVtcHR5KCkpO1xuXG4gICAgZXhwZWN0KHRyZWUuZmlsZXMpLnRvRXF1YWwoW10pO1xuICB9KTtcbn0pO1xuIl19
