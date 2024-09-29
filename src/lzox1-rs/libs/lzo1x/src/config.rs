pub const M1_MAX_OFFSET: usize = 0x0400;
pub const M2_MAX_OFFSET: usize = 0x0800;
pub const M3_MAX_OFFSET: usize = 0x4000;
pub const M4_MAX_OFFSET: usize = 0xbfff;
pub const MX_MAX_OFFSET: usize = M1_MAX_OFFSET + M2_MAX_OFFSET;

pub const M2_MIN_LEN: usize = 3;

pub const M2_MAX_LEN: usize = 8;
pub const M3_MAX_LEN: usize = 33;
pub const M4_MAX_LEN: usize = 9;

pub const M1_MARKER: usize = 0;
pub const M3_MARKER: usize = 32;
pub const M4_MARKER: usize = 16;
