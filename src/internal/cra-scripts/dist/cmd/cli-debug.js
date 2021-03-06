"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const worker_threads_1 = require("worker_threads");
// import inspector from 'inspector';
function default_1() {
    console.log('cli-debug, start a thread', __filename, process.execArgv);
    const wk = new worker_threads_1.Worker(__filename);
    console.log('run worker', wk.threadId);
    wk.on('exit', code => {
        console.log('thread exit');
    });
}
exports.default = default_1;
let inspectPort = 9229;
if (!worker_threads_1.isMainThread) {
    console.log(inspectPort, 'Inside thread', __filename);
    // inspector.open(inspectPort++, 'localhost', true);
    const { initConfig, initAsChildProcess } = require('@wfh/plink/wfh/dist/utils/bootstrap-process');
    initAsChildProcess();
    // require('@wfh/plink/wfh/dist/store');
    // console.log(Object.keys(require.cache));
    console.log('cli-debug ---------------------');
    // debugger;
    initConfig(JSON.parse(process.env.PLINK_CLI_OPTS));
    console.log(process.pid, worker_threads_1.threadId);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWRlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpLWRlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQStCO0FBQy9CLG1EQUE4RDtBQUU5RCxxQ0FBcUM7QUFFckM7SUFDRSxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkUsTUFBTSxFQUFFLEdBQUcsSUFBSSx1QkFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2QyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzdCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVBELDRCQU9DO0FBRUQsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBRXZCLElBQUksQ0FBQyw2QkFBWSxFQUFFO0lBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN0RCxvREFBb0Q7SUFDcEQsTUFBTSxFQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBQyxHQUFHLE9BQU8sQ0FBQyw2Q0FBNkMsQ0FBZ0IsQ0FBQztJQUUvRyxrQkFBa0IsRUFBRSxDQUFDO0lBQ3JCLHdDQUF3QztJQUN4QywyQ0FBMkM7SUFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0lBQy9DLFlBQVk7SUFDWixVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWUsQ0FBQyxDQUFDLENBQUM7SUFHcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLHlCQUFRLENBQUMsQ0FBQztDQUNwQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbmltcG9ydCB7V29ya2VyLCBpc01haW5UaHJlYWQsIHRocmVhZElkfSBmcm9tICd3b3JrZXJfdGhyZWFkcyc7XG5pbXBvcnQgKiBhcyBib290IGZyb20gJ0B3ZmgvcGxpbmsvd2ZoL2Rpc3QvdXRpbHMvYm9vdHN0cmFwLXByb2Nlc3MnO1xuLy8gaW1wb3J0IGluc3BlY3RvciBmcm9tICdpbnNwZWN0b3InO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJ2NsaS1kZWJ1Zywgc3RhcnQgYSB0aHJlYWQnLCBfX2ZpbGVuYW1lLCBwcm9jZXNzLmV4ZWNBcmd2KTtcbiAgY29uc3Qgd2sgPSBuZXcgV29ya2VyKF9fZmlsZW5hbWUpO1xuICBjb25zb2xlLmxvZygncnVuIHdvcmtlcicsIHdrLnRocmVhZElkKTtcbiAgd2sub24oJ2V4aXQnLCBjb2RlID0+IHtcbiAgICBjb25zb2xlLmxvZygndGhyZWFkIGV4aXQnKTtcbiAgfSk7XG59XG5cbmxldCBpbnNwZWN0UG9ydCA9IDkyMjk7XG5cbmlmICghaXNNYWluVGhyZWFkKSB7XG4gIGNvbnNvbGUubG9nKGluc3BlY3RQb3J0LCAnSW5zaWRlIHRocmVhZCcsIF9fZmlsZW5hbWUpO1xuICAvLyBpbnNwZWN0b3Iub3BlbihpbnNwZWN0UG9ydCsrLCAnbG9jYWxob3N0JywgdHJ1ZSk7XG4gIGNvbnN0IHtpbml0Q29uZmlnLCBpbml0QXNDaGlsZFByb2Nlc3N9ID0gcmVxdWlyZSgnQHdmaC9wbGluay93ZmgvZGlzdC91dGlscy9ib290c3RyYXAtcHJvY2VzcycpIGFzIHR5cGVvZiBib290O1xuXG4gIGluaXRBc0NoaWxkUHJvY2VzcygpO1xuICAvLyByZXF1aXJlKCdAd2ZoL3BsaW5rL3dmaC9kaXN0L3N0b3JlJyk7XG4gIC8vIGNvbnNvbGUubG9nKE9iamVjdC5rZXlzKHJlcXVpcmUuY2FjaGUpKTtcbiAgY29uc29sZS5sb2coJ2NsaS1kZWJ1ZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgLy8gZGVidWdnZXI7XG4gIGluaXRDb25maWcoSlNPTi5wYXJzZShwcm9jZXNzLmVudi5QTElOS19DTElfT1BUUyEpKTtcblxuXG4gIGNvbnNvbGUubG9nKHByb2Nlc3MucGlkLCB0aHJlYWRJZCk7XG59XG4iXX0=