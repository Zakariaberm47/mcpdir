/**
 * Generate favicon and PWA icons from SVG
 * Run: pnpm add -D sharp && tsx scripts/generate-icons.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

async function generateIcons() {
  const sharp = await import("sharp").catch(() => {
    console.error("Please install sharp first: pnpm add -D sharp");
    process.exit(1);
  });

  const publicDir = join(process.cwd(), "public");
  const svgPath = join(publicDir, "favicon.svg");

  if (!existsSync(svgPath)) {
    console.error("favicon.svg not found in public/");
    process.exit(1);
  }

  const svgBuffer = readFileSync(svgPath);

  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
  ];

  for (const { name, size } of sizes) {
    await sharp
      .default(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, name));
    console.log(`Generated ${name}`);
  }

  // Generate favicon.ico (32x32)
  const ico32 = await sharp.default(svgBuffer).resize(32, 32).png().toBuffer();
  writeFileSync(join(publicDir, "favicon.ico"), ico32);
  console.log("Generated favicon.ico");

  console.log("\nAll icons generated successfully!");
}

generateIcons();
