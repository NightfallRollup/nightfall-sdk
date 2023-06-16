import { logger } from "../utils";
import type { Client } from "../client";
import type { NightfallZkpKeys } from "../nightfall/types";
import type { TransactionResult } from "./types";

/**
 * Handle the flow for tokenisation transaction (tx)
 * FYI This is a Nightfall native transaction
 *
 * @async
 * @function createTokeniseTx
 * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of Zero-knowledge proof keys
 * @param {Client} client An instance of Client to interact with the API
 * @param {string} tokenContractAddress Token address to be minted in L2
 * @param {string} value The amount in Wei of the token to be minted
 * @param {string} tokenId The tokenId of the token to be minted
 * @param {string} fee Proposer payment in Wei for the tx in L2
 * @param {string[] | []} [providedCommitmentsFee] Commitments to be used to pay fee
 * @param {string} [salt]  Salt to be added to the newly created deposit commitment
 * @returns {Promise<TransactionResult>}
 */
export async function createTokeniseTx(
  ownerZkpKeys: NightfallZkpKeys,
  client: Client,
  tokenContractAddress: string,
  value: string,
  tokenId: string,
  fee: string,
  providedCommitmentsFee?: string[] | [],
  salt?: string | undefined,
): Promise<TransactionResult> {
  logger.debug("createTokeniseTx");

  const resData = await client.tokenise(
    ownerZkpKeys,
    tokenContractAddress,
    value,
    tokenId,
    fee,
    providedCommitmentsFee ?? [],
    salt,
  );
  const txReceiptL2 = resData.transaction;

  return { txReceiptL2 };
}
