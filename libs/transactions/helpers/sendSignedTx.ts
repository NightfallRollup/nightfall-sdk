import { logger } from "../../utils/index";
import type Web3 from "web3";
import type { SignedTransaction, TransactionReceipt } from "web3-core";

/**
 * Send a signed transaction (tx) to the network using web3
 *
 * @async
 * @function sendSignedTransaction
 * @param {SignedTransaction} signedTx Web3 signed transaction object
 * @param {Web3} web3 web3js instance
 * @returns {Promise<TransactionReceipt>}
 */
export async function sendSignedTransaction(
  signedTx: SignedTransaction,
  web3: Web3,
): Promise<TransactionReceipt> {
  logger.debug({ msg: "Send signed transaction...", signedTx });

  // As per https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html#eth-sendtransaction-return
  return new Promise((resolve, reject) => {
    web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .then((receipt) => resolve(receipt))
      .catch((error) => reject(error));
  });
}
