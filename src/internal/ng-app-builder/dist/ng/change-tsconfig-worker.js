"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const common_1 = require("./common");
const injector_setup_1 = require("./injector-setup");
const mem_stats_1 = __importDefault(require("@wfh/plink/wfh/dist/utils/mem-stats"));
const { tsconfigFile, reportDir, ngOptions, deployUrl, baseHref, drcpBuilderOptions } = worker_threads_1.workerData;
/* eslint-disable no-console */
// console.log(workerData);
mem_stats_1.default();
common_1.initCli(drcpBuilderOptions)
    .then((drcpConfig) => {
    injector_setup_1.injectorSetup(deployUrl, baseHref);
    const create = require('./change-tsconfig').createTsConfig;
    const content = create(tsconfigFile, ngOptions, reportDir);
    worker_threads_1.parentPort.postMessage({ log: mem_stats_1.default() });
    worker_threads_1.parentPort.postMessage({ result: content });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlLXRzY29uZmlnLXdvcmtlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNoYW5nZS10c2NvbmZpZy13b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxtREFBc0Q7QUFFdEQscUNBQXFEO0FBQ3JELHFEQUErQztBQUMvQyxvRkFBMkQ7QUFXM0QsTUFBTSxFQUNKLFlBQVksRUFDWixTQUFTLEVBQ1QsU0FBUyxFQUNULFNBQVMsRUFDVCxRQUFRLEVBQ1Isa0JBQWtCLEVBQ25CLEdBQUcsMkJBQWtCLENBQUM7QUFFdkIsK0JBQStCO0FBQy9CLDJCQUEyQjtBQUMzQixtQkFBUSxFQUFFLENBQUM7QUFDWCxnQkFBTyxDQUFDLGtCQUFrQixDQUFDO0tBQzFCLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO0lBQ25CLDhCQUFhLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLE1BQU0sTUFBTSxHQUEwQixPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxjQUFjLENBQUM7SUFDbEYsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFFM0QsMkJBQVcsQ0FBQyxXQUFXLENBQUMsRUFBQyxHQUFHLEVBQUUsbUJBQVEsRUFBRSxFQUFDLENBQUMsQ0FBQztJQUMzQywyQkFBVyxDQUFDLFdBQVcsQ0FBQyxFQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtwYXJlbnRQb3J0LCB3b3JrZXJEYXRhfSBmcm9tICd3b3JrZXJfdGhyZWFkcyc7XG5pbXBvcnQge2NyZWF0ZVRzQ29uZmlnLCBQYXJpYWxCcm93c2VyT3B0aW9uc30gZnJvbSAnLi9jaGFuZ2UtdHNjb25maWcnO1xuaW1wb3J0IHtpbml0Q2xpLCBEcmNwQnVpbGRlck9wdGlvbnN9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7aW5qZWN0b3JTZXR1cH0gZnJvbSAnLi9pbmplY3Rvci1zZXR1cCc7XG5pbXBvcnQgbWVtc3RhdHMgZnJvbSAnQHdmaC9wbGluay93ZmgvZGlzdC91dGlscy9tZW0tc3RhdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIERhdGEge1xuICB0c2NvbmZpZ0ZpbGU6IHN0cmluZztcbiAgcmVwb3J0RGlyOiBzdHJpbmc7XG4gIG5nT3B0aW9uczogUGFyaWFsQnJvd3Nlck9wdGlvbnM7XG4gIGRlcGxveVVybDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBiYXNlSHJlZj86IHN0cmluZztcbiAgZHJjcEJ1aWxkZXJPcHRpb25zOiBEcmNwQnVpbGRlck9wdGlvbnM7XG59XG5cbmNvbnN0IHtcbiAgdHNjb25maWdGaWxlLFxuICByZXBvcnREaXIsXG4gIG5nT3B0aW9ucyxcbiAgZGVwbG95VXJsLFxuICBiYXNlSHJlZixcbiAgZHJjcEJ1aWxkZXJPcHRpb25zXG59ID0gd29ya2VyRGF0YSBhcyBEYXRhO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4vLyBjb25zb2xlLmxvZyh3b3JrZXJEYXRhKTtcbm1lbXN0YXRzKCk7XG5pbml0Q2xpKGRyY3BCdWlsZGVyT3B0aW9ucylcbi50aGVuKChkcmNwQ29uZmlnKSA9PiB7XG4gIGluamVjdG9yU2V0dXAoZGVwbG95VXJsLCBiYXNlSHJlZik7XG4gIGNvbnN0IGNyZWF0ZTogdHlwZW9mIGNyZWF0ZVRzQ29uZmlnID0gcmVxdWlyZSgnLi9jaGFuZ2UtdHNjb25maWcnKS5jcmVhdGVUc0NvbmZpZztcbiAgY29uc3QgY29udGVudCA9IGNyZWF0ZSh0c2NvbmZpZ0ZpbGUsIG5nT3B0aW9ucywgcmVwb3J0RGlyKTtcblxuICBwYXJlbnRQb3J0IS5wb3N0TWVzc2FnZSh7bG9nOiBtZW1zdGF0cygpfSk7XG4gIHBhcmVudFBvcnQhLnBvc3RNZXNzYWdlKHtyZXN1bHQ6IGNvbnRlbnR9KTtcbn0pO1xuIl19