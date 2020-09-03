import '../node-path';
import type { GlobalOptions } from '../cmd/types';
export declare function initConfigAsync(options: GlobalOptions, onShutdownSignal?: () => void | Promise<any>): Promise<void>;
export { withGlobalOptions } from '../cmd/cli';
export { GlobalOptions };
