import { logger } from "../utils";
import type { Client } from "../client";
import type { NightfallZkpKeys } from "../nightfall/types";
import type { TransactionResult } from "./types";

/**
 * Handle the flow for token burning transaction (tx)
 * FYI This is a Nightfall native transaction
 *
 * @async
 * @function createBurnTx
 * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of Zero-knowledge proof keys
 * @param {Client} client An instance of Client to interact with the API
 * @param {string} tokenAddress Token address of the token to be burnt in L2
 * @param {string} value The amount in Wei of the token to be burnt
 * @param {string} tokenId The tokenId of the token to be burnt
 * @param {string} fee Proposer payment in Wei for the tx in L2
 * @returns {Promise<TransactionResult>}
 */
export async function createBurnTx(
  ownerZkpKeys: NightfallZkpKeys,
  client: Client,
  tokenAddress: string,
  value: string,
  tokenId: string,
  fee: string,
): Promise<TransactionResult> {
  logger.debug("createBurnTx");

  const resData = await client.burn(
    ownerZkpKeys,
    tokenAddress,
    value,
    tokenId,
    fee,
  );
  const txReceiptL2 = resData.transaction;

  return { txReceiptL2 };
}
