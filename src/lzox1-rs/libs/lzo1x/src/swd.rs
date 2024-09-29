use crate::{
    compress_999::Compress,
    config::{M3_MAX_LEN, M4_MAX_OFFSET},
};

const SWD_N: usize = M4_MAX_OFFSET;
pub const SWD_THRESHOLD: usize = 1;
pub const SWD_F: usize = 2048;
const SWD_BEST_OFF: usize = M3_MAX_LEN + 1;

const SWD_HSIZE: usize = 16384;
pub const SWD_MAX_CHAIN: usize = 2048;

const NIL2: u16 = u16::MAX;

pub struct Swd {
    swd_f: usize,
    pub max_chain: usize,
    pub nice_length: usize,
    pub use_best_off: bool,
    pub m_len: usize,
    pub m_off: usize,
    pub look: usize,
    pub b_char: i32,
    pub best_off: [usize; SWD_BEST_OFF],
    m_pos: usize,
    pub best_pos: [usize; SWD_BEST_OFF],
    ip: usize,
    bp: usize,
    rp: usize,
    b_size: usize,
    b_wrap: usize,
    node_count: usize,
    b: [u8; SWD_N + SWD_F + SWD_F],
    head3: [u16; SWD_HSIZE],
    succ3: [u16; SWD_N + SWD_F],
    best3: [u16; SWD_N + SWD_F],
    llen3: [u16; SWD_HSIZE],
    head2: [u16; 65536],
}

impl Swd {
    pub fn new(c: &mut Compress) -> Self {
        let mut ip = 0;

        let mut look = c.src.len() - c.src_idx;

        let mut b = [0; SWD_N + SWD_F + SWD_F];

        if look > 0 {
            if look > SWD_F {
                look = SWD_F;
            }

            b[ip..ip + look].copy_from_slice(&c.src[c.src_idx..c.src_idx + look]);
            c.src_idx += look;
            ip += look;
        }

        if ip == SWD_N + SWD_F {
            ip = 0;
        }

        let mut rp = 0;

        if rp >= SWD_N {
            rp -= SWD_N;
        } else {
            rp += (SWD_N + SWD_F) - SWD_N;
        }

        if look < 3 {
            b[look] = 0;
            b[look + 1] = 0;
            b[look + 2] = 0;
        }

        Self {
            swd_f: SWD_F,
            max_chain: SWD_MAX_CHAIN,
            nice_length: SWD_F,
            use_best_off: false,
            m_len: 0,
            m_off: 0,
            look,
            b_char: 0,
            best_off: [0; SWD_BEST_OFF],
            m_pos: 0,
            best_pos: [0; SWD_BEST_OFF],
            ip,
            bp: 0,
            rp,
            b_size: SWD_N + SWD_F,
            b_wrap: SWD_N + SWD_F,
            node_count: SWD_N,
            b,
            head3: [0; SWD_HSIZE],
            succ3: [0; SWD_N + SWD_F],
            best3: [0; SWD_N + SWD_F],
            llen3: [0; SWD_HSIZE],
            head2: [0xffff; 65536],
        }
    }

    fn remove_node(&mut self, node: usize) {
        if self.node_count == 0 {
            let key = head3(&self.b, node);

            self.llen3[key] -= 1;

            let key = head2(&self.b, node);

            if self.head2[key] as usize == node {
                self.head2[key] = NIL2;
            }
        } else {
            self.node_count -= 1;
        }
    }

    fn search(&mut self, mut node: usize, cnt: usize) {
        let mut m_len = self.m_len;
        let b = &mut self.b;
        let bp = self.bp;
        let bx = self.bp + self.look;
        let succ3 = &self.succ3;

        let mut scan_end1 = b[bp + m_len - 1];

        for _ in 0..cnt {
            let mut p1 = bp;
            let mut p2 = node;
            let px = bx;

            if b[p2 + m_len - 1] == scan_end1
                && b[p2 + m_len] == b[p1 + m_len]
                && b[p2] == b[p1]
                && b[p2 + 1] == b[p1 + 1]
            {
                p1 += 2;
                p2 += 2;

                loop {
                    p1 += 1;

                    if p1 >= px {
                        break;
                    }

                    p2 += 1;

                    if b[p1] != b[p2] {
                        break;
                    }
                }

                let i = p1 - bp;

                if i < SWD_BEST_OFF && self.best_pos[i] == 0 {
                    self.best_pos[i] = node + 1;
                }

                if i > m_len {
                    m_len = i;
                    self.m_len = m_len;
                    self.m_pos = node;

                    if m_len == self.look {
                        return;
                    }

                    if m_len >= self.nice_length {
                        return;
                    }

                    if m_len > self.best3[node] as usize {
                        return;
                    }

                    scan_end1 = b[bp + m_len - 1];
                }
            }

            node = succ3[node] as usize
        }
    }

    fn search2(&mut self) -> bool {
        let key = self.head2[head2(&self.b, self.bp)];

        if key == NIL2 {
            return false;
        }

        if self.best_pos[2] == 0 {
            self.best_pos[2] = key as usize + 1;
        }

        if self.m_len < 2 {
            self.m_len = 2;
            self.m_pos = key as usize;
        }

        true
    }

    pub fn find_best(&mut self) {
        let key = head3(&self.b, self.bp);

        let node = s_get_head3(self, key);
        self.succ3[self.bp] = node;
        let mut cnt = self.llen3[key] as usize;
        self.llen3[key] += 1;

        if cnt > self.max_chain && self.max_chain > 0 {
            cnt = self.max_chain;
        }

        self.head3[key] = self.bp as u16;

        self.b_char = self.b[self.bp] as i32;
        let len = self.m_len;

        if self.m_len >= self.look {
            if self.look == 0 {
                self.b_char = -1;
            }

            self.m_off = 0;
            self.best3[self.bp] = (self.swd_f + 1) as u16;
        } else {
            if self.search2() && self.look >= 3 {
                self.search(node as usize, cnt);
            }

            if self.m_len > len {
                self.m_off = swd_pos2off(self, self.m_pos);
            }

            self.best3[self.bp] = self.m_len as u16;

            if self.use_best_off {
                for i in 2..SWD_BEST_OFF {
                    if self.best_pos[i] > 0 {
                        self.best_off[i] = swd_pos2off(self, self.best_pos[i] - 1);
                    } else {
                        self.best_off[i] = 0;
                    }
                }
            }
        }

        self.remove_node(self.rp);

        let key = head2(&self.b, self.bp);
        self.head2[key] = self.bp as u16;
    }

    pub fn accept(&mut self, c: &mut Compress, mut n: usize) {
        while n != 0 {
            self.remove_node(self.rp);

            let key = head3(&self.b, self.bp);

            self.succ3[self.bp] = if self.llen3[key] == 0 {
                u16::MAX
            } else {
                self.head3[key] as u16
            };

            self.head3[key] = self.bp as u16;
            self.best3[self.bp] = (self.swd_f + 1) as u16;
            self.llen3[key] += 1;

            let key = head2(&self.b, self.bp);
            self.head2[key] = self.bp as u16;

            self.get_byte(c);

            n -= 1;
        }
    }

    pub fn get_byte(&mut self, c: &mut Compress) {
        let ch = if c.src_idx < c.src.len() {
            let ch = c.src[c.src_idx];
            c.src_idx += 1;
            ch as i16
        } else {
            -1
        };

        if ch < 0 {
            if self.look > 0 {
                self.look -= 1;
            }

            self.b[self.ip] = 0;

            if self.ip < self.swd_f {
                self.b[self.b_wrap + self.ip] = 0;
            }
        } else {
            self.b[self.ip] = ch as u8;

            if self.ip < self.swd_f {
                self.b[self.b_wrap + self.ip] = ch as u8;
            }
        }

        self.ip += 1;

        if self.ip == self.b_size {
            self.ip = 0;
        }

        self.bp += 1;

        if self.bp == self.b_size {
            self.bp = 0;
        }

        self.rp += 1;

        if self.rp == self.b_size {
            self.rp = 0;
        }
    }
}

fn head3(b: &[u8], p: usize) -> usize {
    ((0x9f5f * (((((b[p] as usize) << 5) ^ b[p + 1] as usize) << 5) ^ b[p + 2] as usize)) >> 5)
        & (SWD_HSIZE - 1)
}

fn head2(b: &[u8], p: usize) -> usize {
    b[p] as usize ^ ((b[(p) + 1] as usize) << 8)
}

fn swd_pos2off(s: &Swd, pos: usize) -> usize {
    if s.bp > (pos) {
        s.bp - (pos)
    } else {
        s.b_size - ((pos) - s.bp)
    }
}

fn s_get_head3(s: &Swd, key: usize) -> u16 {
    if s.llen3[key] == 0 {
        u16::MAX
    } else {
        s.head3[key]
    }
}
