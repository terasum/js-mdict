#!/usr/bin/env python3
import struct


# Input bytes
int8_bytes = [0, 0, 0, 0, 0, 0, 9, 179]

# Convert the list to a uint64
uint64_value = struct.unpack('<Q', bytes(int8_bytes))[0]  # '>Q' for big-endian unsigned 64-bit
print(uint64_value)
