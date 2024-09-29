#![no_main]

extern crate libfuzzer_sys;

use std::{ffi::c_void, mem::MaybeUninit};

use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    let compressed = lzo1x::compress(data, CompressLevel::new(12).unwrap());

    assert!(compressed == lzo_sys_compress_999(&data));

    let mut decompressed = vec![0; data.len()];
    lzo1x::decompress(&compressed, &mut decompressed).unwrap();

    assert!(decompressed == data);
});

fn lzo_sys_compress_999(src: &[u8]) -> Vec<u8> {
    let mut dst = vec![0; src.len() + (src.len() / 16) + 64 + 3];
    let mut dst_len = MaybeUninit::uninit();
    let mut wrkmem = vec![0; lzo_sys::lzo1x::LZO1X_999_MEM_COMPRESS as usize];

    unsafe {
        lzo_sys::lzo1x::lzo1x_999_compress(
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
