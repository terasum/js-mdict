import { closeSync, openSync, readSync } from 'node:fs';

export class FileScanner {
  offset: number;
  filepath: string;
  fd: number;
  constructor(filepath: string) {
    this.filepath = filepath;
    this.offset = 0;
    this.fd = openSync(filepath, 'r');
  }
  close() {
    if (this.fd == 0) {
      return;
    }
    closeSync(this.fd);
  }
  readBuffer(offset: number| bigint, length: number): Uint8Array {
    const buffer = new Uint8Array(length);
    const readedLen = readSync(this.fd, buffer, {
      offset: 0, // here offset means the data will write into buffer's offset
      length: length,
      position: offset, // here the offset is the file's start read position
    });
    return buffer.slice(0, readedLen);
  }
  readNumber(offset: number, length: number): DataView {
    const buffer = new ArrayBuffer(length);
    const dataView = new DataView(buffer);
    readSync(this.fd, dataView, {
      length: length,
      position: offset,
      offset: 0,
    });
    return dataView;
  }
}
