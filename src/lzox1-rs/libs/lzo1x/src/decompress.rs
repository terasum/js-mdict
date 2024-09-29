// Decompression is based on the following description: https://docs.kernel.org/staging/lzo.html.

use cfg_if::cfg_if;

use super::DecompressError;

enum State {
    A,
    B,
    C,
}

/// Decompress the given `src` into the given `dst`.
///
/// #### Errors
///
/// This function returns an error if the given `src` does not contain valid compressed data,
/// or if the given `dst` does not exactly match the length of the decompressed data.
///
/// # Examples
///
/// ```
/// let data = &[0xaa; 100];
/// let compressed = super::compress(data, super::CompressLevel::default());
///
/// let mut decompressed = vec![0; data.len()];
/// super::decompress(&compressed, &mut decompressed).unwrap();
///
/// assert_eq!(decompressed, data);
/// ```
pub fn decompress(src: &Vec<u8>, dst: &mut Vec<u8>) -> Result<(), DecompressError> {
    let mut src_pos = 0;
    let mut dst_pos = 0;

    if src_pos + 1 > src.len() {
        return Err(DecompressError::InvalidInput);
    }

    let instruction = src[src_pos];

    let mut state = match instruction {
        0..=17 => State::A,
        18..=20 => {
            src_pos += 1;

            let length = (instruction as usize) - 17;

            if src_pos + length > src.len() {
                return Err(DecompressError::InvalidInput);
            }

            if dst_pos + length > dst.len() {
                // TODO: fix here
                dst.resize(dst_pos + length, 0);
                // return Err(DecompressError::OutputLength);
            }

            for _ in 0..length {
                dst[dst_pos] = src[src_pos];
                src_pos += 1;
                dst_pos += 1;
            }

            State::B
        }
        21..=255 => {
            src_pos += 1;

            let length = (instruction as usize) - 17;

            if src_pos + length > src.len() {
                return Err(DecompressError::InvalidInput);
            }

            if dst_pos + length > dst.len() {
                // TODO: fix here
                dst.resize(dst_pos + length, 0);
                // return Err(DecompressError::OutputLength);
            }

            for _ in 0..length {
                dst[dst_pos] = src[src_pos];
                src_pos += 1;
                dst_pos += 1;
            }

            State::C
        }
    };

    loop {
        if src_pos + 1 > src.len() {
            return Err(DecompressError::InvalidInput);
        }

        let instruction = src[src_pos];
        src_pos += 1;

        state = match instruction {
            0..=15 => match state {
                State::A => {
                    if instruction == 0 {
                        let start = src_pos;

                        loop {
                            if src_pos + 1 > src.len() {
                                return Err(DecompressError::InvalidInput);
                            }

                            if src[src_pos] != 0 {
                                break;
                            }

                            src_pos += 1;
                        }

                        let count = src_pos - start;

                        let length = (count * 255) + (src[src_pos] as usize) + 18;
                        src_pos += 1;

                        if src_pos + length > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if dst_pos + length > dst.len() {
                            // TODO: fix here
                            dst.resize(dst_pos + length, 0);
                            // return Err(DecompressError::OutputLength);
                        }

                        dst[dst_pos..dst_pos + length]
                            .copy_from_slice(&src[src_pos..src_pos + length]);
                        src_pos += length;
                        dst_pos += length;

                        State::C
                    } else {
                        let length = (instruction as usize) + 3;

                        if src_pos + length > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if dst_pos + length > dst.len() {
                            // TODO: fix here
                            dst.resize(dst_pos + length, 0);
                            // return Err(DecompressError::OutputLength);
                        }

                        dst[dst_pos..dst_pos + length]
                            .copy_from_slice(&src[src_pos..src_pos + length]);
                        src_pos += length;
                        dst_pos += length;

                        State::C
                    }
                }
                State::B => {
                    if src_pos + 1 > src.len() {
                        return Err(DecompressError::InvalidInput);
                    }

                    let distance =
                        ((src[src_pos] as usize) << 2) + ((instruction >> 2) as usize) + 1;
                    src_pos += 1;

                    if distance > dst_pos {
                        return Err(DecompressError::InvalidInput);
                    }

                    let mut match_pos = dst_pos - distance;

                    if dst_pos + 2 > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + 2, 0);
                        // return Err(DecompressError::OutputLength);
                    }

                    for _ in 0..2 {
                        dst[dst_pos] = dst[match_pos];
                        match_pos += 1;
                        dst_pos += 1;
                    }

                    let state = instruction & 0b00000011;

                    if state == 0 {
                        State::A
                    } else {
                        let length = state as usize;

                        if src_pos + length > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if dst_pos + length > dst.len() {
                            // TODO: fix here
                            dst.resize(dst_pos + length, 0);
                            // return Err(DecompressError::OutputLength);
                        }

                        let src = &src[src_pos..src_pos + length];
                        let dst = &mut dst[dst_pos..dst_pos + length];

                        for (src, dst) in src.iter().zip(dst).take(3) {
                            *dst = *src;
                        }

                        src_pos += length;
                        dst_pos += length;

                        State::B
                    }
                }
                State::C => {
                    if src_pos + 1 > src.len() {
                        return Err(DecompressError::InvalidInput);
                    }

                    let distance =
                        ((src[src_pos] as usize) << 2) + ((instruction >> 2) as usize) + 2049;
                    src_pos += 1;

                    if distance > dst_pos {
                        return Err(DecompressError::InvalidInput);
                    }

                    let mut match_pos = dst_pos - distance;

                    if dst_pos + 3 > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + 3, 0);
                        // return Err(DecompressError::OutputLength);
                    }

                    for _ in 0..3 {
                        dst[dst_pos] = dst[match_pos];
                        match_pos += 1;
                        dst_pos += 1;
                    }

                    let state = instruction & 0b00000011;

                    if state == 0 {
                        State::A
                    } else {
                        let length = state as usize;

                        if src_pos + length > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if dst_pos + length > dst.len() {
                            // TODO: fix here
                            dst.resize(dst_pos + length, 0);
                            // return Err(DecompressError::OutputLength);
                        }

                        let src = &src[src_pos..src_pos + length];
                        let dst = &mut dst[dst_pos..dst_pos + length];

                        for (src, dst) in src.iter().zip(dst).take(3) {
                            *dst = *src;
                        }

                        src_pos += length;
                        dst_pos += length;

                        State::B
                    }
                }
            },
            16..=31 => {
                if (instruction & 0b00000111) == 0 {
                    let start = src_pos;

                    loop {
                        if src_pos + 1 > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if src[src_pos] != 0 {
                            break;
                        }

                        src_pos += 1;
                    }

                    let count = src_pos - start;

                    let length = (count * 255) + (src[src_pos] as usize) + 9;
                    src_pos += 1;

                    if src_pos + 2 > src.len() {
                        return Err(DecompressError::InvalidInput);
                    }

                    let distance = ((((instruction & 0b00001000) >> 3) as usize) << 14)
                        + ((src[src_pos + 1] as usize) << 6)
                        + ((src[src_pos] >> 2) as usize)
                        + 16384;
                    let state = src[src_pos] & 0b00000011;
                    src_pos += 2;

                    if distance == 16384 {
                        break;
                    }

                    if distance > dst_pos {
                        return Err(DecompressError::InvalidInput);
                    }

                    let mut match_pos = dst_pos - distance;

                    if dst_pos + length > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + length, 0);
                        // return Err(DecompressError::OutputLength);
                    }

                    if length <= distance {
                        dst.copy_within(match_pos..match_pos + length, dst_pos);
                        dst_pos += length;
                    } else {
                        for _ in 0..length {
                            dst[dst_pos] = dst[match_pos];
                            match_pos += 1;
                            dst_pos += 1;
                        }
                    }

                    if state == 0 {
                        State::A
                    } else {
                        let length = state as usize;

                        if src_pos + length > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if dst_pos + length > dst.len() {
                            // TODO: fix here
                            dst.resize(dst_pos + length, 0);
                            // return Err(DecompressError::OutputLength);
                        }

                        let src = &src[src_pos..src_pos + length];
                        let dst = &mut dst[dst_pos..dst_pos + length];

                        for (src, dst) in src.iter().zip(dst).take(3) {
                            *dst = *src;
                        }

                        src_pos += length;
                        dst_pos += length;

                        State::B
                    }
                } else {
                    let length = ((instruction & 0b00000111) as usize) + 2;

                    if src_pos + 2 > src.len() {
                        return Err(DecompressError::InvalidInput);
                    }

                    let distance = ((((instruction & 0b00001000) >> 3) as usize) << 14)
                        + ((src[src_pos + 1] as usize) << 6)
                        + ((src[src_pos] >> 2) as usize)
                        + 16384;
                    let state = src[src_pos] & 0b00000011;
                    src_pos += 2;

                    if distance == 16384 {
                        break;
                    }

                    if distance > dst_pos {
                        return Err(DecompressError::InvalidInput);
                    }

                    let mut match_pos = dst_pos - distance;

                    if dst_pos + length > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + length, 0);
                        // return Err(DecompressError::OutputLength);
                    }

                    for _ in 0..length {
                        dst[dst_pos] = dst[match_pos];
                        match_pos += 1;
                        dst_pos += 1;
                    }

                    if state == 0 {
                        State::A
                    } else {
                        let length = state as usize;

                        if src_pos + length > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if dst_pos + length > dst.len() {
                            // TODO: fix here
                            dst.resize(dst_pos + length, 0);
                            // return Err(DecompressError::OutputLength);
                        }

                        let src = &src[src_pos..src_pos + length];
                        let dst = &mut dst[dst_pos..dst_pos + length];

                        for (src, dst) in src.iter().zip(dst).take(3) {
                            *dst = *src;
                        }

                        src_pos += length;
                        dst_pos += length;

                        State::B
                    }
                }
            }
            32..=63 => {
                if (instruction & 0b00011111) == 0 {
                    let start = src_pos;

                    loop {
                        if src_pos + 1 > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if src[src_pos] != 0 {
                            break;
                        }

                        src_pos += 1;
                    }

                    let count = src_pos - start;

                    let length = (count * 255) + (src[src_pos] as usize) + 33;
                    src_pos += 1;

                    if src_pos + 2 > src.len() {
                        return Err(DecompressError::InvalidInput);
                    }

                    let distance =
                        ((src[src_pos + 1] as usize) << 6) + ((src[src_pos] >> 2) as usize) + 1;
                    let state = src[src_pos] & 0b00000011;
                    src_pos += 2;

                    if distance > dst_pos {
                        return Err(DecompressError::InvalidInput);
                    }

                    let mut match_pos = dst_pos - distance;

                    if dst_pos + length > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + length, 0);
                        // return Err(DecompressError::OutputLength);
                    }

                    if length <= distance {
                        dst.copy_within(match_pos..match_pos + length, dst_pos);
                        dst_pos += length;
                    } else {
                        match distance {
                            1 => {
                                let value = dst[match_pos];
                                dst[dst_pos..dst_pos + length].fill(value);
                                dst_pos += length;
                            }
                            5..=8 => {
                                let value: [u8; 8] =
                                    dst[match_pos..match_pos + 8].try_into().unwrap();
                                let end = dst_pos + length;
                                let mut match_dst = &mut dst[dst_pos..end];

                                while match_dst.len() >= 8 {
                                    match_dst[..8].copy_from_slice(&value);
                                    match_pos += distance;
                                    match_dst = &mut match_dst[distance..];
                                }

                                dst_pos += length - match_dst.len();

                                while dst_pos < end {
                                    dst[dst_pos] = dst[match_pos];
                                    match_pos += 1;
                                    dst_pos += 1;
                                }
                            }
                            _ => {
                                for _ in 0..length {
                                    dst[dst_pos] = dst[match_pos];
                                    match_pos += 1;
                                    dst_pos += 1;
                                }
                            }
                        }
                    }

                    if state == 0 {
                        State::A
                    } else {
                        let length = state as usize;

                        if src_pos + length > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if dst_pos + length > dst.len() {
                            // TODO: fix here
                            dst.resize(dst_pos + length, 0);
                            // return Err(DecompressError::OutputLength);
                        }

                        let src = &src[src_pos..src_pos + length];
                        let dst = &mut dst[dst_pos..dst_pos + length];

                        for (src, dst) in src.iter().zip(dst).take(3) {
                            *dst = *src;
                        }

                        src_pos += length;
                        dst_pos += length;

                        State::B
                    }
                } else {
                    let length = ((instruction & 0b00011111) as usize) + 2;

                    if src_pos + 2 > src.len() {
                        return Err(DecompressError::InvalidInput);
                    }

                    cfg_if! {
                        if #[cfg(target_endian = "little")] {
                            let distance = (u16::from_le_bytes(src[src_pos..src_pos+2].try_into().unwrap()) >> 2) as usize + 1;
                        } else {
                            let distance = ((src[src_pos + 1] as usize) << 6) + ((src[src_pos] >> 2) as usize) + 1;
                        }
                    };

                    let state = src[src_pos] & 0b00000011;
                    src_pos += 2;

                    if distance > dst_pos {
                        return Err(DecompressError::InvalidInput);
                    }

                    let mut match_pos = dst_pos - distance;

                    if dst_pos + length > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + length, 0);
                        // return Err(DecompressError::OutputLength);
                    }

                    if length <= distance {
                        dst.copy_within(match_pos..match_pos + length, dst_pos);
                        dst_pos += length;
                    } else {
                        for _ in 0..length {
                            dst[dst_pos] = dst[match_pos];
                            match_pos += 1;
                            dst_pos += 1;
                        }
                    }

                    if state == 0 {
                        State::A
                    } else {
                        let length = state as usize;

                        if src_pos + length > src.len() {
                            return Err(DecompressError::InvalidInput);
                        }

                        if dst_pos + length > dst.len() {
                            // TODO: fix here
                            dst.resize(dst_pos + length, 0);
                            // return Err(DecompressError::OutputLength);
                        }

                        let src = &src[src_pos..src_pos + length];
                        let dst = &mut dst[dst_pos..dst_pos + length];

                        for (src, dst) in src.iter().zip(dst).take(3) {
                            *dst = *src;
                        }

                        src_pos += length;
                        dst_pos += length;

                        State::B
                    }
                }
            }
            64..=127 => {
                let is_length_4 = instruction & 0b00100000 != 0;

                if src_pos + 1 > src.len() {
                    return Err(DecompressError::InvalidInput);
                }

                let distance = ((src[src_pos] as usize) << 3)
                    + (((instruction & 0b00011100) >> 2) as usize)
                    + 1;
                src_pos += 1;

                if distance > dst_pos {
                    return Err(DecompressError::InvalidInput);
                }

                let mut match_pos = dst_pos - distance;

                if is_length_4 {
                    let mut value =
                        u32::from_ne_bytes(dst[match_pos..match_pos + 4].try_into().unwrap());

                    match distance {
                        1 => value = (value & 0x000000ff).wrapping_mul(0x01010101),
                        2 => value = (value & 0x0000ffff).wrapping_mul(0x00010001),
                        3 => value = (value & 0x00ffffff).wrapping_mul(0x01000001),
                        _ => {}
                    }

                    if dst_pos + 4 > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + 4, 0);
                        // return Err(DecompressError::OutputLength);
                    }

                    dst[dst_pos..dst_pos + 4].copy_from_slice(&value.to_ne_bytes());
                    dst_pos += 4;
                } else {
                    if dst_pos + 3 > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + 3,0);
                        // return Err(DecompressError::OutputLength);
                    }

                    for _ in 0..3 {
                        dst[dst_pos] = dst[match_pos];
                        match_pos += 1;
                        dst_pos += 1;
                    }
                }

                let state = instruction & 0b00000011;

                if state == 0 {
                    State::A
                } else {
                    let length = state as usize;

                    if src_pos + length > src.len() {
                        return Err(DecompressError::InvalidInput);
                    }

                    if dst_pos + length > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + length, 0);
                        // return Err(DecompressError::OutputLength);
                    }

                    let src = &src[src_pos..src_pos + length];
                    let dst = &mut dst[dst_pos..dst_pos + length];

                    for (src, dst) in src.iter().zip(dst).take(3) {
                        *dst = *src;
                    }

                    src_pos += length;
                    dst_pos += length;

                    State::B
                }
            }
            128..=255 => {
                let length = (((instruction & 0b01100000) >> 5) as usize) + 5;

                if src_pos + 1 > src.len() {
                    return Err(DecompressError::InvalidInput);
                }

                let distance = ((src[src_pos] as usize) << 3)
                    + (((instruction & 0b00011100) >> 2) as usize)
                    + 1;
                src_pos += 1;

                if distance > dst_pos {
                    return Err(DecompressError::InvalidInput);
                }

                let mut match_pos = dst_pos - distance;

                if dst_pos + length > dst.len() {
                    // TODO: fix here
                    dst.resize(dst_pos + length, 0);
                    // return Err(DecompressError::OutputLength);
                }

                if length <= distance {
                    dst.copy_within(match_pos..match_pos + length, dst_pos);
                    dst_pos += length;
                } else {
                    for _ in 0..length {
                        dst[dst_pos] = dst[match_pos];
                        match_pos += 1;
                        dst_pos += 1;
                    }
                }

                let state = instruction & 0b00000011;

                if state == 0 {
                    State::A
                } else {
                    let length = state as usize;

                    if src_pos + length > src.len() {
                        return Err(DecompressError::InvalidInput);
                    }

                    if dst_pos + length > dst.len() {
                        // TODO: fix here
                        dst.resize(dst_pos + length, 0);
                        // return Err(DecompressError::OutputLength);
                    }

                    let src = &src[src_pos..src_pos + length];
                    let dst = &mut dst[dst_pos..dst_pos + length];

                    for (src, dst) in src.iter().zip(dst).take(3) {
                        *dst = *src;
                    }

                    src_pos += length;
                    dst_pos += length;

                    State::B
                }
            }
        }
    }

    if src_pos != src.len() {
        return Err(DecompressError::InvalidInput);
    }

    if dst_pos != dst.len() {
        dst.truncate(dst_pos);
    }

    Ok(())
}
