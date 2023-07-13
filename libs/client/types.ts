import type { TransactionReceiptL2 } from "../nightfall/types";

export interface TransactionResponseData {
  txDataToSign?: string; // only if on-chain
  transaction?: TransactionReceiptL2; // always present except in finalise-withdrawal
}

export interface BalancePerTokenId {
  balance: number;
  tokenId: string;
}

export type BalancePerAddress = number | BalancePerTokenId[];

export type Balance = Record<string, BalancePerAddress>;
