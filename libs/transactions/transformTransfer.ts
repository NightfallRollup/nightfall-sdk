/* eslint-disable @typescript-eslint/no-explicit-any */
import type Web3 from "web3";
import { logger, NightfallSdkError } from "../utils";
import { createSignedTransaction } from "./helpers/createSignedTx";
import type { Client } from "../client";
import type { NightfallZkpKeys } from "../nightfall/types";
import type { TransactionResult } from "./types";
import { Token } from "libs/user/types";

/**
 * Handle the flow for transformTransfer transaction (tx)
 *
 * @async
 * @function createTransferTx
 * @param {string} ownerEthAddress Eth address sending the contents of the transformTransfer
 * @param {undefined | string} ownerEthPrivateKey Eth private key of the sender to sign the tx
 * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of Zero-knowledge proof keys
 * @param {string} shieldContractAddress Address of the Shield smart contract
 * @param {Web3} web3 web3js instance
 * @param {Client} client An instance of Client to interact with the API
 * @param {string} fee Proposer payment in Wei for the tx in L2
 * @param {string} recipientNightfallAddress Recipient zkpKeys.compressedZkpPublicKey
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
  ownerEthAddress: string,
  ownerEthPrivateKey: undefined | string,
  ownerZkpKeys: NightfallZkpKeys,
  shieldContractAddress: string,
  web3: Web3,
  client: Client,
  fee: string,
  recipientNightfallAddress: string,
  inputTokens: Token[] | [],
  outputTokens: Token[] | [],
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
