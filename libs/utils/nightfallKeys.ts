import { validateOrCreateNfMnemonic } from "../nightfall";
import { Client } from "../client";
import type { NightfallKeys } from "../nightfall/types";

/**
 * Derive a set of zero-knowledge proof keys (zkpKeys) from given/new mnemonic
 *
 * @function createZkpKeys
 * @param {string} clientApiUrl URL of a running Nightfall Client
 * @param {string} [mnemonic] Optionally, a bip39 mnemonic
 * @throws {NightfallSdkError} Something went wrong
 * @returns {NightfallKeys} mnemonic + set of zkpKeys
 */
export async function createZkpKeys(
  clientApiUrl: string,
  mnemonic?: undefined | string,
): Promise<NightfallKeys> {
  const client = new Client(clientApiUrl);

  const nightfallMnemonic = validateOrCreateNfMnemonic(mnemonic);

  const mnemonicAddressIdx = 0;
  const zkpKeys = await client.generateZkpKeysFromMnemonic(
    nightfallMnemonic,
    mnemonicAddressIdx,
  );

  return {
    nightfallMnemonic,
    zkpKeys,
  };
}
