import { logger, NightfallSdkError } from "../../utils/index";
import { estimateGas, estimateGasPrice } from "../../ethereum/index";
import { Mutex } from "async-mutex";
import type Web3 from "web3";
import type { TransactionConfig, SignedTransaction } from "web3-core";

const nonceMutex = new Mutex();

let nonce = 0;

/**
 * Create, sign and broadcast an Ethereum transaction (tx) to the network
 *
 * @async
 * @function createSignedTransaction
 * @param {string} senderEthAddress Eth address sending the contents of the tx
 * @param {undefined | string} senderEthPrivateKey Eth private key of the sender to sign the tx
 * @param {string} recipientEthAddress Eth address receiving the contents of the tx
 * @param {string} unsignedTx The contents of the tx (sent in data)
 * @param {Web3} web3 web3js instance
 * @param {string} value Proposer payment for the tx in L1
 * @returns {Promise<void | SignedTransaction>}
 */
export async function createSignedTransaction(
  senderEthAddress: string,
  senderEthPrivateKey: undefined | string,
  recipientEthAddress: string,
  unsignedTx: string,
  web3: Web3,
  value = "0",
): Promise<SignedTransaction> {
  logger.debug(
    { senderEthAddress, recipientEthAddress, unsignedTx, value },
    "createSignedTransaction",
  );

  // Check if web3 websocket is available
  const isListening = await web3.eth.net.isListening();
  if (!isListening)
    throw new NightfallSdkError(
      "Web3 websocket not listening, try again later",
    );

  logger.debug("Create transaction object...");
  let signedTx;
  await nonceMutex.runExclusive(async () => {
    // Estimate gasPrice
    const gasPrice = await estimateGasPrice(web3);

    // Ethereum tx
    const tx: TransactionConfig = {
      from: senderEthAddress,
      to: recipientEthAddress,
      data: unsignedTx,
      value,
      gasPrice,
    };

    // Estimate tx gas
    tx.gas = await estimateGas(tx, web3);

    // Update nonce if necessary, increment local nonce
    const web3Nonce = await web3.eth.getTransactionCount(
      senderEthAddress,
      "pending",
    );
    if (nonce < web3Nonce) {
      nonce = web3Nonce;
    }
    tx.nonce = nonce;
    nonce++;

    // If no private key is given, SDK tries to submit tx via MetaMask
    if (!senderEthPrivateKey) {
      logger.debug({ tx }, "Sign and send tx via MetaMask...");
      return web3.eth.sendTransaction(tx);
    }

    // Else, sign tx
    logger.debug({ msg: "Sign transaction...", tx });
    signedTx = await web3.eth.accounts.signTransaction(tx, senderEthPrivateKey);
  });

  return signedTx;
}
