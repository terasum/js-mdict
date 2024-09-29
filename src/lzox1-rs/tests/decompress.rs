#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;

use lzo1x::compress;
use wasm_bindgen_test::*;
use fs::{self, File};

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
#[test]
fn pass() {
    let compressed_data = File::open("./compressed.data").unwrap();
    println!("{:?}", compressed_data);
}
