export interface NightfallZkpKeys {
  rootKey: string; // Previously ask
  nullifierKey: string; // nsk
  zkpPrivateKey: string; // ivk
  zkpPublicKey: string[]; // pkd
  compressedZkpPublicKey: string; // compressedPkd
}

export interface NightfallKeys {
  nightfallMnemonic: string;
  zkpKeys: NightfallZkpKeys;
}

export interface Commitment {
  _id: string;
  compressedZkpPublicKey: string;
  preimage: {
    ercAddress: string;
    tokenId: string;
    value: string;
    zkpPublicKey: string[];
    salt: string;
  };
  isDeposited: boolean;
  isOnChain: number;
  isPendingNullification: boolean;
  isNullified: boolean;
  isNullifiedOnChain: number;
  nullifier: string;
  blockNumber: number;
}
export interface UnspentCommitment {
  compressedZkpPublicKey: string;
  ercAddress: string;
  balance: string; // ie value
  tokenId: string;
  hash: string;
}

export interface TransactionInfo {
  blockNumber: string;
  blockNumberL2: string;
  transactionHash: string;
  transactionHashL1: string;
}
export interface TransactionReceiptL2 {
  value: string;
  fee: string;
  transactionType: string;
  tokenType: string;
  historicRootBlockNumberL2: string[];
  historicRootBlockNumberL2Fee: string[];
  tokenId: string;
  ercAddress: string;
  recipientAddress: string;
  commitments: string[];
  nullifiers: string[];
  commitmentFee: string[];
  nullifiersFee: string[];
  compressedSecrets: string[];
  proof: string[];
  transactionHash: string;
}
