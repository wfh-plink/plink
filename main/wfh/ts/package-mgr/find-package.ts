import * as fs from 'fs';
import * as Path from 'path';
import {Subscriber, Observable, merge} from 'rxjs';

/**
 * Recursively lookup `fromDir` folder for private module's package.json file
 */
export default function findPackageJson(_fromDirs: string[] | string, startFromSubDir: boolean) {
  let fromDirs: string[];
  if (!Array.isArray(_fromDirs))
    fromDirs = [_fromDirs];
  else
    fromDirs = _fromDirs;
  return merge(...fromDirs.map(d => new FolderScanner(d).getPackageJsonFiles(startFromSubDir)));
}

class FolderScanner {
  fromDir: string;
  private out: Subscriber<string>;

  constructor(fromDir: string) {
    this.fromDir = Path.resolve(fromDir);
  }

  getPackageJsonFiles(startFromSubDir: boolean): Observable<string> {
    return new Observable<string>(sub => {
      this.out = sub;
      if (startFromSubDir)
        this.checkSubFolders(this.fromDir);
      else
        this.checkFolder(this.fromDir);
      sub.complete();
    });
  }

  private checkSubFolders(parentDir: string) {
    const folders = fs.readdirSync(parentDir);
    for (const name of folders) {
      try {
        if (name === 'node_modules') {
          const testDir = Path.resolve(parentDir, 'node_modules');
          if (fs.lstatSync(testDir).isSymbolicLink()) {
            // tslint:disable-next-line: no-console
            console.log('[find-package] found a symlink node_modules:', testDir);
          }
          continue;
        }
        const dir = Path.join(parentDir, name);
        this.checkFolder(dir);
      } catch (er) {
        console.error('[find-package]', er);
      }
    }
  }

  private checkFolder(dir: string) {
    const self = this;
    if (fs.statSync(dir).isDirectory()) {
      const pkJsonPath = Path.join(dir, 'package.json');
      if (fs.existsSync(pkJsonPath)) {
        this.out.next(pkJsonPath);
      } else {
        self.checkSubFolders(dir);
      }
    }
  }
}
