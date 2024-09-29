#![feature(test)]

extern crate test;

use std::{ffi::c_void, io::Read, mem::MaybeUninit, ptr::null_mut};

use lzo1x::CompressLevel;
use test::Bencher;

#[bench]
fn compress_1(b: &mut Bencher) {
    let data = bench_data();

    b.iter(|| {
        lzo1x::compress(&data, CompressLevel::new(3).unwrap());
    })
}

#[bench]
fn compress_999(b: &mut Bencher) {
    let data = bench_data();

    b.iter(|| {
        lzo1x::compress(&data, CompressLevel::new(12).unwrap());
    })
}

#[bench]
fn decompress(b: &mut Bencher) {
    let data = bench_data();
    let compressed = lzo1x::compress(&data, CompressLevel::new(3).unwrap());

    let mut decompressed = vec![0; data.len()];

    b.iter(|| {
        lzo1x::decompress(&compressed, &mut decompressed).unwrap();
    })
}

#[ignore]
#[bench]
fn compress_1_sys(b: &mut Bencher) {
    let data = bench_data();

    b.iter(|| {
        lzo_sys_compress_1(&data);
    })
}

#[ignore]
#[bench]
fn compress_999_sys(b: &mut Bencher) {
    let data = bench_data();

    b.iter(|| {
        lzo_sys_compress_999(&data);
    })
}

#[ignore]
#[bench]
fn decompress_sys(b: &mut Bencher) {
    let data = bench_data();
    let compressed = lzo1x::compress(&data, CompressLevel::default());

    let mut decompressed = vec![0; data.len()];

    b.iter(|| {
        lzo_sys_decompress(&compressed, &mut decompressed);
    })
}

fn bench_data() -> Vec<u8> {
    let file = std::fs::File::open("corpora/calgary.zip").unwrap();
    let mut zip = zip::ZipArchive::new(file).unwrap();
    let mut file = zip.by_name("calgary/trans").unwrap();
    let mut buf = vec![0; file.size() as usize];
    file.read_to_end(&mut buf).unwrap();

    buf
}

fn lzo_sys_compress_1(src: &[u8]) -> Vec<u8> {
    lzo_sys_compress(src, lzo_sys::lzo1x::lzo1x_1_compress)
}

fn lzo_sys_compress_999(src: &[u8]) -> Vec<u8> {
    lzo_sys_compress(src, lzo_sys::lzo1x::lzo1x_999_compress)
}

fn lzo_sys_compress(src: &[u8], compress_fn: lzo_sys::lzoconf::lzo_compress_t) -> Vec<u8> {
    let mut dst = vec![0; src.len() + (src.len() / 16) + 64 + 3];
    let mut dst_len = MaybeUninit::uninit();
    let mut wrkmem = vec![0; lzo_sys::lzo1x::LZO1X_1_MEM_COMPRESS as usize];

    unsafe {
        compress_fn(
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

fn lzo_sys_decompress(src: &[u8], dst: &mut [u8]) {
    unsafe {
        let mut dst_len = dst.len();

        lzo_sys::lzo1x::lzo1x_decompress_safe(
            src.as_ptr(),
            src.len(),
            dst.as_mut_ptr(),
            &mut dst_len,
            null_mut(),
        )
    };
}
