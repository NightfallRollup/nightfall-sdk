import { Client } from "../client";

/**
 * Get Shield, ERC Mocked contract addresses (the latter is Ganache only)
 *
 * @async
 * @method getContractAddress
 * @param {string} clientApiUrl URL of a running Nightfall Client
 * @param {string} contractName
 * @returns {Promise<string>} Ethereum contract address
 */
export function getContractAddress(
  clientApiUrl: string,
  contractName: string,
): Promise<string> {
  const client = new Client(clientApiUrl);
  return client.getContractAddress(contractName);
}
