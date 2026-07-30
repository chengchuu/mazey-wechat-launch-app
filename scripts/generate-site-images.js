const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const outputDirectory = path.resolve(__dirname, '..', 'images');

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  name.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return result;
}

function createPng(width, height, pixel) {
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(width * 4 + 1);
    for (let x = 0; x < width; x += 1) {
      const color = pixel(x, y);
      row.set(color, x * 4 + 1);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function logoPixel(width, height, maskable = false) {
  const scale = Math.min(width, height);
  const left = (width - scale) / 2;
  const top = (height - scale) / 2;
  return (x, y) => {
    const localX = (x - left) / scale;
    const localY = (y - top) / scale;
    const inBubble =
      localX >= 0.14 && localX <= 0.78 && localY >= 0.19 && localY <= 0.68;
    const inTail =
      localY >= 0.64 &&
      localY <= 0.81 &&
      localX >= 0.25 &&
      localX <= 0.45 &&
      localX <= 0.82 - localY / 2;
    const inArrow =
      localX >= 0.43 &&
      localX <= 0.82 &&
      localY >= 0.34 &&
      localY <= 0.56 &&
      (localX <= 0.67 || Math.abs(localY - 0.45) <= 0.82 - localX);
    if (inArrow) return [255, 255, 255, 255];
    if (inBubble || inTail) return [8, 127, 91, 255];
    return maskable ? [245, 250, 248, 255] : [0, 0, 0, 0];
  };
}

function writeImage(file, width, height, pixel) {
  writeFileSync(
    path.join(outputDirectory, file),
    createPng(width, height, pixel)
  );
}

function generateSiteImages() {
  mkdirSync(outputDirectory, { recursive: true });
  writeImage('icon-192.png', 192, 192, logoPixel(192, 192));
  writeImage('icon-512.png', 512, 512, logoPixel(512, 512));
  writeImage('icon-maskable-512.png', 512, 512, logoPixel(512, 512, true));
  writeImage('open-graph-1200x630.png', 1200, 630, logoPixel(1200, 630, true));
}

if (require.main === module) generateSiteImages();

module.exports = { createPng, generateSiteImages };
