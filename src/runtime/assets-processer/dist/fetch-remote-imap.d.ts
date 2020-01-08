import { Observable, BehaviorSubject } from 'rxjs';
import { Checksum } from './fetch-types';
import { ImapTokenType } from './mail/imap-msg-parser';
import { LookAhead, Token } from 'dr-comp-package/wfh/dist/async-LLn-parser';
export declare function sendMail(subject: string, text: string, file?: string): Promise<void>;
export declare function retrySendMail(subject: string, text: string, file?: string): Promise<void>;
export interface ImapFetchData {
    headers: {
        [key: string]: string[] | undefined;
    };
    textBody?: string;
    fileName?: string;
}
export interface ImapCommandContext {
    /**
     * Index of latest mail
     */
    lastIndex: number;
    fileWritingState: Observable<boolean>;
    waitForReply(command?: string, onLine?: (la: LookAhead<Token<ImapTokenType>>, tag: string) => Promise<any>): Promise<string[] | null>;
    findMail(fromIndx: number, subject: string): Promise<number | undefined>;
    waitForFetch(mailIdx: string | number, headerOnly?: boolean, overrideFileName?: string): Promise<ImapFetchData>;
    waitForFetchText(index: number): Promise<string | undefined>;
}
/**
 * IMAP specification
 * https://tools.ietf.org/html/rfc1730
 *
 * ID command
 * https://tools.ietf.org/html/rfc2971
 */
export declare function connectImap(callback: (context: ImapCommandContext) => Promise<any>): Promise<void>;
export declare class ImapManager {
    env: string;
    zipDownloadDir?: string | undefined;
    checksumState: BehaviorSubject<Checksum | null>;
    fileWritingState: ImapCommandContext['fileWritingState'];
    watching: boolean;
    private toFetchAppsState;
    private ctx;
    constructor(env: string, zipDownloadDir?: string | undefined);
    fetchChecksum(): Promise<Checksum | undefined>;
    fetchUpdateCheckSum(appName: string): Promise<Checksum>;
    /**
     * Done when files are written
     * @param excludeApp exclude app
     */
    fetchOtherZips(excludeApp?: string): Promise<string[]>;
    startWatchMail(pollInterval?: number): Promise<void>;
    checkMailForUpdate(): Promise<void>;
    fetchAppDuringWatchAction(...appNames: string[]): void;
    sendFileAndUpdatedChecksum(appName: string, file: string): Promise<void>;
    stopWatch(): void;
    private fetchAttachment;
    private _fetchChecksum;
}
export declare function testMail(imap: string, user: string, loginSecret: string): Promise<void>;