/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Client } from "../client";
import type { Web3Websocket } from "../ethereum";
import type { MetaMaskEthereumProvider } from "../ethereum/types";

export interface UserFactoryCreate {
  clientApiUrl: string;
  clientApiTxUrl?: string; // optional client Transaction Handler Worker
  clientApiBpUrl?: string; // optional client Block Proposed Worker
  blockchainWsUrl?: string;
  ethereumPrivateKey?: string;
  nightfallMnemonic?: string;
}

export interface UserConstructor {
  client: Client;
  web3Websocket: Web3Websocket;
  shieldContractAddress: string;
  ethPrivateKey: string;
  ethAddress: string;
  nightfallMnemonic: string;
  zkpKeys: any;
}

export interface UserMakeTransaction {
  tokenContractAddress: string;
  value?: string;
  tokenId?: string;
  feeWei?: string;
  providedCommitmentsFee?: string[] | [];
}

export interface UserL2TokenisationTransaction {
  tokenContractAddress: string;
  value: string;
  tokenId: number | string;
  feeWei?: string;
  providedCommitmentsFee?: string[] | [];
}

export interface UserMakeDeposit extends UserMakeTransaction {
  salt?: string;
}

export interface UserMintL2Token extends UserL2TokenisationTransaction {
  salt?: string;
}

export interface UserMakeTransfer extends UserMakeTransaction {
  recipientNightfallAddress: string;
  isOffChain?: boolean;
  providedCommitments?: string[] | [];
  regulatorUrl?: string;
  atomicHash?: string;
  atomicTimestamp?: number;
  salt?: string;
}

export interface UserBurnL2Token extends UserL2TokenisationTransaction {
  providedCommitments?: string[] | [];
}

export interface UserMakeWithdrawal extends UserMakeTransaction {
  recipientEthAddress: string;
  isOffChain?: boolean;
  providedCommitments?: string[] | [];
}

export interface UserFinaliseWithdrawal {
  withdrawTxHashL2: string;
}

export interface UserCheckBalances {
  tokenContractAddresses?: string[];
}

export interface UserGetTransactionsInfo {
  transactionHashes?: string[];
}

export interface UserExportCommitments {
  listOfCompressedZkpPublicKey: string[];
  pathToExport: string;
  fileName: string;
}

export interface UserImportCommitments {
  pathToImport: string;
  fileName: string;
  compressedZkpPublicKey: string;
}

export interface UserBrowser extends Window {
  ethereum?: MetaMaskEthereumProvider;
}
