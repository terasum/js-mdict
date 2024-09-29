[![crate](https://img.shields.io/crates/v/lzo1x.svg)](https://crates.io/crates/lzo1x)
[![docs](https://docs.rs/lzo1x/badge.svg)](https://docs.rs/lzo1x)
 
 # LZO1X

Safe Rust port of the LZO1X compression algorithm.

All functionality has been completely cross-tested against the original C implementation using [lzo-sys](https://crates.io/crates/lzo-sys).

 ## Performance

 ### Decompression

Below are decompression benchmarks of files found in the [Calgary Corpus](https://en.wikipedia.org/wiki/Calgary_corpus). The performance is compared to the original `lzo1x_decompress_safe` decompressor using [lzo-sys](https://crates.io/crates/lzo-sys). The benchmark times are given in nanoseconds, and the compression level used was 3. The benchmarks were run on Windows 11 using an AMD Ryzen 7 3700X processor.

 | file   | lzo1x     | lzo-sys   |
 | ------ | --------- | --------- | 
 | bib    | 237,703   | 351,287   |  
 | book1  | 2,153,490 | 3,169,060 |   
 | book2  | 1,509,000 | 2,398,860 |  
 | geo    | 9,404     | 128,597   | 
 | news   | 830,650   | 1,374,860 |   
 | obj1   | 19,630    | 21,425    | 
 | obj2   | 444,815   | 800,790   |
 | paper1 | 120,117   | 135,253   |
 | paper2 | 207,371   | 261,725   |
 | pic    | 400,150   | 1,219,780 |
 | progc  | 76,770    | 85,241    |
 | progl  | 123,778   | 173,122   |
 | progp  | 73,243    | 85,152    |
 | trans  | 134,408   | 223,275   |

 ### Compression

Compression is in general significantly slower than decompression, and also slower when compared to the original C implementations using [lzo-sys](https://crates.io/crates/lzo-sys).
