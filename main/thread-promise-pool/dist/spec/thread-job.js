"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-console
function default_1(input) {
    console.log('In thread');
    return new Promise(resolve => setTimeout(() => resolve(input * 10), 1000));
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkLWpvYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRocmVhZC1qb2IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBNEI7QUFDNUIsbUJBQXdCLEtBQWE7SUFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN6QixPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3RSxDQUFDO0FBSEQsNEJBR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0c2xpbnQ6ZGlzYWJsZTpuby1jb25zb2xlXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihpbnB1dDogbnVtYmVyKSB7XG4gIGNvbnNvbGUubG9nKCdJbiB0aHJlYWQnKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKGlucHV0ICogMTApLCAxMDAwKSk7XG59XG4iXX0=