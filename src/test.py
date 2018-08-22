#!/usr/bin/env python
# -*- coding: utf-8 -*-
from struct import pack, unpack
from io import BytesIO
import re
import sys
import json

# from ripemd128 import ripemd128
# from pureSalsa20 import Salsa20

# zlib compression is used for engine version >=2.0
import zlib
# LZO compression is used for engine version < 2.0

if __name__ == '__main__':
  f = open('mdx/oale8.mdx')
  f.seek(844087)
  b = f.read(6295)
  bd = zlib.decompress(b[8:])
  # for mdx
  print(bd[63414:63431].decode('utf-8'))

  # for mdd
  # open("test2.jpg","wb").write(bd)
  f.close()
