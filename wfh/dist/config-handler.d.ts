export interface DrcpConfig {
    configHandlerMgr(): ConfigHandlerMgr;
    get(path: string | string[], defaultValue?: any): any;
    set(path: string | string[], value: any): void;
    resolve(...path: string[]): string;
    (): {
        [property: string]: any;
    };
    load(): Promise<{
        [property: string]: any;
    }>;
    reload(): Promise<{
        [property: string]: any;
    }>;
    init(): Promise<{
        [property: string]: any;
    }>;
}
export interface ConfigHandler {
    onConfig(configSetting: {
        [prop: string]: any;
    }, drcpCliArgv?: {
        [prop: string]: any;
    }): Promise<void> | void;
}
export declare class ConfigHandlerMgr {
    static initConfigHandlers(files: string[]): Array<{
        file: string;
        handler: ConfigHandler;
    }>;
    protected configHandlers: Array<{
        file: string;
        handler: ConfigHandler;
    }>;
    constructor(files: string[]);
    /**
     *
     * @param func parameters: (filePath, last returned result, handler function),
     * returns the changed result, keep the last result, if resturns undefined
     */
    runEach<H>(func: (file: string, lastResult: any, handler: H) => Promise<any> | any): Promise<any>;
}
