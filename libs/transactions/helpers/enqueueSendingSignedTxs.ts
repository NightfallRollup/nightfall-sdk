import { sendSignedTransaction } from "./sendSignedTx";
import { logger } from "../../utils";
import type Queue from "queue";
import type { SignedTransaction } from "web3-core";
import type Web3 from "web3";

export function enqueueSendingSignedTxs(
  queue: Queue,
  signedTx: SignedTransaction,
  web3: Web3,
) {
  queue.push(async () => {
    try {
      const receipt = await sendSignedTransaction(signedTx, web3);
      logger.debug({ msg: "L1 transaction successful", receipt });
    } catch (err) {
      logger.error({ msg: "Something went wrong", err });
    }
  });
}
