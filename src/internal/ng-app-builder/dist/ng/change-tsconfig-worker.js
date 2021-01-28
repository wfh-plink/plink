"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const common_1 = require("./common");
const injector_setup_1 = require("./injector-setup");
const mem_stats_1 = __importDefault(require("@wfh/plink/wfh/dist/utils/mem-stats"));
const { tsconfigFile, reportDir, config, ngOptions, packageInfo, deployUrl, baseHref, drcpBuilderOptions } = worker_threads_1.workerData;
// tslint:disable: no-console
// console.log(workerData);
mem_stats_1.default();
common_1.initCli(drcpBuilderOptions)
    .then((drcpConfig) => {
    injector_setup_1.injectorSetup(deployUrl, baseHref);
    const create = require('./change-tsconfig').createTsConfig;
    const content = create(tsconfigFile, ngOptions, config, packageInfo, reportDir);
    worker_threads_1.parentPort.postMessage({ log: mem_stats_1.default() });
    worker_threads_1.parentPort.postMessage({ result: content });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlLXRzY29uZmlnLXdvcmtlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNoYW5nZS10c2NvbmZpZy13b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxtREFBc0Q7QUFFdEQscUNBQXFEO0FBQ3JELHFEQUErQztBQUcvQyxvRkFBMkQ7QUFhM0QsTUFBTSxFQUNKLFlBQVksRUFDWixTQUFTLEVBQ1QsTUFBTSxFQUNOLFNBQVMsRUFDVCxXQUFXLEVBQ1gsU0FBUyxFQUNULFFBQVEsRUFDUixrQkFBa0IsRUFDbkIsR0FBRywyQkFBa0IsQ0FBQztBQUV2Qiw2QkFBNkI7QUFDN0IsMkJBQTJCO0FBQzNCLG1CQUFRLEVBQUUsQ0FBQztBQUNYLGdCQUFPLENBQUMsa0JBQWtCLENBQUM7S0FDMUIsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7SUFDbkIsOEJBQWEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbkMsTUFBTSxNQUFNLEdBQTBCLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLGNBQWMsQ0FBQztJQUNsRixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRWhGLDJCQUFXLENBQUMsV0FBVyxDQUFDLEVBQUMsR0FBRyxFQUFFLG1CQUFRLEVBQUUsRUFBQyxDQUFDLENBQUM7SUFDM0MsMkJBQVcsQ0FBQyxXQUFXLENBQUMsRUFBQyxNQUFNLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztBQUM3QyxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cGFyZW50UG9ydCwgd29ya2VyRGF0YX0gZnJvbSAnd29ya2VyX3RocmVhZHMnO1xuaW1wb3J0IHtjcmVhdGVUc0NvbmZpZywgUGFyaWFsQnJvd3Nlck9wdGlvbnN9IGZyb20gJy4vY2hhbmdlLXRzY29uZmlnJztcbmltcG9ydCB7aW5pdENsaSwgRHJjcEJ1aWxkZXJPcHRpb25zfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQge2luamVjdG9yU2V0dXB9IGZyb20gJy4vaW5qZWN0b3Itc2V0dXAnO1xuaW1wb3J0IHsgRHJjcFNldHRpbmcgfSBmcm9tICcuLi9jb25maWd1cmFibGUnO1xuaW1wb3J0IHtQYWNrYWdlSW5mb30gZnJvbSAnQHdmaC9wbGluay93ZmgvZGlzdC9wYWNrYWdlLW1nci9wYWNrYWdlLWluZm8tZ2F0aGVyaW5nJztcbmltcG9ydCBtZW1zdGF0cyBmcm9tICdAd2ZoL3BsaW5rL3dmaC9kaXN0L3V0aWxzL21lbS1zdGF0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YSB7XG4gIHRzY29uZmlnRmlsZTogc3RyaW5nO1xuICByZXBvcnREaXI6IHN0cmluZztcbiAgY29uZmlnOiBEcmNwU2V0dGluZztcbiAgbmdPcHRpb25zOiBQYXJpYWxCcm93c2VyT3B0aW9ucztcbiAgcGFja2FnZUluZm86IFBhY2thZ2VJbmZvO1xuICBkZXBsb3lVcmw6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgYmFzZUhyZWY/OiBzdHJpbmc7XG4gIGRyY3BCdWlsZGVyT3B0aW9uczogRHJjcEJ1aWxkZXJPcHRpb25zO1xufVxuXG5jb25zdCB7XG4gIHRzY29uZmlnRmlsZSxcbiAgcmVwb3J0RGlyLFxuICBjb25maWcsXG4gIG5nT3B0aW9ucyxcbiAgcGFja2FnZUluZm8sXG4gIGRlcGxveVVybCxcbiAgYmFzZUhyZWYsXG4gIGRyY3BCdWlsZGVyT3B0aW9uc1xufSA9IHdvcmtlckRhdGEgYXMgRGF0YTtcblxuLy8gdHNsaW50OmRpc2FibGU6IG5vLWNvbnNvbGVcbi8vIGNvbnNvbGUubG9nKHdvcmtlckRhdGEpO1xubWVtc3RhdHMoKTtcbmluaXRDbGkoZHJjcEJ1aWxkZXJPcHRpb25zKVxuLnRoZW4oKGRyY3BDb25maWcpID0+IHtcbiAgaW5qZWN0b3JTZXR1cChkZXBsb3lVcmwsIGJhc2VIcmVmKTtcbiAgY29uc3QgY3JlYXRlOiB0eXBlb2YgY3JlYXRlVHNDb25maWcgPSByZXF1aXJlKCcuL2NoYW5nZS10c2NvbmZpZycpLmNyZWF0ZVRzQ29uZmlnO1xuICBjb25zdCBjb250ZW50ID0gY3JlYXRlKHRzY29uZmlnRmlsZSwgbmdPcHRpb25zLCBjb25maWcsIHBhY2thZ2VJbmZvLCByZXBvcnREaXIpO1xuXG4gIHBhcmVudFBvcnQhLnBvc3RNZXNzYWdlKHtsb2c6IG1lbXN0YXRzKCl9KTtcbiAgcGFyZW50UG9ydCEucG9zdE1lc3NhZ2Uoe3Jlc3VsdDogY29udGVudH0pO1xufSk7XG4iXX0=