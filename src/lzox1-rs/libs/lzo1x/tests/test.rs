#![feature(test)]

extern crate test;

use std::{
    env,
    ffi::c_void,
    fs::{self, File},
    io::Read,
    mem::MaybeUninit,
    ptr::null_mut,
    sync::Arc,
};

use lzo1x::CompressLevel;
use test::{test_main, ShouldPanic, TestDesc, TestDescAndFn, TestFn, TestName, TestType};
use zip::ZipArchive;

fn main() {
    let args = env::args().collect::<Vec<_>>();

    let mut tests = vec![];

    add_corpus_tests(&mut tests, "corpora/calgary.zip");
    add_corpus_tests(&mut tests, "corpora/silesia.zip");

    add_roundtrip_1_test(
        &mut tests,
        "tests/fuzz/crash-8e855f271031b6ba31529bdd41d7c5571eec732c",
    );

    add_roundtrip_1_optimize_test(
        &mut tests,
        "tests/fuzz/crash-28a2691544a8a7d924c29f628253a81723e1a5d2",
    );

    add_roundtrip_1_optimize_test(
        &mut tests,
        "tests/fuzz/crash-473a6b31e947e033b066600e097ab0fda1e62ed8",
    );

    test_main(&args, tests, None);
}

fn add_corpus_tests(tests: &mut Vec<TestDescAndFn>, path: &str) {
    let zip_file = File::open(path).unwrap();
    let mut zip_archive = ZipArchive::new(zip_file).unwrap();

    for index in 0..zip_archive.len() {
        let mut file = zip_archive.by_index(index).unwrap();

        if file.is_dir() {
            continue;
        }

        let mut data = Vec::with_capacity(file.size() as usize);
        file.read_to_end(&mut data).unwrap();

        let data = Arc::new(data);

        let test = create_roundtrip_1_optimize_test(file.name(), Arc::clone(&data));
        tests.push(test);

        let test = create_roundtrip_999_test(file.name(), Arc::clone(&data));
        tests.push(test);
    }
}

fn add_roundtrip_1_test(tests: &mut Vec<TestDescAndFn>, path: &str) {
    let data = fs::read(path).unwrap();

    let test = create_roundtrip_1_test(path, Arc::new(data));
    tests.push(test);
}

fn add_roundtrip_1_optimize_test(tests: &mut Vec<TestDescAndFn>, path: &str) {
    let data = fs::read(path).unwrap();

    let test = create_roundtrip_1_optimize_test(path, Arc::new(data));
    tests.push(test);
}

fn create_roundtrip_1_test(name: &str, data: Arc<Vec<u8>>) -> TestDescAndFn {
    TestDescAndFn {
        desc: TestDesc {
            name: TestName::DynTestName(format!("roundtrip 1 {name}")),
            ignore: false,
            ignore_message: None,
            source_file: "",
            start_line: 0,
            start_col: 0,
            end_line: 0,
            end_col: 0,
            should_panic: ShouldPanic::No,
            compile_fail: false,
            no_run: false,
            test_type: TestType::IntegrationTest,
        },
        testfn: TestFn::DynTestFn(Box::new(move || {
            roundtrip_1(&data);

            Ok(())
        })),
    }
}

fn create_roundtrip_1_optimize_test(name: &str, data: Arc<Vec<u8>>) -> TestDescAndFn {
    TestDescAndFn {
        desc: TestDesc {
            name: TestName::DynTestName(format!("roundtrip 1 optimize {name}")),
            ignore: false,
            ignore_message: None,
            source_file: "",
            start_line: 0,
            start_col: 0,
            end_line: 0,
            end_col: 0,
            should_panic: ShouldPanic::No,
            compile_fail: false,
            no_run: false,
            test_type: TestType::IntegrationTest,
        },
        testfn: TestFn::DynTestFn(Box::new(move || {
            roundtrip_1_optimize(&data);

            Ok(())
        })),
    }
}

fn create_roundtrip_999_test(name: &str, data: Arc<Vec<u8>>) -> TestDescAndFn {
    TestDescAndFn {
        desc: TestDesc {
            name: TestName::DynTestName(format!("roundtrip 999 {name}")),
            ignore: false,
            ignore_message: None,
            source_file: "",
            start_line: 0,
            start_col: 0,
            end_line: 0,
            end_col: 0,
            should_panic: ShouldPanic::No,
            compile_fail: false,
            no_run: false,
            test_type: TestType::IntegrationTest,
        },
        testfn: TestFn::DynTestFn(Box::new(move || {
            roundtrip_999(&data);

            Ok(())
        })),
    }
}

fn roundtrip_1(data: &[u8]) {
    let compressed = lzo1x::compress(data, CompressLevel::new(3));

    assert!(compressed == lzo_sys_compress_1(data));

    let mut decompressed = vec![0; data.len()];
    lzo1x::decompress(&compressed, &mut decompressed).unwrap();

    assert!(decompressed == data);
}

fn roundtrip_1_optimize(data: &[u8]) {
    let mut compressed = lzo1x::compress(data, CompressLevel::new(3));

    assert!(compressed == lzo_sys_compress_1(data));

    lzo1x::optimize(&mut compressed, data.len());

    assert!(compressed == lzo_sys_optimize(&compressed, data.len()));

    let mut decompressed = vec![0; data.len()];
    lzo1x::decompress(&compressed, &mut decompressed).unwrap();

    assert!(decompressed == data);
}

fn roundtrip_999(data: &[u8]) {
    let compressed = lzo1x::compress(data, CompressLevel::new(12));

    assert!(compressed == lzo_sys_compress_999(data));

    let mut decompressed = vec![0; data.len()];
    lzo1x::decompress(&compressed, &mut decompressed).unwrap();

    assert!(decompressed == data);
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
