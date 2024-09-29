use alloc::vec;

/// Optimize compressed data given in `src` in terms of decompression speed.
///
/// The length of the original decompressed data should be given in `decompressed_len`.
///
/// This function does not change the length of the compressed data,
/// and is likely to only improve the decompression speed around 0-3%.
///
/// #### Panics
///
/// Panics if the given `src` does not contain valid compressed data,
/// or if the given `decompressed_len` was not large enough.
///
/// # Examples
///
/// ```
/// let data = &[0xaa; 100];
/// let mut compressed = lzo1x::compress(data, lzo1x::CompressLevel::default());
///
/// lzo1x::optimize(&mut compressed, data.len());
/// ```
pub fn optimize(src: &mut [u8], decompressed_len: usize) {
    let mut dst = vec![0; decompressed_len];

    let mut litp = None;
    let mut lit = 0;
    let mut next_lit = usize::MAX;

    let mut dst_idx = 0;
    let mut src_idx = 0;

    let mut t = 0;

    let mut state: u8;

    if src[src_idx] > 17 {
        t = src[src_idx] as usize - 17;
        src_idx += 1;

        if t < 4 {
            state = 8;
        } else {
            state = 2;
        }
    } else {
        state = 0;
    }

    let mut m_pos = 0;
    let mut nl;

    loop {
        match state {
            0 => {
                if src_idx >= src.len() || dst_idx > dst.len() {
                    panic!();
                }

                t = src[src_idx] as usize;
                src_idx += 1;

                if t >= 16 {
                    state = 5;
                } else {
                    litp = Some(src_idx - 1);

                    if t == 0 {
                        t = 15;

                        while src[src_idx] == 0 {
                            t += 255;
                            src_idx += 1;
                        }

                        t += src[src_idx] as usize;
                        src_idx += 1;
                    }

                    lit = t + 3;

                    state = 1;
                }
            }
            1 => {
                dst[dst_idx] = src[src_idx];
                dst_idx += 1;
                src_idx += 1;
                dst[dst_idx] = src[src_idx];
                dst_idx += 1;
                src_idx += 1;
                dst[dst_idx] = src[src_idx];
                dst_idx += 1;
                src_idx += 1;

                state = 2;
            }
            2 => {
                dst[dst_idx] = src[src_idx];
                dst_idx += 1;
                src_idx += 1;
                t -= 1;

                while t > 0 {
                    dst[dst_idx] = src[src_idx];
                    dst_idx += 1;
                    src_idx += 1;
                    t -= 1;
                }

                t = src[src_idx] as usize;
                src_idx += 1;

                if t >= 16 {
                    state = 5;
                } else {
                    m_pos = dst_idx - 1 - 0x800;

                    m_pos -= t >> 2;
                    m_pos -= (src[src_idx] as usize) << 2;
                    src_idx += 1;
                    dst[dst_idx] = dst[m_pos];
                    dst_idx += 1;
                    m_pos += 1;
                    dst[dst_idx] = dst[m_pos];
                    dst_idx += 1;
                    m_pos += 1;
                    dst[dst_idx] = dst[m_pos];
                    dst_idx += 1;
                    m_pos += 1;
                    lit = 0;

                    state = 7;
                }
            }
            3 => {
                if t < 16 {
                    m_pos = dst_idx - 1;
                    m_pos -= t >> 2;
                    m_pos -= (src[src_idx] as usize) << 2;
                    src_idx += 1;

                    if litp.is_none() {
                        state = 4;
                    } else {
                        nl = src[src_idx - 2] as usize & 3;

                        if nl == 0 && lit == 1 && src[src_idx] >= 16 {
                            next_lit = nl;
                            lit += 2;
                            src[litp.unwrap()] = ((src[litp.unwrap()] as usize & !3) | lit) as u8;
                            copy2(src, src_idx - 2, &mut dst, m_pos, dst_idx - m_pos);

                            state = 4;
                        } else if nl == 0
                            && src[src_idx] < 16
                            && src[src_idx] != 0
                            && ((lit + 2 + src[src_idx] as usize) < 16)
                        {
                            t = src[src_idx] as usize;
                            src_idx += 1;
                            src[litp.unwrap()] &= !3;
                            copy2(src, src_idx - 3 + 1, &mut dst, m_pos, dst_idx - m_pos);
                            *litp.as_mut().unwrap() += 2;

                            if lit > 0 {
                                src.copy_within(
                                    litp.unwrap()..litp.unwrap() + lit,
                                    litp.unwrap() + 1,
                                );
                            }

                            lit += 2 + t + 3;
                            src[litp.unwrap()] = (lit - 3) as u8;

                            dst[dst_idx] = dst[m_pos];
                            dst_idx += 1;
                            m_pos += 1;
                            dst[dst_idx] = dst[m_pos];
                            dst_idx += 1;
                            m_pos += 1;

                            state = 1;
                        } else {
                            state = 4;
                        }
                    }
                } else {
                    state = 5;
                }
            }
            4 => {
                dst[dst_idx] = dst[m_pos];
                dst_idx += 1;
                m_pos += 1;
                dst[dst_idx] = dst[m_pos];
                dst_idx += 1;
                m_pos += 1;

                state = 7;
            }
            5 => {
                if t >= 64 {
                    m_pos = dst_idx - 1;
                    m_pos -= (t >> 2) & 7;
                    m_pos -= (src[src_idx] as usize) << 3;
                    src_idx += 1;
                    t = (t >> 5) - 1;

                    if litp.is_none() {
                        state = 6;
                    } else {
                        nl = src[src_idx - 2] as usize & 3;
                        if t == 1
                            && lit > 3
                            && nl == 0
                            && src[src_idx] < 16
                            && src[src_idx] != 0
                            && ((lit + 3 + src[src_idx] as usize) < 16)
                        {
                            t = src[src_idx] as usize;
                            src_idx += 1;
                            copy3(src, src_idx - 1 - 2, &mut dst, m_pos, dst_idx - m_pos);
                            lit += 3 + t + 3;
                            src[litp.unwrap()] = (lit - 3) as u8;

                            dst[dst_idx] = dst[m_pos];
                            dst_idx += 1;
                            m_pos += 1;
                            dst[dst_idx] = dst[m_pos];
                            dst_idx += 1;
                            m_pos += 1;
                            dst[dst_idx] = dst[m_pos];
                            dst_idx += 1;
                            m_pos += 1;

                            state = 1;
                        } else {
                            state = 6;
                        }
                    }
                } else {
                    if t >= 32 {
                        t &= 31;

                        if t == 0 {
                            t = 31;

                            while src[src_idx] == 0 {
                                t += 255;
                                src_idx += 1;
                            }

                            t += src[src_idx] as usize;
                            src_idx += 1;
                        }

                        m_pos = dst_idx - 1;
                        m_pos -= src[src_idx] as usize >> 2;
                        src_idx += 1;
                        m_pos -= (src[src_idx] as usize) << 6;
                        src_idx += 1;
                    } else {
                        m_pos = dst_idx;
                        m_pos -= (t & 8) << 11;
                        t &= 7;

                        if t == 0 {
                            t = 7;

                            while src[src_idx] == 0 {
                                t += 255;
                                src_idx += 1;
                            }

                            t += src[src_idx] as usize;
                            src_idx += 1;
                        }

                        m_pos -= src[src_idx] as usize >> 2;
                        src_idx += 1;
                        m_pos -= (src[src_idx] as usize) << 6;
                        src_idx += 1;

                        if m_pos == dst_idx {
                            if src_idx < src.len() {
                                panic!();
                            }

                            return;
                        }

                        m_pos -= 0x4000;
                    }

                    if litp.is_none() {
                        state = 6;
                    } else {
                        nl = src[src_idx - 2] as usize & 3;
                        if t == 1 && lit == 0 && nl == 0 && src[src_idx] >= 16 {
                            next_lit = nl;
                            lit += 3;
                            src[litp.unwrap()] = ((src[litp.unwrap()] as usize & !3) | lit) as u8;
                            copy3(src, src_idx - 3, &mut dst, m_pos, dst_idx - m_pos);
                        } else if t == 1
                            && lit <= 3
                            && nl == 0
                            && src[src_idx] < 16
                            && src[src_idx] != 0
                            && ((lit + 3 + src[src_idx] as usize) < 16)
                        {
                            t = src[src_idx] as usize;
                            src_idx += 1;
                            src[litp.unwrap()] &= !3;
                            copy3(src, src_idx - 4 + 1, &mut dst, m_pos, dst_idx - m_pos);
                            *litp.as_mut().unwrap() += 2;

                            if lit > 0 {
                                src.copy_within(
                                    litp.unwrap()..litp.unwrap() + lit,
                                    litp.unwrap() + 1,
                                );
                            }

                            lit += 3 + t + 3;
                            src[litp.unwrap()] = (lit - 3) as u8;

                            dst[dst_idx] = dst[m_pos];
                            dst_idx += 1;
                            m_pos += 1;
                            dst[dst_idx] = dst[m_pos];
                            dst_idx += 1;
                            m_pos += 1;
                            dst[dst_idx] = dst[m_pos];
                            dst_idx += 1;
                            m_pos += 1;

                            state = 1;
                        } else {
                            state = 6;
                        }
                    }
                }
            }
            6 => {
                dst[dst_idx] = dst[m_pos];
                dst_idx += 1;
                m_pos += 1;
                dst[dst_idx] = dst[m_pos];
                dst_idx += 1;
                m_pos += 1;
                dst[dst_idx] = dst[m_pos];
                dst_idx += 1;
                m_pos += 1;
                t -= 1;

                while t > 0 {
                    dst[dst_idx] = dst[m_pos];
                    dst_idx += 1;
                    m_pos += 1;
                    t -= 1;
                }

                state = 7;
            }
            7 => {
                if next_lit == usize::MAX {
                    t = src[src_idx - 2] as usize & 3;
                    lit = t;
                    litp = Some(src_idx - 2);
                } else {
                    t = next_lit;
                }

                next_lit = usize::MAX;

                if t == 0 {
                    state = 0;
                } else {
                    state = 8;
                }
            }
            8 => {
                dst[dst_idx] = src[src_idx];
                dst_idx += 1;
                src_idx += 1;
                t -= 1;

                while t > 0 {
                    dst[dst_idx] = src[src_idx];
                    dst_idx += 1;
                    src_idx += 1;
                    t -= 1;
                }

                t = src[src_idx] as usize;
                src_idx += 1;

                if src_idx >= src.len() || dst_idx > dst.len() {
                    state = 0;
                } else {
                    state = 3;
                }
            }
            _ => unreachable!(),
        }
    }
}

fn copy2(src: &mut [u8], src_idx: usize, dst: &mut [u8], m_pos: usize, off: usize) {
    src[src_idx] = dst[m_pos];

    if off == 1 {
        src[src_idx + 1] = dst[m_pos];
    } else {
        src[src_idx + 1] = dst[m_pos + 1];
    }
}

fn copy3(src: &mut [u8], src_idx: usize, dst: &mut [u8], m_pos: usize, off: usize) {
    src[src_idx] = dst[m_pos];

    if off == 1 {
        src[src_idx + 1] = dst[m_pos];
        src[src_idx + 2] = dst[m_pos];
    } else if off == 2 {
        src[src_idx + 1] = dst[m_pos + 1];
        src[src_idx + 2] = dst[m_pos];
    } else {
        src[src_idx + 1] = dst[m_pos + 1];
        src[src_idx + 2] = dst[m_pos + 2];
    }
}
