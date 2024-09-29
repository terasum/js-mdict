#![no_main]

extern crate libfuzzer_sys;

use std::{ffi::c_void, mem::MaybeUninit, ptr::null_mut};

use libfuzzer_sys::fuzz_target;
use lzo1x::CompressLevel;

fuzz_target!(|data: &[u8]| {
    let mut compressed = lzo1x::compress(data, CompressLevel::new(3).unwrap());

    assert!(compressed == lzo_sys_compress_1(&data));

    lzo1x::optimize(&mut compressed, data.len());

    assert!(compressed == lzo_sys_optimize(&compressed, data.len()));

    let mut decompressed = vec![0; data.len()];
    lzo1x::decompress(&compressed, &mut decompressed).unwrap();

    assert!(decompressed == data);
});

fn lzo_sys_compress_1(src: &[u8]) -> Vec<u8> {
    let mut dst = vec![0; src.len() + (src.len() / 16) + 64 + 3];
    let mut dst_len = MaybeUninit::uninit();
    let mut wrkmem = vec![0; lzo_sys::lzo1x::LZO1X_1_MEM_COMPRESS as usize];

    unsafe {
        lzo_sys::lzo1x::lzo1x_1_compress(
            src.as_ptr(),
            src.len(),
            dst.as_mut_ptr(),
            dst_len.as_mut_ptr(),
            wrkmem.as_mut_ptr() as *mut c_void,
        )
    };

    let dst_len = unsafe { dst_len.assume_init() };

    dst.resize(dst_len, 0);

    dst
}

fn lzo_sys_optimize(src: &[u8], decompressed_len: usize) -> Vec<u8> {
    let mut src = src.to_vec();

    let mut dst = vec![0; decompressed_len];
    let mut dst_len = dst.len();

    unsafe {
        lzo_sys::lzo1x::lzo1x_optimize(
            src.as_mut_ptr(),
            src.len(),
            dst.as_mut_ptr(),
            &mut dst_len,
            null_mut(),
        )
    };

    src
}
