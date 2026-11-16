import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
const rl = readline.createInterface({ input, output });
const password = await rl.question("Yangi admin parolini kiriting: ");
rl.close();
if (password.length < 12) {
  console.error("Xavfsizlik uchun parol kamida 12 ta belgidan iborat bo‘lsin.");
  process.exit(1);
}
console.log("\nADMIN_PASSWORD_HASH=" + await bcrypt.hash(password, 12));
