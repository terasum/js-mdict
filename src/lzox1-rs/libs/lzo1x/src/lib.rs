#![warn(missing_docs)]
#![forbid(unsafe_code)]
#![cfg_attr(not(feature = "std"), no_std)]
//! Safe Rust port of the LZO1X compression algorithm.
//!
//! # Examples
//!
//! Compression and decompression:
//!
//! ```
//! let data = &[0xaa; 100];
//! let compressed = lzo1x::compress(data, lzox1::CompressLevel::default());
//!
//! assert_eq!(compressed.len(), 34);
//!
//! let mut decompressed = vec![0; data.len()];
//! lzo1x::decompress(&compressed, &mut decompressed).unwrap();
//!
//! assert_eq!(decompressed, data);
//! ```
//!
//! Slow but optimized pre-compression:
//!
//! ```
//! let data = &[0xaa; 100];
//! let mut compressed = lzo1x::compress(data, lzo1x::CompressLevel::new(13));
//!
//! lzo1x::optimize(&mut compressed, data.len());
//!
//! assert_eq!(compressed.len(), 9);
//! ```
//! # Comparison with original implementation
//!
//! All functionality has been completely cross-tested against the original C implementation using [lzo-sys](https://crates.io/crates/lzo-sys).
//! Futhermore, all compression functions have been unified on a single level scale according to the table below:
//!
//! | level | C equivalent        | C level |
//! | ----- | ------------------- |         |
//! | 1     | lzo1x_1_11_compress |         |
//! | 2     | lzo1x_1_12_compress |         |
//! | 3     | lzo1x_1_compress    |         |
//! | 4     | lzo1x_1_15_compress |         |
//! | 5     | lzo1x_999_compress  | 1       |
//! | 6     | lzo1x_999_compress  | 2       |
//! | 7     | lzo1x_999_compress  | 3       |
//! | 8     | lzo1x_999_compress  | 4       |
//! | 9     | lzo1x_999_compress  | 5       |
//! | 10    | lzo1x_999_compress  | 6       |
//! | 11    | lzo1x_999_compress  | 7       |
//! | 12    | lzo1x_999_compress  | 8       |
//! | 13    | lzo1x_999_compress  | 9       |

extern crate alloc;

mod compress_1;
mod compress_999;
mod config;
mod decompress;
mod optimize;
mod swd;

use core::fmt::{self, Display, Formatter};

pub use decompress::decompress;
pub use optimize::optimize;

use alloc::vec::Vec;

use compress_1::compress_1;
use compress_999::compress_999;

/// Compress the given `src` with the given compression `level`.
///
/// A higher level results in a better compression ratio at the cost of a longer runtime.
///
/// # Examples
///
/// ```
/// let data = &[0xaa; 100];
/// let compressed = lzo1x::compress(data, lzo1x::CompressLevel::default());
///
/// assert_eq!(compressed.len(), 34);
/// ```
pub fn compress(src: &[u8], level: CompressLevel) -> Vec<u8> {
    match level.0 {
        1 => compress_1(src, 11),
        2 => compress_1(src, 12),
        3 => compress_1(src, 14),
        4 => compress_1(src, 15),
        5 => compress_999(src, 0, 0, 0, 8, 4, 0),
        6 => compress_999(src, 0, 0, 0, 16, 8, 0),
        7 => compress_999(src, 0, 0, 0, 32, 16, 0),
        8 => compress_999(src, 1, 5, 5, 16, 16, 0),
        9 => compress_999(src, 1, 8, 16, 32, 32, 0),
        10 => compress_999(src, 1, 8, 16, 128, 128, 0),
        11 => compress_999(src, 2, 8, 32, 128, 256, 0),
        12 => compress_999(src, 2, 32, 128, 2048, 2048, 1),
        13 => compress_999(src, 2, 2048, 2048, 2048, 4096, 1),
        _ => unreachable!(),
    }
}

/// Compression level.
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Debug)]
pub struct CompressLevel(u8);

impl CompressLevel {
    /// Create a new `CompressLevel` instance from the given `level`.
    ///
    /// The given `level` should be between 1 and 13, otherwise it is clamped to the nearest valid level.
    pub const fn new(level: u8) -> Self {
        if level < Self::MIN.0 {
            Self::MIN
        } else if level > Self::MAX.0 {
            Self::MAX
        } else {
            Self(level)
        }
    }

    /// Minimum supported compression level. (1)
    pub const MIN: Self = Self(1);

    /// Maximum supported compression level. (13)
    pub const MAX: Self = Self(13);
}

impl Default for CompressLevel {
    /// Returns the default compression level. (3)
    fn default() -> Self {
        Self(3)
    }
}

impl Display for CompressLevel {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        Display::fmt(&self.0, f)
    }
}

impl From<u8> for CompressLevel {
    fn from(level: u8) -> Self {
        Self::new(level)
    }
}

/// Error returned when the given compression level is not between 1 and 13.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub struct CompressLevelError;

impl Display for CompressLevelError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.write_str("invalid compression level")
    }
}

#[cfg(feature = "std")]
impl std::error::Error for CompressLevelError {}

/// Error that occured during decompression.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub enum DecompressError {
    /// The input source does not contain valid compressed data.
    InvalidInput,
    /// The destination buffer length does not exactly match the decompressed data length.
    OutputLength,
}

impl Display for DecompressError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match *self {
            Self::InvalidInput => f.write_str("invalid input"),
            Self::OutputLength => f.write_str("output length does not match"),
        }
    }
}

#[cfg(feature = "std")]
impl std::error::Error for DecompressError {}
