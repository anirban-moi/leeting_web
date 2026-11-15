import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Simple CRC32 implementation for PNG chunks
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcPayload, crcBuf]);
}

function generatePng(size) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image raster data: 1 filter byte per row + (width * 4) bytes
  const rowBytes = 1 + size * 4;
  const rawData = Buffer.alloc(rowBytes * size);

  // Colors: Background dark (#1A1A1A), Accent LeetCode orange (#FFA116)
  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Draw a rounded square border or central icon
      const centerDist = Math.hypot(x - size / 2, y - size / 2);
      const isInsideCircle = centerDist < (size * 0.45);
      const isOrangeCore = centerDist < (size * 0.3);

      if (isOrangeCore) {
        // Orange #FFA116
        rawData[pixelOffset] = 0xff;
        rawData[pixelOffset + 1] = 0xa1;
        rawData[pixelOffset + 2] = 0x16;
        rawData[pixelOffset + 3] = 0xff;
      } else if (isInsideCircle) {
        // Dark #262626
        rawData[pixelOffset] = 0x26;
        rawData[pixelOffset + 1] = 0x26;
        rawData[pixelOffset + 2] = 0x26;
        rawData[pixelOffset + 3] = 0xff;
      } else {
        // Transparent outside
        rawData[pixelOffset] = 0x00;
        rawData[pixelOffset + 1] = 0x00;
        rawData[pixelOffset + 2] = 0x00;
        rawData[pixelOffset + 3] = 0x00;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve(process.cwd(), 'public/icon');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  const png = generatePng(size);
  fs.writeFileSync(path.join(outDir, `${size}.png`), png);
  console.log(`Generated icon ${size}x${size}`);
}
