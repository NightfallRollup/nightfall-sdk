/* eslint-disable no-bitwise */
// This module mostly takes some useful functions from:
// https://github.com/rsandor/number-theory
// but converts them for BigInt (the original library is limited to <2**52)
// We are very grateful for the original work by rsandor

function addMod(addMe: any, m: bigint) {
  return addMe.reduce(
    (e: bigint, acc: bigint) => (((e + m) % m) + acc) % m,
    BigInt(0),
  );
}

function mulMod(timesMe: any, m: bigint) {
  return timesMe.reduce(
    (e: bigint, acc: bigint) => (((e + m) % m) * acc) % m,
    BigInt(1),
  );
}

function powerMod(base: bigint, exponent: bigint, m: bigint) {
  if (m === BigInt(1)) return BigInt(0);
  let result = BigInt(1);
  let b = (base + m) % m; // add m in case it's negative: % gives the remainder, not the mod
  let e = exponent;
  while (e > BigInt(0)) {
    if (e % BigInt(2) === BigInt(1)) result = (result * BigInt(b)) % BigInt(m);
    e >>= BigInt(1); // eslint-disable-line no-bitwise
    b = (b * b) % m;
  }
  return result;
}

function jacobiSymbol(_a: bigint, _b: bigint) {
  let a = _a;
  let b = _b;
  if (b % BigInt(2) === BigInt(0)) return NaN;
  if (b < BigInt(0)) return NaN;

  // (a on b) is independent of equivalence class of a mod b
  if (a < BigInt(0)) a = (a % b) + b;

  // flips just tracks parity, so I xor terms with it and end up looking at the
  // low order bit
  let flips = 0;
  // TODO Refactor while loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    a %= b;
    // (0 on b) = 0
    if (a === BigInt(0)) return 0;
    // Calculation of (2 on b)
    while (a % BigInt(2) === BigInt(0)) {
      // b could be so large that b*b overflows
      flips ^= Number(
        ((b % BigInt(8)) * (b % BigInt(8)) - BigInt(1)) / BigInt(8),
      ); // eslint-disable-line no-bitwise
      a /= BigInt(2);
    }

    // (1 on b) = 1
    if (a === BigInt(1)) {
      // look at the low order bit of flips to extract parity of total flips
      return flips & 1 ? -1 : 1; // eslint-disable-line no-bitwise
    }

    // Now a and b are coprime and odd, so "QR" applies
    // By reducing modulo 4, I avoid the possibility that (a-1)*(b-1) overflows
    flips ^= Number(
      (((a % BigInt(4)) - BigInt(1)) * ((b % BigInt(4)) - BigInt(1))) /
        BigInt(4),
    ); // eslint-disable-line no-bitwise

    const temp = a;
    a = b;
    b = temp;
  }
}

function quadraticNonresidue(p: bigint) {
  const SAFELOOP = 100000;
  const q = SAFELOOP < p ? SAFELOOP : p;
  for (let x = BigInt(2); x < q; x++) {
    if (jacobiSymbol(x, p) === -1) return x;
  }
  throw new Error("No quadratic nonresidue found");
}

function squareRootModPrime(n: bigint, p: bigint) {
  if (jacobiSymbol(n, p) === 0) return BigInt(0);

  if (jacobiSymbol(n, p) !== 1) return NaN;

  let Q = p - BigInt(1);
  let S = BigInt(0);
  while (Q % BigInt(2) === BigInt(0)) {
    Q /= BigInt(2);
    S++;
  }

  // Now p - 1 = Q 2^S and Q is odd.
  if (p % BigInt(4) === BigInt(3)) {
    return powerMod(n, (p + BigInt(1)) / BigInt(4), p);
  }
  // So S != 1 (since in that case, p equiv 3 mod 4
  const z = quadraticNonresidue(p);
  let c = powerMod(z, Q, p);
  let R = powerMod(n, (Q + BigInt(1)) / BigInt(2), p);
  let t = powerMod(n, Q, p);
  let M = S;
  // TODO Refactor while loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (((t % BigInt(p)) + BigInt(p)) % p === BigInt(1)) return R;

    // Find the smallest i (0 < i < M) such that t^{2^i} = 1
    let u = t;
    let i;
    for (i = BigInt(1); i < M; i++) {
      u = (((u * u) % BigInt(p)) + BigInt(p)) % BigInt(p);
      if (u === BigInt(1)) break;
    }

    const minimumI = i;
    i++;

    // Set b = c^{2^{M-i-1}}
    let b = c;
    while (i < M) {
      b = (((b * b) % BigInt(p)) + BigInt(p)) % BigInt(p);
      i++;
    }

    M = minimumI;
    R = (((R * b) % BigInt(p)) + BigInt(p)) % BigInt(p);
    t = (((t * b * b) % BigInt(p)) + BigInt(p)) % BigInt(p);
    c = (((b * b) % BigInt(p)) + BigInt(p)) % BigInt(p);
  }
}

// These exports are not unused, but find-unused-exports linter will complain because they are not used
// within the common-files folder, hence the special disable line below.
/* ignore unused exports */
export { squareRootModPrime, addMod, mulMod, powerMod };
