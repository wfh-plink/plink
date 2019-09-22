"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* tslint:disable max-line-length no-console */
const parse_app_module_1 = tslib_1.__importStar(require("../utils/parse-app-module"));
const fs_1 = require("fs");
const path_1 = require("path");
class TestableParser extends parse_app_module_1.default {
    _findEsImportByName(name) {
        return super.findEsImportByName(name);
    }
}
xdescribe('parse-app-module', () => {
    let parser;
    let source;
    let patched;
    beforeAll(() => {
        parser = new TestableParser();
        source = fs_1.readFileSync(path_1.resolve(__dirname, '../../ts/spec/app.module.ts.txt'), 'utf8');
    });
    it('should can find out NgModule', () => {
        expect(source.indexOf('from \'@bk/module-user\'')).toBeGreaterThan(0);
        expect(source.indexOf('from \'@bk/module-real-name\'')).toBeGreaterThan(0);
        expect(source.indexOf('from \'@bk/module-apply/apply-lazy.module\'')).toBeGreaterThan(0);
        patched = parser.patchFile('app.module.ts', source, [
            '@bk/module-user#UserModule',
            '@bk/module-real-name#RealNameModule',
            '@bk/module-apply/apply-lazy.module#ApplyLazyModule'
        ], [
            '@bk/foobar#milk',
            '@bk/foobar#water',
            'foobar#tea'
        ]);
        expect(parser._findEsImportByName('_.get').from).toBe('lodash');
        expect(parser._findEsImportByName('env').from).toBe('@bk/env/environment');
        const keys = [];
        for (const k of parser.esImportsMap.keys()) {
            // console.log(parser.esImportsMap.get(k));
            keys.push(k);
        }
        console.log(patched);
        // expect(keys).toBe([]);
    });
    it('should remove dynamic modules', () => {
        expect(patched).not.toContain('from \'@bk/module-user\'');
        expect(patched).not.toContain('from \'@bk/module-real-name\'');
        expect(patched).not.toContain('from \'@bk/module-apply/apply-lazy.module\'');
    });
    it('should can add new modules', () => {
        expect(patched).toMatch(/milk_0,\s*water_1,\s*tea_2/);
        expect(patched).toContain('import {milk as milk_0, water as water_1} from \'@bk/foobar\';');
        expect(patched).toContain('import {tea as tea_2} from \'foobar\';');
    });
    it('should can locate app.module.ts file from main.ts', () => {
        expect(parse_app_module_1.findAppModuleFileFromMain(path_1.resolve(__dirname, '../../ts/spec/main-test.ts.txt')))
            .toBe(path_1.resolve(__dirname, '../../ts/spec/app/app.module.ts'));
    });
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHItY29yZS9uZy1hcHAtYnVpbGRlci90cy9zcGVjL3BhcnNlLWFwcC1tb2R1bGVTcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtDQUErQztBQUMvQyxzRkFBcUY7QUFDckYsMkJBQWdDO0FBQ2hDLCtCQUE2QjtBQUU3QixNQUFNLGNBQWUsU0FBUSwwQkFBZTtJQUMxQyxtQkFBbUIsQ0FBQyxJQUFZO1FBQzlCLE9BQU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQUVELFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7SUFDakMsSUFBSSxNQUFzQixDQUFDO0lBQzNCLElBQUksTUFBYyxDQUFDO0lBQ25CLElBQUksT0FBZSxDQUFDO0lBRXBCLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixNQUFNLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUM5QixNQUFNLEdBQUcsaUJBQVksQ0FBQyxjQUFPLENBQUMsU0FBUyxFQUFFLGlDQUFpQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdkYsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1FBQ3RDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLE9BQU8sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQ2hEO1lBQ0UsNEJBQTRCO1lBQzVCLHFDQUFxQztZQUNyQyxvREFBb0Q7U0FDckQsRUFBRTtZQUNELGlCQUFpQjtZQUNqQixrQkFBa0I7WUFDbEIsWUFBWTtTQUNiLENBQUMsQ0FBQztRQUNMLE1BQU0sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDNUUsTUFBTSxJQUFJLEdBQWEsRUFBRSxDQUFDO1FBQzFCLEtBQUssTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUMxQywyQ0FBMkM7WUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNkO1FBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQix5QkFBeUI7SUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1FBQ3ZDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUMvRCxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO0lBQy9FLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtRQUNwQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDdEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxnRUFBZ0UsQ0FBQyxDQUFDO1FBQzVGLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsd0NBQXdDLENBQUMsQ0FBQztJQUN0RSxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxtREFBbUQsRUFBRSxHQUFHLEVBQUU7UUFDM0QsTUFBTSxDQUFDLDRDQUF5QixDQUFDLGNBQU8sQ0FBQyxTQUFTLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO2FBQ3RGLElBQUksQ0FBQyxjQUFPLENBQUMsU0FBUyxFQUFFLGlDQUFpQyxDQUFDLENBQUMsQ0FBQztJQUMvRCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6Im5vZGVfbW9kdWxlcy9AZHItY29yZS9uZy1hcHAtYnVpbGRlci9kaXN0L3NwZWMvcGFyc2UtYXBwLW1vZHVsZVNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZSBtYXgtbGluZS1sZW5ndGggbm8tY29uc29sZSAqL1xuaW1wb3J0IEFwcE1vZHVsZVBhcnNlciwge2ZpbmRBcHBNb2R1bGVGaWxlRnJvbU1haW59IGZyb20gJy4uL3V0aWxzL3BhcnNlLWFwcC1tb2R1bGUnO1xuaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gJ2ZzJztcbmltcG9ydCB7cmVzb2x2ZX0gZnJvbSAncGF0aCc7XG5cbmNsYXNzIFRlc3RhYmxlUGFyc2VyIGV4dGVuZHMgQXBwTW9kdWxlUGFyc2VyIHtcbiAgX2ZpbmRFc0ltcG9ydEJ5TmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gc3VwZXIuZmluZEVzSW1wb3J0QnlOYW1lKG5hbWUpO1xuICB9XG59XG5cbnhkZXNjcmliZSgncGFyc2UtYXBwLW1vZHVsZScsICgpID0+IHtcbiAgbGV0IHBhcnNlcjogVGVzdGFibGVQYXJzZXI7XG4gIGxldCBzb3VyY2U6IHN0cmluZztcbiAgbGV0IHBhdGNoZWQ6IHN0cmluZztcblxuICBiZWZvcmVBbGwoKCkgPT4ge1xuICAgIHBhcnNlciA9IG5ldyBUZXN0YWJsZVBhcnNlcigpO1xuICAgIHNvdXJjZSA9IHJlYWRGaWxlU3luYyhyZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uL3RzL3NwZWMvYXBwLm1vZHVsZS50cy50eHQnKSwgJ3V0ZjgnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBjYW4gZmluZCBvdXQgTmdNb2R1bGUnLCAoKSA9PiB7XG4gICAgZXhwZWN0KHNvdXJjZS5pbmRleE9mKCdmcm9tIFxcJ0Biay9tb2R1bGUtdXNlclxcJycpKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgZXhwZWN0KHNvdXJjZS5pbmRleE9mKCdmcm9tIFxcJ0Biay9tb2R1bGUtcmVhbC1uYW1lXFwnJykpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICBleHBlY3Qoc291cmNlLmluZGV4T2YoJ2Zyb20gXFwnQGJrL21vZHVsZS1hcHBseS9hcHBseS1sYXp5Lm1vZHVsZVxcJycpKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgcGF0Y2hlZCA9IHBhcnNlci5wYXRjaEZpbGUoJ2FwcC5tb2R1bGUudHMnLCBzb3VyY2UsXG4gICAgICBbXG4gICAgICAgICdAYmsvbW9kdWxlLXVzZXIjVXNlck1vZHVsZScsXG4gICAgICAgICdAYmsvbW9kdWxlLXJlYWwtbmFtZSNSZWFsTmFtZU1vZHVsZScsXG4gICAgICAgICdAYmsvbW9kdWxlLWFwcGx5L2FwcGx5LWxhenkubW9kdWxlI0FwcGx5TGF6eU1vZHVsZSdcbiAgICAgIF0sIFtcbiAgICAgICAgJ0Biay9mb29iYXIjbWlsaycsXG4gICAgICAgICdAYmsvZm9vYmFyI3dhdGVyJyxcbiAgICAgICAgJ2Zvb2JhciN0ZWEnXG4gICAgICBdKTtcbiAgICBleHBlY3QocGFyc2VyLl9maW5kRXNJbXBvcnRCeU5hbWUoJ18uZ2V0JykhLmZyb20pLnRvQmUoJ2xvZGFzaCcpO1xuICAgIGV4cGVjdChwYXJzZXIuX2ZpbmRFc0ltcG9ydEJ5TmFtZSgnZW52JykhLmZyb20pLnRvQmUoJ0Biay9lbnYvZW52aXJvbm1lbnQnKTtcbiAgICBjb25zdCBrZXlzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgayBvZiBwYXJzZXIuZXNJbXBvcnRzTWFwLmtleXMoKSkge1xuICAgICAgLy8gY29uc29sZS5sb2cocGFyc2VyLmVzSW1wb3J0c01hcC5nZXQoaykpO1xuICAgICAga2V5cy5wdXNoKGspO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhwYXRjaGVkKTtcbiAgICAvLyBleHBlY3Qoa2V5cykudG9CZShbXSk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgcmVtb3ZlIGR5bmFtaWMgbW9kdWxlcycsICgpID0+IHtcbiAgICBleHBlY3QocGF0Y2hlZCkubm90LnRvQ29udGFpbignZnJvbSBcXCdAYmsvbW9kdWxlLXVzZXJcXCcnKTtcbiAgICBleHBlY3QocGF0Y2hlZCkubm90LnRvQ29udGFpbignZnJvbSBcXCdAYmsvbW9kdWxlLXJlYWwtbmFtZVxcJycpO1xuICAgIGV4cGVjdChwYXRjaGVkKS5ub3QudG9Db250YWluKCdmcm9tIFxcJ0Biay9tb2R1bGUtYXBwbHkvYXBwbHktbGF6eS5tb2R1bGVcXCcnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBjYW4gYWRkIG5ldyBtb2R1bGVzJywgKCkgPT4ge1xuICAgIGV4cGVjdChwYXRjaGVkKS50b01hdGNoKC9taWxrXzAsXFxzKndhdGVyXzEsXFxzKnRlYV8yLyk7XG4gICAgZXhwZWN0KHBhdGNoZWQpLnRvQ29udGFpbignaW1wb3J0IHttaWxrIGFzIG1pbGtfMCwgd2F0ZXIgYXMgd2F0ZXJfMX0gZnJvbSBcXCdAYmsvZm9vYmFyXFwnOycpO1xuICAgIGV4cGVjdChwYXRjaGVkKS50b0NvbnRhaW4oJ2ltcG9ydCB7dGVhIGFzIHRlYV8yfSBmcm9tIFxcJ2Zvb2JhclxcJzsnKTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCBjYW4gbG9jYXRlIGFwcC5tb2R1bGUudHMgZmlsZSBmcm9tIG1haW4udHMnLCAoKSA9PiB7XG4gICAgZXhwZWN0KGZpbmRBcHBNb2R1bGVGaWxlRnJvbU1haW4ocmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi90cy9zcGVjL21haW4tdGVzdC50cy50eHQnKSkpXG4gICAgLnRvQmUocmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi90cy9zcGVjL2FwcC9hcHAubW9kdWxlLnRzJykpO1xuICB9KTtcbn0pO1xuIl19
