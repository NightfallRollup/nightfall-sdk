/* eslint-disable @typescript-eslint/no-explicit-any */
import type Web3 from "web3";
import { logger, NightfallSdkError } from "../utils";
import { createSignedTransaction } from "./helpers/createSignedTx";
import type { Client } from "../client";
import type { NightfallZkpKeys } from "../nightfall/types";
import type { TransactionResult } from "./types";

/**
 * Handle the flow for deposit transaction (tx)
 *
 * @async
 * @function createDepositTx
 * @param {*} token An instance of Token holding token data such as contract address
 * @param {string} ownerEthAddress Eth address sending the contents of the deposit
 * @param {undefined | string} ownerEthPrivateKey Eth private key of the sender to sign the tx
 * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of Zero-knowledge proof keys
 * @param {string} shieldContractAddress Address of the Shield smart contract (recipient)
 * @param {Web3} web3 web3js instance
 * @param {Client} client An instance of Client to interact with the API
 * @param {string} value The amount in Wei of the token to be deposited
 * @param {string} tokenId The tokenId of an erc721
 * @param {string} fee Proposer payment in Wei for the tx in L2
 * @throws {NightfallSdkError} Error while broadcasting tx
 * @returns {Promise<TransactionResult>}
 */
export async function createDepositTx(
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
): Promise<TransactionResult> {
  logger.debug("createDepositTx");

  // L2 deposit
  const resData = await client.deposit(
    token,
    ownerZkpKeys,
    value,
    tokenId,
    fee,
  );
  const txReceiptL2 = resData.transaction;
  const unsignedTx = resData.txDataToSign;
  logger.debug({ unsignedTx }, "Deposit tx, unsigned");

  // L1 transaction
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
