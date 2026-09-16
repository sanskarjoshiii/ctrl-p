// Create or update an admin account.
//
//   npm run admin:user -w server -- --email you@example.com --name "Your Name" --role owner
//
// The password can be given with --password, piped on stdin, or left out — in
// which case one is generated and printed once. It is never stored anywhere but
// the hash, so if you lose it, run the command again to set a new one.

import { randomBytes } from 'node:crypto';
import { ROLE_LABELS, type AdminRole } from '../../../shared/admin.ts';
import { hashPassword } from './auth.ts';
import { adminUsers } from './store.ts';

const argv = process.argv.slice(2);
const flag = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8').trim();
}

const email = flag('email')?.trim().toLowerCase();
const name = flag('name')?.trim();
const role = (flag('role') ?? 'owner') as AdminRole;

if (argv.includes('--list')) {
  const users = adminUsers.list();
  if (!users.length) console.log('No admin users yet. Create one with --email and --name.');
  for (const u of users) {
    console.log(`${u.email.padEnd(32)} ${ROLE_LABELS[u.role].padEnd(12)} ${u.active ? 'active' : 'disabled'}  last login ${u.lastLoginAt ?? 'never'}`);
  }
  process.exit(0);
}

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:user -w server -- --email you@example.com --name "Your Name" [--role owner|operations|support] [--password …]');
  console.error('       npm run admin:user -w server -- --list');
  process.exit(2);
}
if (!(role in ROLE_LABELS)) {
  console.error(`--role must be one of ${Object.keys(ROLE_LABELS).join(', ')}`);
  process.exit(2);
}

const existing = adminUsers.rawByEmail(email);
if (!existing && !name) {
  console.error('--name is required when creating a new admin');
  process.exit(2);
}

let password = flag('password') ?? (await readStdin());
let generated = false;
if (!password) {
  password = randomBytes(12).toString('base64url');
  generated = true;
}
if (password.length < 10) {
  console.error('Password must be at least 10 characters');
  process.exit(2);
}

const hash = await hashPassword(password);

if (existing) {
  adminUsers.setPassword(existing.id, hash);
  console.log(`Updated the password for ${email}${existing.role !== role ? ` (role stays ${existing.role} — change it in the team settings)` : ''}`);
} else {
  const user = adminUsers.create(name!, email, hash, role);
  console.log(`Created ${user.email} as ${ROLE_LABELS[user.role]}`);
}

if (generated) console.log(`\nPassword: ${password}\n\nThis is the only time it is shown. Store it in your password manager now.`);
console.log('\nSign in at /admin');
