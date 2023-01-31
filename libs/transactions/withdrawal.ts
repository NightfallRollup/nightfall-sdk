import type Web3 from "web3";
import { logger, NightfallSdkError } from "../utils";
import { createSignedTransaction } from "./helpers/createSignedTx";
import type { Client } from "../client";
import type { NightfallZkpKeys } from "../nightfall/types";
import type { TransactionResult } from "./types";

/**
 * Handle the flow for withdrawal transaction (tx)
 *
 * @async
 * @function createWithdrawalTx
 * @param {*} token An instance of Token holding token data such as contract address
 * @param {string} ownerEthAddress Eth address sending the contents of the withdrawal
 * @param {undefined | string} ownerEthPrivateKey Eth private key of the sender to sign the tx
 * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of Zero-knowledge proof keys
 * @param {string} shieldContractAddress Address of the Shield smart contract
 * @param {Web3} web3 web3js instance
 * @param {Client} client An instance of Client to interact with the API
 * @param {string} value The amount in Wei of the token to be withdrawn
 * @param {string} tokenId The id of the ERC721 to be withdrawn
 * @param {string} fee Proposer payment in Wei for the tx in L2
 * @param {string} recipientEthAddress Recipient Eth address
 * @param {boolean} isOffChain If true, tx will be sent to the proposer's API (handled off-chain)
 * @throws {NightfallSdkError} Error while broadcasting on-chain tx
 * @returns {Promise<TransactionResult>}
 */
export async function createWithdrawalTx(
  token: any,
  ownerAddress: string,
  ownerEthPrivateKey: undefined | string,
  ownerZkpKeys: NightfallZkpKeys,
  shieldContractAddress: string,
  web3: Web3,
  client: Client,
  value: string,
  tokenId: string,
  fee: string,
  recipientEthAddress: string,
  isOffChain: boolean,
): Promise<TransactionResult> {
  logger.debug("createWithdrawalTx");

  // L2 withdrawal
  const resData = await client.withdraw(
    token,
    ownerZkpKeys,
    value,
    tokenId,
    fee,
    recipientEthAddress,
    isOffChain,
  );
  const txReceiptL2 = resData.transaction;

  if (isOffChain) return { txReceiptL2 };

  // Else, proceed with L1 transaction
  const unsignedTx = resData.txDataToSign;
  logger.debug({ unsignedTx }, "Withdrawal tx, unsigned");

  let signedTxL1;
  try {
    signedTxL1 = await createSignedTransaction(
      ownerAddress,
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
