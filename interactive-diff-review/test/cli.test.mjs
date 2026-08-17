import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const executable = join(here, "..", "scripts", "review.mjs");

test("CLI help documents the deterministic review inputs and output controls", () => {
  const output = execFileSync(process.execPath, [executable, "--help"], { encoding: "utf8" });

  assert.match(output, /--repo <path>/);
  assert.match(output, /--base <revision>/);
  assert.match(output, /--candidate <revision>/);
  assert.match(output, /--path <path>/);
  assert.match(output, /--theme <theme\.css>/);
  assert.match(output, /--output-dir <path>/);
  assert.match(output, /--no-open/);
});
