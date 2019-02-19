declare module "Mdict" {
    class KeyHeader {
        keyBlocksNum: number;
        entriesNum: number;
        keyBlockInfoDecompSize: number;
        keyBlockInfoCompSize: number;
        keyBlocksTotalSize: number;
    }

    class RecordHeader {
        recordBlocksNum: number;
        entriesNum: number;
        recordBlockInfoCompSize: number;
        recordBlockCompSize: number;
    }

    class KeyBlockInfo {
        firstKey: string;
        lastKey: string;
        keyBlockCompSize: number;
        keyBlockCompAccumulator: number;
        keyBlockDecompSize: number;
        keyBlockDecompAccumulator: number;
        keyBlockEntriesNum: number;
        keyBlockEntriesAccumulator: number;
        keyBlockIndex: number;
    }

    class RecordBlockInfo {
        compSize: number;
        compAccumulator: number;
        decompSize: number;
        decompAccumulator: number;
    }

    export class KeyDataItem {
        key: string;
        idx: number;
        encoding: string;
        record_idx: number;
        record_comp_start: number;
        record_compressed_size: number;
        record_decompressed_size: number;
        record_comp_type: string;
        record_encrypted: boolean;
        relateive_record_start: number;
        relative_record_end: number;
    }

    export class KeyListItem {
        recordStartOffset: number;
        keyText: string;
    }


    export class MdictBase {
        public fname: string;
        public ext: string;

        protected _passcode: string;
        protected _offset: number;
        protected _encoding: string;
        protected _decoder: TextDecoder;
        protected _headerStartOffset: number;
        protected _headerEndOffset: number;
        protected _keyHeaderStartOffset: number;
        protected _keyHeaderEndOffset: number;
        protected _keyBlockInfoStartOffset: number;
        protected _keyBlockInfoEndOffset: number;
        protected _keyBlockStartOffset: number;
        protected _keyBlockEndOffset: number;
        protected _recordHeaderStartOffset: number;
        protected _recordHeaderEndOffset: number;
        protected _recordInfoStartOffset: number;
        protected _recordInfoEndOffset: number;
        protected _recordBlockStartOffset: number;
        protected _recordBlockEndOffset: number;


        public header: any;
        public keyHeader: KeyHeader;
        public recordHeader: RecordHeader;

        public keyBlockInfoList: Array<KeyBlockInfo>;
        public keyList: Array<KeyListItem>;
        public recordBlockInfoList: Array<RecordBlockInfo>;

        public keyData: Array<KeyDataItem>;
    }

    export class WordDefinition {
        keyText: string;
        definition: string;
    }
    export class WordIndex {
        key: string;
        roffset: number;
        ed?: number;
    }

    export class Mdict extends MdictBase {
        lookup(word: string): WordDefinition;
        prefix(word: string): Array<WordIndex>;
        suggest(word: string): Array<string>;
        fuzzy_search(word: string): Array<WordIndex>;
        parse_defination(key: string, rofset: number): string;
    }

}