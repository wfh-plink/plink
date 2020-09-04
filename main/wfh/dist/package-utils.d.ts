import PackageBrowserInstance from './build-util/ts/package-instance';
import { PackageInfo } from './package-mgr';
import { lookupPackageJson } from './cmd/utils';
export declare function createLazyPackageFileFinder(): (file: string) => PackageBrowserInstance | undefined;
export declare type FindPackageCb = (fullName: string, 
/** @Deprecated empty string */
packagePath: string, parsedName: {
    name: string;
    scope: string;
}, json: any, realPackagePath: string, isInstalled: boolean) => void;
export declare function lookForPackages(packageList: string[] | string, cb: FindPackageCb): void;
export declare type PackageType = '*' | 'build' | 'core';
export declare function findAllPackages(callback: FindPackageCb, recipeType?: 'src' | 'installed', projectDir?: string | string[]): void;
export declare function findAllPackages(packageList: string[] | string, callback: FindPackageCb, recipeType?: 'src' | 'installed', projectDir?: string | string[]): void;
export { lookupPackageJson as findPackageJsonPath };
export declare function findPackageByType(_types: PackageType | PackageType[], callback: FindPackageCb, recipeType?: 'src' | 'installed', projectDir?: string): void;
export declare function allPackages(_types: PackageType | PackageType[], recipeType?: 'src' | 'installed', projectDir?: string): Generator<PackageInfo>;
export declare function packages4CurrentWorkspace(): Generator<PackageInfo, void, unknown>;
