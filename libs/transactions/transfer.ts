/* eslint-disable @typescript-eslint/no-explicit-any */
import type Web3 from "web3";
import { logger, NightfallSdkError } from "../utils";
import { createSignedTransaction } from "./helpers/createSignedTx";
import type { Client } from "../client";
import type { NightfallZkpKeys } from "../nightfall/types";
import type { RecipientNightfallData, TransactionResult } from "./types";

/**
 * Handle the flow for transfer transaction (tx)
 *
 * @async
 * @function createTransferTx
 * @param {*} token An instance of Token holding token data such as contract address
 * @param {string} ownerEthAddress Eth address sending the contents of the transfer
 * @param {undefined | string} ownerEthPrivateKey Eth private key of the sender to sign the tx
 * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of Zero-knowledge proof keys
 * @param {string} shieldContractAddress Address of the Shield smart contract
 * @param {Web3} web3 web3js instance
 * @param {Client} client An instance of Client to interact with the API
 * @param {string} value The amount in Wei of the token to be transferred
 * @param {string} tokenId The id of the ERC721 to be transferred
 * @param {string} fee Proposer payment in Wei for the tx in L2
 * @param {string} recipientNightfallAddress Recipient zkpKeys.compressedZkpPublicKey
 * @param {boolean} isOffChain If true, tx will be sent to the proposer's API (handled off-chain)
 * @param {string[] | []} [providedCommitments] Commitments to be used for transfer
 * @param {string[] | []} [providedCommitmentsFee] Commitments to be used to pay fee
 * @param {string} [regulatorUrl] regulatorUrl
 * @param {string} [atomicHash] Hash of the atomic transaction
 * @param {string} [atomicTimestamp] Expiration timestamp of the atomic transaction
 * @param {string} [salt] salt for the commitment to generate
 * @throws {NightfallSdkError} Error while broadcasting on-chain tx
 * @returns {Promise<TransactionResult>}
 */
export async function createTransferTx(
  token: any,
  ownerEthAddress: string,
  ownerEthPrivateKey: undefined | string,
  ownerZkpKeys: NightfallZkpKeys,
  shieldContractAddress: string,
  web3: Web3,
  client: Client,
  value: string,
  tokenId: string,
  fee: string,
  recipientNightfallAddress: string,
  isOffChain: boolean,
  providedCommitments?: string[] | [],
  providedCommitmentsFee?: string[] | [],
  regulatorUrl?: string,
  atomicHash?: string,
  atomicTimestamp?: number,
  salt?: string,
): Promise<TransactionResult> {
  logger.debug("createTransferTx");

  // L2 transfer
  const recipientNightfallData: RecipientNightfallData = {
    recipientCompressedZkpPublicKeys: [recipientNightfallAddress],
    values: [value],
  };
  const resData = await client.transfer(
    token,
    ownerZkpKeys,
    recipientNightfallData,
    tokenId,
    fee,
    isOffChain,
    providedCommitments ?? [],
    providedCommitmentsFee ?? [],
    regulatorUrl,
    atomicHash,
    atomicTimestamp,
    salt,
  );
  const txReceiptL2 = resData.transaction;

  if (isOffChain) return { txReceiptL2 };

  // Else, proceed with L1 transaction
  const unsignedTx = resData.txDataToSign;
  logger.debug({ unsignedTx }, "Transfer tx, unsigned");

  let signedTxL1;
  try {
    signedTxL1 = await createSignedTransaction(
      ownerEthAddress,
      ownerEthPrivateKey,
      shieldContractAddress,
      unsignedTx,
      web3,
    );
  } catch (err) {
    logger.child({ resData }).error(err, "Error when submitting transaction");
    throw new NightfallSdkError(err);
  }
  return { signedTxL1, txReceiptL2 };
}
