// ABOUTME: CI scanner that fails when PHI keywords appear inside console.* calls in edge functions.
// ABOUTME: Walks supabase/functions/**/*.ts and matches against scripts/security/phi-keywords.json.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SCAN_DIR = join(ROOT, 'supabase', 'functions');
const KEYWORDS = JSON.parse(
  readFileSync(join(__dirname, 'phi-keywords.json'), 'utf8'),
).map((k) => k.toLowerCase());

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

// Match console.<method>( ... ) including multi-line argument lists by
// tracking parenthesis depth from the opening '(' after the method name.
function findConsoleCalls(source) {
  const calls = [];
  const re = /console\.(log|info|warn|error|debug)\s*\(/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    let inStr = null;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (inStr) {
        if (ch === '\\') { i += 2; continue; }
        if (ch === inStr) inStr = null;
      } else {
        if (ch === '"' || ch === "'" || ch === '`') inStr = ch;
        else if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      i++;
    }
    const argText = source.slice(start, i - 1);
    const lineNum = source.slice(0, m.index).split('\n').length;
    calls.push({ argText, line: lineNum });
  }
  return calls;
}

const files = walk(SCAN_DIR);
const violations = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const call of findConsoleCalls(source)) {
    const lower = call.argText.toLowerCase();
    for (const kw of KEYWORDS) {
      // Word-ish boundary so 'address' doesn't match 'IPaddress' inside larger ids.
      const pattern = new RegExp(`(^|[^a-z0-9_])${kw}([^a-z0-9_]|$)`, 'i');
      if (pattern.test(lower)) {
        violations.push({ file: file.replace(ROOT + '/', ''), line: call.line, keyword: kw });
        break;
      }
    }
  }
}

if (violations.length > 0) {
  console.error('PHI keywords detected in edge function console.* calls:');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} -> "${v.keyword}"`);
  }
  console.error(`\n${violations.length} violation(s). Remove or redact PHI from logs.`);
  process.exit(1);
}

console.log(`PHI log scan passed. Checked ${files.length} edge function file(s).`);
