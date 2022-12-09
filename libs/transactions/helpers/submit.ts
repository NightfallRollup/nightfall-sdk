import type Web3 from "web3";
import { logger } from "../../utils";
import type { TransactionReceipt } from "web3-core";

const GAS = 4000000;
const GAS_PRICE = 10000000000;
const GAS_MULTIPLIER = 2;
const GAS_PRICE_MULTIPLIER = 2;

/**
 * Create, sign and broadcast an Ethereum transaction (tx) to the network
 *
 * @async
 * @function submitTransaction
 * @param {string} senderEthAddress Eth address sending the contents of the tx
 * @param {undefined | string} senderEthPrivateKey Eth private key of the sender to sign the tx
 * @param {string} recipientEthAddress Eth address receiving the contents of the tx
 * @param {string} unsignedTx The contents of the tx (sent in data)
 * @param {Web3} web3 web3js instance
 * @param {string} value Proposer payment for the tx in L1
 * @returns {Promise<TransactionReceipt>}
 */
export async function submitTransaction(
  senderEthAddress: string,
  senderEthPrivateKey: undefined | string,
  recipientEthAddress: string,
  unsignedTx: string,
  web3: Web3,
  value = "0",
): Promise<TransactionReceipt> {
  logger.debug(
    { senderEthAddress, recipientEthAddress, unsignedTx, value },
    "submitTransaction",
  );

  // Estimate gas
  const gas = Math.ceil(Number(GAS) * GAS_MULTIPLIER); // ISSUE #28
  const gasPrice = Math.ceil(Number(GAS_PRICE) * GAS_PRICE_MULTIPLIER); // ISSUE #28
  logger.debug(
    `Transaction gasPrice was set at ${Math.ceil(
      gasPrice / 10 ** 9,
    )} GWei, gas limit was set at ${gas}`,
  );

  const tx = {
    from: senderEthAddress,
    to: recipientEthAddress,
    data: unsignedTx,
    value,
    gas,
    gasPrice,
  };

  if (!senderEthPrivateKey) {
    logger.debug({ tx }, "Send tx via MetaMask...");
    return web3.eth.sendTransaction(tx);
  }

  logger.debug({ tx }, "Sign tx...");
  const signedTx = await web3.eth.accounts.signTransaction(
    tx,
    senderEthPrivateKey,
  );

  logger.debug({ signedTx }, "Send signedTx...");
  return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}
