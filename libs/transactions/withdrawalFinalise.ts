import type Web3 from "web3";
import { logger, NightfallSdkError } from "../utils";
import { createSignedTransaction } from "./helpers/createSignedTx";
import type { Client } from "../client";
import type { TransactionResult } from "./types";

/**
 * Handle the flow for finalising previously initiated withdrawal transaction (tx)
 *
 * @async
 * @function createFinaliseWithdrawalTx
 * @param {string} ownerEthAddress Eth address sending the contents of the tx
 * @param {undefined | string} ownerEthPrivateKey Eth private key of the sender to sign the tx
 * @param {string} shieldContractAddress Address of the Shield smart contract
 * @param {Web3} web3 web3js instance
 * @param {Client} client An instance of Client to interact with the API
 * @param {string} withdrawTxHashL2 Tx hash in Layer2 of the previously initiated withdrawal
 * @throws {NightfallSdkError} Error while broadcasting tx
 * @returns {Promise<TransactionResult>}
 */
export async function createFinaliseWithdrawalTx(
  ownerEthAddress: string,
  ownerEthPrivateKey: undefined | string,
  shieldContractAddress: string,
  web3: Web3,
  client: Client,
  withdrawTxHashL2: string,
): Promise<TransactionResult> {
  logger.debug("createFinaliseWithdrawalTx");

  const resData = await client.finaliseWithdrawal(withdrawTxHashL2);
  const unsignedTx = resData.txDataToSign;
  logger.debug({ unsignedTx }, "Finalise withdrawal tx, unsigned");

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
  return { signedTxL1 };
}
