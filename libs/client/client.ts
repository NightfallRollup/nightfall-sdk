/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import type { Commitment } from "../nightfall/types";
import { logger, NightfallSdkError } from "../utils";
import type { NightfallZkpKeys } from "../nightfall/types";
import type { RecipientNightfallData } from "libs/transactions/types";
import { TransactionResponseData } from "./types";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error(error, "Client failed");
    throw new NightfallSdkError(error);
  },
);

/**
 * Creates a new Client
 *
 * @class Client
 */
class Client {
  /**
   * @property {string} apiUrl client address
   * @property {string} [apiTxUrl] client Transaction Worker address
   * @property {string} [apiBpUrl] client Block Proposed address
   */
  apiUrl: string;
  apiTxUrl: string;
  apiBpUrl: string;

  /**
   * Client constructor
   *
   * @param  {string} apiUrl client address
   */
  constructor(apiUrl: string, apiTxUrl?: string, apiBpUrl?: string) {
    logger.debug({ apiUrl }, "new Client at");
    this.apiUrl = apiUrl;
    // Set optional worker addresses if provided
    this.apiTxUrl = typeof apiTxUrl === 'undefined' ? '' : apiTxUrl;
    this.apiBpUrl = typeof apiBpUrl === 'undefined' ? '' : apiBpUrl;
  }

  /**
   * Make GET request to check that API is alive
   *
   * @method healthCheck
   * @throws {NightfallSdkError} Response other than 200 or bad response
   * @returns {Promise<boolean>} Should resolve `true` if API is alive, else `false`
   */
  async healthCheck(): Promise<boolean> {
    const endpoint = "healthcheck";
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.get(`${this.apiUrl}/${endpoint}`);
    if (res.status !== 200) {
      logger.error(res, "Client not available");
      throw new NightfallSdkError("Sorry, client not available");
    }
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return true;
  }

  /**
   * Make GET request to get the address for a given contract name
   *
   * @async
   * @method getContractAddress
   * @param {string} contractName The name of the contract for which we need the address
   * @throws {NightfallSdkError} Bad response
   * @returns {Promise<string>} Should resolve into Eth contract address
   */
  async getContractAddress(contractName: string): Promise<string> {
    const endpoint = `contract-address/${contractName}`;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.get(`${this.apiUrl}/${endpoint}`);
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data.address;
  }

  /**
   * Make POST request to derive a set of zero-knowledge proof keys
   *
   * @method generateZkpKeysFromMnemonic
   * @param {string} validMnemonic A valid bip39 mnemonic
   * @param {number} addressIndex Pass `0` to generate the first account
   * @throws {NightfallSdkError} Bad response
   * @returns {Promise<NightfallZkpKeys>} Should resolve into a set of keys if request is successful
   */
  async generateZkpKeysFromMnemonic(
    validMnemonic: string,
    addressIndex: number,
  ): Promise<NightfallZkpKeys> {
    const endpoint = "generate-zkp-keys";
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.post(`${this.apiUrl}/${endpoint}`, {
      mnemonic: validMnemonic,
      addressIndex,
    });
    // Do NOT log res.data for privacy
    logger.info({ status: res.status }, `Client at ${endpoint} responded`);

    return res.data;
  }

  /**
   * Make POST request to subscribe to incoming viewing keys
   *
   * @method subscribeToIncomingViewingKeys
   * @param {NightfallZkpKeys} zkpKeys A set of zero-knowledge proof keys
   * @throws {NightfallSdkError} Bad response
   * @returns {Promise<string>} Should resolve `string` (success) if request is successful
   */
  async subscribeToIncomingViewingKeys(
    zkpKeys: NightfallZkpKeys,
  ): Promise<string> {
    const endpoint = "incoming-viewing-key";
    const apiUrl = this.apiBpUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.post(`${apiUrl}/${endpoint}`, {
      zkpPrivateKeys: [zkpKeys.zkpPrivateKey],
      nullifierKeys: [zkpKeys.nullifierKey],
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data;
  }

  /**
   * Make POST request to create a deposit transaction (tx)
   *
   * @async
   * @method deposit
   * @param {*} token An instance of Token holding token data such as contract address
   * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of zero-knowledge proof keys
   * @param {string} value The amount in Wei of the token to be deposited
   * @param {string} tokenId The tokenId of the token to be deposited
   * @param {string} fee Proposer payment in Wei for the tx in L2
   * @param {string[] | []} providedCommitmentsFee Commitments to be used to pay fee
   * @param {string} [salt]  Salt to be added to the newly created deposit commitment
   * @throws {NightfallSdkError} Bad response
   * @returns {Promise<TransactionResponseData>}
   */
  async deposit(
    token: any,
    ownerZkpKeys: NightfallZkpKeys,
    value: string,
    tokenId: string,
    fee: string,
    providedCommitmentsFee: string[] | [],
    salt?: string,
  ): Promise<TransactionResponseData> {
    const endpoint = "deposit";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.post(`${apiUrl}/${endpoint}`, {
      ercAddress: token.contractAddress,
      tokenType: token.ercStandard,
      rootKey: ownerZkpKeys.rootKey,
      value,
      tokenId,
      fee,
      providedCommitmentsFee,
      salt,
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data;
  }

  /**
   * Make POST request to create a L2 tokenisation transaction (tx)
   *
   * @async
   * @method tokenise
   * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of zero-knowledge proof keys
   * @param {string} tokenContractAddress Token address to be minted in L2
   * @param {string} value The amount in Wei of the token to be minted
   * @param {string} tokenId The tokenId of the token to be minted
   * @param {string} fee Proposer payment in Wei for the tx in L2
   * @param {string[] | []} providedCommitmentsFee Commitments to be used to pay fee
   * @param {string} [salt]  Salt to be added to the newly created commitment
   * @throws {NightfallSdkError} Bad response
   * @returns {Promise<TransactionResponseData>}
   */
  async tokenise(
    ownerZkpKeys: NightfallZkpKeys,
    tokenContractAddress: string,
    value: string,
    tokenId: string,
    fee: string,
    providedCommitmentsFee: string[] | [],
    salt?: string,
  ): Promise<TransactionResponseData> {
    const endpoint = "tokenise";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.post(`${apiUrl}/${endpoint}`, {
      ercAddress: tokenContractAddress,
      rootKey: ownerZkpKeys.rootKey,
      value,
      tokenId,
      salt,
      providedCommitmentsFee,
      fee,
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data;
  }

  /**
   * Make POST request to create a transfer transaction (tx)
   *
   * @async
   * @method transfer
   * @param {*} token An instance of Token holding token data such as contract address
   * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of zero-knowledge proof keys
   * @param {RecipientNightfallData} recipientNightfallData An object with [valueWei], [recipientCompressedZkpPublicKey]
   * @param {string} tokenId The tokenId of the token to be transferred
   * @param {string} fee Proposer payment in Wei for the tx in L2
   * @param {boolean} isOffChain If true, tx will be sent to the proposer's API (handled off-chain)
   * @param {string[] | []} providedCommitments Commitments to be used for transfer
   * @param {string[] | []} providedCommitmentsFee Commitments to be used to pay fee
   * @param {string} [regulatorUrl] regulatorUrl
   * @throws {NightfallSdkError} No commitments found or bad response
   * @returns {Promise<TransactionResponseData>}
   */
  async transfer(
    token: any,
    ownerZkpKeys: NightfallZkpKeys,
    recipientNightfallData: RecipientNightfallData,
    tokenId: string,
    fee: string,
    isOffChain: boolean,
    providedCommitments: string[] | [],
    providedCommitmentsFee: string[] | [],
    regulatorUrl?: string,
  ): Promise<TransactionResponseData> {
    const endpoint = "transfer";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.post(`${apiUrl}/${endpoint}`, {
      ercAddress: token.contractAddress,
      rootKey: ownerZkpKeys.rootKey,
      recipientData: recipientNightfallData,
      tokenId,
      fee,
      offchain: isOffChain,
      providedCommitments,
      providedCommitmentsFee,
      regulatorUrl,
    });
    if (res.data.error && res.data.error === "No suitable commitments") {
      logger.error(res, "No suitable commitments were found");
      throw new NightfallSdkError("No suitable commitments were found");
    }
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data;
  }

  /**
   * Make POST request to create a L2 burn transaction (tx)
   *
   * @async
   * @method burn
   * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of zero-knowledge proof keys
   * @param {string} tokenContractAddress Token address of the token to be burnt in L2
   * @param {string} value The amount in Wei of the token to be burnt
   * @param {string} tokenId The tokenId of the token to be burnt
   * @param {string} fee Proposer payment in Wei for the tx in L2
   * @param {string[] | []} providedCommitments Commitments to be burnt
   * @param {string[] | []} providedCommitmentsFee Commitments to be used to pay fee
   * @throws {NightfallSdkError} Bad response
   * @returns {Promise<TransactionResponseData>}
   */
  async burn(
    ownerZkpKeys: NightfallZkpKeys,
    tokenContractAddress: string,
    value: string,
    tokenId: string,
    fee: string,
    providedCommitments: string[] | [],
    providedCommitmentsFee: string[] | [],
  ): Promise<TransactionResponseData> {
    const endpoint = "burn";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.post(`${apiUrl}/${endpoint}`, {
      ercAddress: tokenContractAddress,
      rootKey: ownerZkpKeys.rootKey,
      value,
      tokenId,
      fee,
      providedCommitments,
      providedCommitmentsFee,
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data;
  }

  /**
   * Make POST request to create a withdrawal transaction (tx)
   *
   * @async
   * @method withdraw
   * @param {*} token An instance of Token holding token data such as contract address
   * @param {NightfallZkpKeys} ownerZkpKeys Sender's set of zero-knowledge proof keys
   * @param {string} value The amount in Wei of the token to be withdrawn
   * @param {string} tokenId The tokenId of the token to be withdrawn
   * @param {string} fee Proposer payment in Wei for the tx in L2
   * @param {boolean} isOffChain If true, tx will be sent to the proposer's API (handled off-chain)
   * @param {string[] | []} providedCommitments Commitments to be withdrawn
   * @param {string[] | []} providedCommitmentsFee Commitments to be used to pay fee
   * @throws {NightfallSdkError} Bad response
   * @returns {Promise<TransactionResponseData>}
   */
  async withdraw(
    token: any,
    ownerZkpKeys: NightfallZkpKeys,
    value: string,
    tokenId: string,
    fee: string,
    recipientEthAddress: string,
    isOffChain: boolean,
    providedCommitments: string[] | [],
    providedCommitmentsFee: string[] | [],
  ): Promise<TransactionResponseData> {
    const endpoint = "withdraw";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.post(`${apiUrl}/${endpoint}`, {
      ercAddress: token.contractAddress,
      tokenType: token.ercStandard,
      rootKey: ownerZkpKeys.rootKey,
      recipientAddress: recipientEthAddress,
      value,
      tokenId,
      fee,
      offchain: isOffChain,
      providedCommitments,
      providedCommitmentsFee,
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data;
  }

  /**
   * Make POST request to finalise a previously initiated withdrawal (tx)
   *
   * @async
   * @method finaliseWithdrawal
   * @param {string} withdrawTxHashL2 Tx hash in Layer2 of the previously initiated withdrawal
   * @throws {NightfallSdkError} Bad response
   * @returns {Promise<TransactionResponseData>}
   */
  async finaliseWithdrawal(withdrawTxHashL2: string) {
    const endpoint = "finalise-withdrawal";
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.post(`${this.apiUrl}/${endpoint}`, {
      transactionHash: withdrawTxHashL2,
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data;
  }

  /**
   * Make GET request to get aggregated value for deposits that have not settled in L2 yet
   *
   * @async
   * @method getPendingDeposits
   * @param {NightfallZkpKeys} zkpKeys Sender's set of zero-knowledge proof keys
   * @param {string[]} tokenContractAddresses A list of token addresses
   * @throws {NightfallSdkError} Bad response
   * @returns {*}
   */
  async getPendingDeposits(
    zkpKeys: NightfallZkpKeys,
    tokenContractAddresses: string[],
  ) {
    const endpoint = "commitment/pending-deposit";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.get(`${apiUrl}/${endpoint}`, {
      params: {
        compressedZkpPublicKey: zkpKeys.compressedZkpPublicKey,
        ercList: tokenContractAddresses,
      },
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data.balance?.[zkpKeys.compressedZkpPublicKey];
  }

  async getNightfallBalances(zkpKeys: NightfallZkpKeys) {
    const endpoint = "commitment/balance";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.get(`${apiUrl}/${endpoint}`, {
      params: {
        compressedZkpPublicKey: zkpKeys.compressedZkpPublicKey,
      },
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data.balance;
  }

  async getPendingTransfers(zkpKeys: NightfallZkpKeys) {
    const endpoint = "commitment/pending-spent";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.get(`${apiUrl}/${endpoint}`, {
      params: {
        compressedZkpPublicKey: zkpKeys.compressedZkpPublicKey,
      },
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data.balance?.[zkpKeys.compressedZkpPublicKey];
  }

  /**
   * Make POST request to get all commitments filtered by many Nightfall addresses
   *
   * @method getCommitmentsByCompressedZkpPublicKey
   * @param {string[]} listOfCompressedZkpPublicKey list of compressedZkpPublicKeys (Nightfall address)
   * @throws {NightfallSdkError} No compressedZkpPublicKey given or bad response
   * @returns {Promise<Commitment[]>} Should resolve into a list of all existing commitments if request is successful
   */
  async getCommitmentsByCompressedZkpPublicKey(
    listOfCompressedZkpPublicKey: string[],
  ): Promise<Commitment[]> {
    const endpoint = "commitment/compressedZkpPublicKeys";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    if (!listOfCompressedZkpPublicKey.length) {
      logger.error(
        listOfCompressedZkpPublicKey,
        "You should pass at least one compressedZkpPublicKey",
      );
      throw new NightfallSdkError(
        "You should pass at least one compressedZkpPublicKey",
      );
    }
    const res = await axios.post(
      `${apiUrl}/${endpoint}`,
      listOfCompressedZkpPublicKey,
    );
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data.commitmentsByListOfCompressedZkpPublicKey;
  }

  /**
   * Make GET request to get all unspent commitments filtered by Nightfall addresses and
   * commitment erc address
   *
   * @method getUnspentCommitments
   * @param {string[]} listOfCompressedZkpPublicKey list of compressedZkpPublicKeys (Nightfall address)
   * @param {string[]} listOfERCAddresses list of ERC Addresses
   * @throws {NightfallSdkError} No compressedZkpPublicKey given or bad response
   * @returns {Promise<Commitment[]>} Should resolve into a list of all existing commitments if request is successful
   */
  async getUnspentCommitments(
    listOfCompressedZkpPublicKey: string[],
    listOfErcAddresses?: string[],
  ): Promise<Commitment[]> {
    const endpoint = "commitment/commitments";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.get(`${apiUrl}/${endpoint}`, {
      params: {
        listOfCompressedZkpPublicKey,
        listOfErcAddresses,
      },
    });
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data.commitments;
  }

  /**
   *
   * Make POST request to import a list of commitments
   *
   * @async
   * @method saveCommitments
   * @param {Commitment[]} listOfCommitments Commitments to be saved in the database
   * @throws {NightfallSdkError} Bad response
   * @return {Promise<string>} Should resolve `string` (successMessage)
   */
  async saveCommitments(listOfCommitments: Commitment[]) {
    const endpoint = "commitment/save";
    const apiUrl = this.apiTxUrl === '' ? this.apiUrl : this.apiUrl;
    logger.debug({ endpoint }, "Calling client at");

    const res = await axios.post(
      `${apiUrl}/${endpoint}`,
      listOfCommitments,
    );
    logger.info(
      { status: res.status, data: res.data },
      `Client at ${endpoint} responded`,
    );

    return res.data;
  }
}

export default Client;
