/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "../utils";
import type { Client } from "../client";
import type { NightfallZkpKeys } from "../nightfall/types";
import type { TransactionResult } from "./types";
import { L2Token } from "libs/user/types";

/**
 * Handle the flow for transformTransfer transaction (tx)
 *
 * @async
 * @function createTransformTransferTx
 * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of Zero-knowledge proof keys
 * @param {Client} client An instance of Client to interact with the API
 * @param {string} fee Proposer payment in Wei for the tx in L2
 * @param {string} recipientNightfallAddress Recipient zkpKeys.compressedZkpPublicKey
 * @param {string} inputTokens L2 tokens to be transformed
 * @param {string} outputTokens L2 tokens result from the transformation
 * @param {string[] | []} [providedCommitments] Commitments to be used for transformTransfer
 * @param {string[] | []} [providedCommitmentsFee] Commitments to be used to pay fee
 * @param {string} [regulatorUrl] regulatorUrl
 * @param {string} [atomicHash] Hash of the atomic transaction
 * @param {string} [atomicTimestamp] Expiration timestamp of the atomic transaction
 * @param {string} [salt] salt for the commitment to generate
 * @throws {NightfallSdkError} Error while broadcasting on-chain tx
 * @returns {Promise<TransactionResult>}
 */
export async function createTransformTransferTx(
  ownerZkpKeys: NightfallZkpKeys,
  client: Client,
  fee: string,
  recipientNightfallAddress: string,
  inputTokens: L2Token[] | [],
  outputTokens: L2Token[] | [],
  providedCommitments?: string[] | [],
  providedCommitmentsFee?: string[] | [],
  regulatorUrl?: string,
  atomicHash?: string,
  atomicTimestamp?: number,
  salt?: string,
): Promise<TransactionResult> {
  logger.debug("createTransformTransferTx");

  const resData = await client.transformTransfer(
    ownerZkpKeys,
    recipientNightfallAddress,
    fee,
    inputTokens,
    outputTokens,
    providedCommitments ?? [],
    providedCommitmentsFee ?? [],
    regulatorUrl,
    atomicHash,
    atomicTimestamp,
    salt,
  );
  const txReceiptL2 = resData.transaction;
  return { txReceiptL2 };
}
