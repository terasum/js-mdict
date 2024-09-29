mod utils;

use libc;
use rust_lzo;
use std::fs::File;
use std::io::Read;
use std::mem;
use wasm_bindgen::prelude::*;

use std::slice;
use rust_lzo::LZOError;

#[wasm_bindgen]
pub fn greet() -> String {
    return "Hello, lzox1-rs!".to_string();
}

#[wasm_bindgen(js_name = decompress)]
pub fn decompress(buf: Box<[u8]>) -> Result<Box<[u8]>, JsValue> {
    utils::set_panic_hook();
    let invec = Vec::from(buf.as_ref());
    let mut out = vec![0; buf.len()];
    match lzo1x::decompress(&invec, &mut out) {
        Ok(_) => (),
        Err(e) => return Err(JsValue::from_str(&format!(
            "lzox1 decompress failed: e: {:?}, buflen: {:?}, outlen: {:?}", e, buf.len(), out.len()
        ))),
    }

    Ok(out.into_boxed_slice())
}

#[test]
fn test_decompress() {
    // 准备测试数据
    let compressed = vec![27, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 17, 0, 0];

    // 调用decompress函数
    let result = decompress(compressed.into_boxed_slice());

    // 验证结果
    assert!(result.is_ok(), "解压缩应该成功");

    let decompressed = result.unwrap();
    let expected = vec![1, 2, 3, 4, 5, 6, 7, 8, 8, 9];

    assert_eq!(decompressed.len(), expected.len(), "解压缩后的长度应该正确");
    assert_eq!(&*decompressed, expected.as_slice(), "解压缩后的内容应该正确");
}


// #[test]
// fn test_decompress_2() {
//     // let mut compressed_file = File::open("tests/compressed.data").unwrap();
//     // println!("{:?}", compressed_file);
//     //
//     // let compressed_data:&mut [u8] = &mut [0;1000];
//     // let code = compressed_file.read(compressed_data);
//     // println!("{:?}",code );
//     // println!("{:?}", compressed_data);
//     //
//     unsafe {
//         let data = [0u8, 2, 3, 4, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//             2, 3, 4, 2, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3,
//             4, 2, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 4, 2,
//             2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 4];
//         let mut dst_len: usize = rust_lzo::worst_compress(mem::size_of_val(&data));
//         let mut v = Vec::with_capacity(dst_len);
//         let dst = libc::malloc(dst_len);
//         let mut dst = slice::from_raw_parts_mut(dst as *mut u8, dst_len);
//
//         let dec_dst = libc::malloc(mem::size_of_val(&compressed_data));
//         let result_len = mem::size_of_val(&compressed_data);
//         let mut dec_dst = slice::from_raw_parts_mut(dec_dst as *mut u8, result_len);
//         let (result, err) = rust_lzo::LZOContext::decompress_to_slice(&dst, &mut dec_dst);
//         assert!(err == rust_lzo::LZOError::OK);
//         println!("{}", result.len());
//         assert!(result.len() == mem::size_of_val(&data));
//         assert!(&data[..] == result);
//
//         // 调用decompress函数
//         let result = rust_lzo::decompress(compressed_data.as_ref().to_vec().into_boxed_slice());
//
//         // 验证结果
//         assert!(result.is_ok(), "解压缩应该成功");
//
//         let decompressed = result.unwrap();
//         let expected = vec![1, 2, 3, 4, 5, 6, 7, 8, 8, 9];
//
//         assert_eq!(decompressed.len(), expected.len(), "解压缩后的长度应该正确");
//         assert_eq!(&*decompressed, expected.as_slice(), "解压缩后的内容应该正确");
//     }
// }

#[test]
fn test_compress3() {
    unsafe {
        // let data = [0u8, 2, 3, 4, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //     2, 3, 4, 2, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3,
        //     4, 2, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 4, 2,
        //     2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 4];
        //
        let  data= [27, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 17, 0, 0];

        // let mut compressed_file = File::open("tests/compressed.data").unwrap();
        // println!("{:?}", compressed_file);
        //
        // let data: &mut [u8] = &mut [0; 1000];
        // let code = compressed_file.read(data);
        // println!("{:?}", code);
        // println!("{:?}", data);

        let mut dst_len: usize = rust_lzo::worst_compress(mem::size_of_val(&data));
        let mut v = Vec::with_capacity(dst_len);
        let dst = libc::malloc(dst_len);
        let mut ctx = rust_lzo::LZOContext::new();
        let mut dst = slice::from_raw_parts_mut(dst as *mut u8, dst_len);
        let (dst, err) = ctx.compress_to_slice(&data, &mut dst);
        assert!(err == rust_lzo::LZOError::OK);
        let err = ctx.compress(&data, &mut v);
        assert!(err == rust_lzo::LZOError::OK);
        println!("{}", dst.len());

        let dec_dst = libc::malloc(mem::size_of_val(&data));
        let result_len = mem::size_of_val(&data);
        let mut dec_dst = slice::from_raw_parts_mut(dec_dst as *mut u8, result_len);
        let (result, err) = rust_lzo::LZOContext::decompress_to_slice(&dst, &mut dec_dst);
        match err {
            LZOError::OK => {println!("ok")}
            LZOError::ERROR => {println!("ERROR")}
            LZOError::OUT_OF_MEMORY => {println!("OUT_OF_MEMORY")}
            LZOError::NOT_COMPRESSIBLE => {println!("NOT_COMPRESSIBLE")}
            LZOError::INPUT_OVERRUN => {println!("INPUT_OVERRUN")}
            LZOError::OUTPUT_OVERRUN => {println!("OUTPUT_OVERRUN")}
            LZOError::LOOKBEHIND_OVERRUN => {println!("LOOKBEHIND_OVERRUN")}
            LZOError::EOF_NOT_FOUND => {println!("EOF_NOT_FOUND")}
            LZOError::INPUT_NOT_CONSUMED => {println!("INPUT_NOT_CONSUMED")}
            LZOError::NOT_YET_IMPLEMENTED => {println!("NOT_YET_IMPLEMENTED")}
            LZOError::INVALID_ARGUMENT => {println!("INVALID_ARGUMENT")}
        }
        assert!(err == rust_lzo::LZOError::OK);
        println!("{}", result.len());
        assert!(result.len() == mem::size_of_val(&data));
        assert!(&data[..] == result);
    }
}