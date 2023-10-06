import gen from "general-number";
import crypto from "crypto";
import { BN128_GROUP_ORDER } from "../commitment/constants";

const { GN, generalise } = gen;

/**
 * Simple routine to create a cryptographically sound random
 *
 * @async
 * @function rand
 * @param {string} number number of bytes in random number
 * @returns {Promise<BigInt>}
 */
async function rand(bytes: number): Promise<bigint> {
  const buf = await crypto.randomBytes(bytes);
  return new GN(buf.toString("hex"), "hex").bigInt;
}

/**
 * Rejection sampling for a value < maxVale
 *
 * @async
 * @function randValueLT
 * @param {bigint} maxValue Maximum possible value
 * @returns {Promise<string>}
 */
async function randValueLT(maxValue: bigint): Promise<string> {
  let genVal = BigInt(0);
  const zero = BigInt(0);
  const bigIntValue = maxValue;
  const MAX_ATTEMPTS = 10000;
  const minimumBytes = Math.ceil(new GN(bigIntValue).binary.length / 8);
  let counter = 0;
  do {
    // eslint-disable-next-line no-await-in-loop
    genVal = await rand(minimumBytes);
    counter++;
  } while (
    (genVal >= bigIntValue || genVal === zero) &&
    counter < MAX_ATTEMPTS
  );
  if (counter === MAX_ATTEMPTS)
    throw new Error("Couldn't make a number below target value");
  return "0x" + genVal.toString(16);
}

/**
 * Generates a random L2 Token address where bits 253 and 252 are set to 1
 * and bits 160 - 192 set to 0.
 *
 * @async
 * @function randomL2TokenAddress
 * @returns {string} Valid L2 Token Address
 */
export async function randomL2TokenAddress(): Promise<string> {
  // random address is less than 1 << 160
  const randomAddress = await randValueLT(
    1461501637330902918203684832716283019655932542976n,
  );
  // set bits 253 and 252 to 1
  return generalise(
    BigInt(randomAddress) +
      21711016731996786641919559689128982722488122124807605757398297001483711807488n,
  ).hex(32);
}

/**
 * Generate random number in BN128_GROUP_ORDER
 *
 * @async
 * @function randomSalt
 * @returns {string} Valid salt
 */
export async function randomSalt(): Promise<string> {
  return randValueLT(BN128_GROUP_ORDER);
}
