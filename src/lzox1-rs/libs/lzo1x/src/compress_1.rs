use alloc::{vec, vec::Vec};
use cfg_if::cfg_if;

use crate::config::{
    M2_MAX_LEN, M2_MAX_OFFSET, M3_MARKER, M3_MAX_LEN, M3_MAX_OFFSET, M4_MARKER, M4_MAX_LEN,
};

pub fn compress_1(src: &[u8], d_bits: u32) -> Vec<u8> {
    let src_len = src.len();

    let mut dst = vec![0; src_len + (src_len / 16) + 64 + 3];
    let mut work_mem = vec![0; 1 << d_bits];

    let mut src_pos = 0;
    let mut dst_pos = 0;
    let mut l = src_len;
    let mut t = 0;

    while l > 20 {
        let ll = l.min(49152);

        if (t + ll) >> 5 == 0 {
            break;
        }

        work_mem.fill(0);

        let (new_t, out_len) = {
            let src_start = src_pos;
            let src_len = ll;
            let src_pos_end = src_start + src_len - 20;
            let dst_start = dst_pos;
            let dict = &mut work_mem;

            let mut src_pos = src_start;
            let mut dst_pos = dst_pos;
            let mut ti = t;
            let mut ii = src_pos;

            if ti < 4 {
                src_pos += 4 - ti;
            }

            src_pos += 1 + ((src_pos - ii) >> 5);

            'main_loop: loop {
                let mut match_pos;

                loop {
                    if src_pos >= src_pos_end {
                        break 'main_loop;
                    }

                    let dv = get_u32_le(src, src_pos);
                    let dindex = ((0x1824429du32.wrapping_mul(dv)) >> (32 - d_bits)) as usize;
                    match_pos = src_start + dict[dindex] as usize;
                    dict[dindex] = (src_pos - src_start) as u16;

                    if dv == get_u32_le(src, match_pos) {
                        break;
                    }

                    src_pos += 1 + ((src_pos - ii) >> 5);
                }

                ii -= ti;
                ti = 0;
                let t = src_pos - ii;

                match t {
                    0 => {}
                    1..=3 => {
                        dst[dst_pos - 2] |= t as u8;
                    }
                    4..=18 => {
                        dst[dst_pos] = t as u8 - 3;
                        dst_pos += 1;
                    }
                    19.. => {
                        let mut tt = t - 18;
                        dst[dst_pos] = 0;
                        dst_pos += 1;

                        while tt > 255 {
                            tt -= 255;
                            dst[dst_pos] = 0;
                            dst_pos += 1;
                        }

                        dst[dst_pos] = tt as u8;
                        dst_pos += 1;
                    }
                }

                dst[dst_pos..dst_pos + t].copy_from_slice(&src[ii..ii + t]);
                dst_pos += t;

                let mut match_len = 4;

                loop {
                    let v = get_u64_ne(src, src_pos + match_len)
                        ^ get_u64_ne(src, match_pos + match_len);

                    if v != 0 {
                        cfg_if! {
                            if #[cfg(target_endian = "little")] {
                                match_len += v.trailing_zeros() as usize / 8;
                            } else if #[cfg(target_endian = "big")] {
                                match_len += v.leading_zeros() as usize / 8;
                            }
                        }

                        break;
                    }

                    match_len += 8;

                    if src_pos + match_len >= src_pos_end {
                        break;
                    }
                }

                let mut match_off = src_pos - match_pos;
                src_pos += match_len;
                ii = src_pos;

                if match_len <= M2_MAX_LEN && match_off <= M2_MAX_OFFSET {
                    match_off -= 1;
                    dst[dst_pos] = (((match_len - 1) << 5) | ((match_off & 7) << 2)) as u8;
                    dst_pos += 1;
                    dst[dst_pos] = (match_off >> 3) as u8;
                    dst_pos += 1;
                } else if match_off <= M3_MAX_OFFSET {
                    match_off -= 1;

                    if match_len <= M3_MAX_LEN {
                        dst[dst_pos] = (M3_MARKER | (match_len - 2)) as u8;
                        dst_pos += 1;
                    } else {
                        match_len -= M3_MAX_LEN;
                        dst[dst_pos] = M3_MARKER as u8;
                        dst_pos += 1;

                        while match_len > 255 {
                            match_len -= 255;
                            dst[dst_pos] = 0;
                            dst_pos += 1;
                        }

                        dst[dst_pos] = match_len as u8;
                        dst_pos += 1;
                    }

                    dst[dst_pos] = (match_off << 2) as u8;
                    dst_pos += 1;
                    dst[dst_pos] = (match_off >> 6) as u8;
                    dst_pos += 1;
                } else {
                    match_off -= 0x4000;

                    if match_len <= M4_MAX_LEN {
                        dst[dst_pos] =
                            (M4_MARKER | ((match_off >> 11) & 8) | (match_len - 2)) as u8;
                        dst_pos += 1;
                    } else {
                        match_len -= M4_MAX_LEN;
                        dst[dst_pos] = (M4_MARKER | ((match_off >> 11) & 8)) as u8;
                        dst_pos += 1;

                        while match_len > 255 {
                            match_len -= 255;
                            dst[dst_pos] = 0;
                            dst_pos += 1;
                        }

                        dst[dst_pos] = match_len as u8;
                        dst_pos += 1;
                    }

                    dst[dst_pos] = (match_off << 2) as u8;
                    dst_pos += 1;
                    dst[dst_pos] = (match_off >> 6) as u8;
                    dst_pos += 1;
                }
            }

            ((src_start + src_len) - (ii - ti), dst_pos - dst_start)
        };

        t = new_t;

        src_pos += ll;
        dst_pos += out_len;
        l -= ll;
    }

    t += l;

    if t > 0 {
        let ii = src_len - t;

        if dst_pos == 0 && t <= 238 {
            dst[dst_pos] = 17 + t as u8;
            dst_pos += 1;
        } else if t <= 3 {
            dst[dst_pos - 2] |= t as u8;
        } else if t <= 18 {
            dst[dst_pos] = t as u8 - 3;
            dst_pos += 1;
        } else {
            let mut tt = t - 18;

            dst[dst_pos] = 0;
            dst_pos += 1;

            while tt > 255 {
                tt -= 255;
                dst[dst_pos] = 0;
                dst_pos += 1;
            }

            dst[dst_pos] = tt as u8;
            dst_pos += 1;
        }

        dst[dst_pos..dst_pos + t].copy_from_slice(&src[ii..ii + t]);
        dst_pos += t;
    }

    dst[dst_pos] = (M4_MARKER | 1) as u8;
    dst_pos += 1;
    dst[dst_pos] = 0;
    dst_pos += 1;
    dst[dst_pos] = 0;
    dst_pos += 1;

    dst.resize(dst_pos, 0);
    dst
}

fn get_u32_le(src: &[u8], src_pos: usize) -> u32 {
    u32::from_le_bytes(src[src_pos..src_pos + 4].try_into().unwrap())
}

fn get_u64_ne(src: &[u8], src_pos: usize) -> u64 {
    u64::from_ne_bytes(src[src_pos..src_pos + 8].try_into().unwrap())
}
