// src/lib/generateUniqueName.ts

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";



/**
 * Generates a unique name in the format: `${mainName}_${3 random chars}`
 * Random chars are drawn from 0-9 and A-Z (36 options each → 46656 combos).
 * Main name is used as-is (spaces preserved).
 */



export function generateUniqueName(mainName: string): string {
  let suffix = "";
  for (let i = 0; i < 3; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `${mainName}_${suffix}`;
}