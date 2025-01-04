export declare class FileScanner {
    offset: number;
    filepath: string;
    fd: number;
    constructor(filepath: string);
    close(): void;
    readBuffer(offset: number | bigint, length: number): Uint8Array;
    readNumber(offset: number, length: number): DataView;
}
