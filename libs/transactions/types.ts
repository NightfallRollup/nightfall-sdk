import type { SignedTransaction } from "web3-core";
import type { TransactionReceiptL2 } from "../nightfall/types";

export interface RecipientNightfallData {
  recipientCompressedZkpPublicKeys: string[];
  values: string[];
}

/*
  signedTxL1 - if transaction (tx) involves on-chain operations
  txReceiptL2 - if tx involves Nightfall off-chain operations
*/
export interface TransactionResult {
  signedTxL1?: SignedTransaction;
  txReceiptL2?: TransactionReceiptL2;
}

/*
  txHashL1 - Eth tx hash (for on-chain operations)
  txHashL2 - Nightfall tx hash (off-chain operations)
*/
export interface NightfallSDKTransactionReceipt {
  txHashL1?: string;
  txHashL2?: string;
}
