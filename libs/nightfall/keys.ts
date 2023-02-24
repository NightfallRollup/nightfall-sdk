import { logger, NightfallSdkError } from "../utils";
import { createMnemonic, validateNfMnemonic } from "./helpers";
import type { Client } from "../client";
import type { NightfallKeys } from "./types";

/**
 * Create a bip39 mnemonic if none was given, else validate according to bip39
 *
 * @function validateOrCreateNfMnemonic
 * @param {string} mnemonic
 * @throws {NightfallSdkError} Given mnemonic is not bip39
 * @returns {string} bip39 mnemonic
 */
export function validateOrCreateNfMnemonic(
  mnemonic: undefined | string,
): string {
  logger.debug("validateOrCreateNfMnemonic");
  if (!mnemonic) {
    mnemonic = createMnemonic();
    logger.debug("New mnemonic created successfully");
  } else {
    try {
      validateNfMnemonic(mnemonic);
    } catch (err) {
      logger.child({ mnemonic }).error(err, "Error while validating mnemonic");
      throw new NightfallSdkError(err);
    }
    logger.debug("Valid mnemonic");
  }
  return mnemonic;
}

/**
 * Derive a set of zero-knowledge proof keys from given/new mnemonic,
 * then subscribe to incoming viewing keys
 *
 * @function createZkpKeysAndSubscribeToIncomingKeys
 * @param {string} mnemonic
 * @param {Client} client an instance of Client to interact with the API
 * @throws {NightfallSdkError} Something went wrong
 * @returns {NightfallKeys} NightfallKeys if the mnemonic is new or given one is valid
 */
export async function createZkpKeysAndSubscribeToIncomingKeys(
  mnemonic: undefined | string,
  client: Client,
): Promise<NightfallKeys> {
  logger.debug("createZkpKeysAndSubscribeToIncomingKeys");

  const nightfallMnemonic = validateOrCreateNfMnemonic(mnemonic);

  logger.debug("Generate ZKP keys from mnemonic");
  const mnemonicAddressIdx = 0;
  const zkpKeys = await client.generateZkpKeysFromMnemonic(
    nightfallMnemonic,
    mnemonicAddressIdx,
  );

  logger.debug("Subscribe to incoming viewing keys");
  await client.subscribeToIncomingViewingKeys(zkpKeys);

  return {
    nightfallMnemonic,
    zkpKeys,
  };
}
