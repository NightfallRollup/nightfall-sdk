import { generalise } from "general-number";
import { TokenType, Token } from "./types";
import { Commitment } from "../../../libs/nightfall/types";

const zeroes = (n: number) => "".padStart(n, "0");

/**
 * Returns a serialised { tokenId, ercAddress } from the token t.
 *
 * @param {Token} t  token to serialise
 * @param {string} sigR  Signature of the receiver
 *
 * @returns { string, string } tokenId, ercAddress
 */
export const serialiseToken = (
  t: Token,
): { tokenId: string; ercAddress: string } => {
  const { type, decimals, symbol } = t;
  // TokenId Info -> nothing
  const tokenId = generalise("0x0");

  // ercAddress Info -> symbol, decimals, tokenType
  const tokenTypeBits = generalise(type).binary.padStart(32, "0"); // TokenType
  const decimalsBits = generalise(decimals).binary.padStart(5, "0"); // Decimals
  const symbolBits = generalise(symbol).binary.padStart(64, "0"); // Symbol

  const ercAddressBits =
    "11" +
    zeroes(96) +
    "11" +
    zeroes(53) +
    symbolBits.slice(0, 64) +
    decimalsBits.slice(0, 5) +
    tokenTypeBits.slice(0, 32);

  const ercAddress = generalise(BigInt("0b" + ercAddressBits));

  return {
    tokenId: tokenId.hex(32),
    ercAddress: ercAddress.hex(32),
  };
};

/**
 * Returns a deserialised token t from the tokenId and ercAddress serialised info.
 *
 * @param {string} tokenId  Info serialised in tokenId
 * @param {string} ercAddress  Info serialised in ercAddress
 *
 * @returns { Token, sigR } t, sigR Token and signature of the receiver
 */
export const deserialiseToken = (
  tokenId: string,
  ercAddress: string,
  value: number,
): Token => {
  const ercAddressBits = generalise(ercAddress).binary;
  const tokenTypeBits = ercAddressBits.slice(-32);
  const decimalsBits = ercAddressBits.slice(217, 222);
  const symbolBits = ercAddressBits.slice(154, 217);
  const tokenType = Number(generalise(BigInt("0b" + tokenTypeBits)).integer);

  if (tokenType != TokenType.wCBDC && tokenType != TokenType.rCBDC)
    throw new Error(`Invalid token type for (${tokenType})`);

  const t: Token = {
    qty: value,
    type: tokenType,
    decimals: generalise(BigInt("0b" + decimalsBits)).integer,
    symbol: Buffer.from(
      generalise(BigInt("0b" + symbolBits)).bigInt.toString(16),
      "hex",
    ).toString(),
  };

  return t;
};

/**
 * Returns the TokenType of the ercAddress deserialized token
 *
 * @param {string} ercAddress  ercAddress to deserialised to return the TokenType
 *
 * @returns { TokenType } TokenType of the token
 */
const getTokenType = (ercAddress: string): TokenType => {
  const ercAddressBits = generalise(ercAddress).binary;
  const tokenTypeBits = ercAddressBits.slice(-32);
  const tokenType = Number(generalise(BigInt("0b" + tokenTypeBits)).integer);
  if (TokenType[tokenType] === "undefined")
    throw new Error(`No TokenType defined for ${tokenType}`);

  return tokenType;
};

/**
 * Returns an array of tokens from the commitments
 *
 * @param {any} commitments  Commitments to deserialised in Purchase orders
 *
 * @returns { any[] } Array of tokens deserialised
 */
export const getTokensFromCommitments = (
  commitments: Commitment[],
): Token[] => {
  const tokens: Token[] = [];

  for (const com of commitments) {
    if (com.preimage.ercAddress.length > 42) {
      // ercAddress Ethereum 20 bytes -> 40 chars + '0x' = 42 chars
      const deserialisedToken = deserialiseToken(
        com.preimage.tokenId,
        com.preimage.ercAddress,
        Number(generalise(com.preimage.value).bigInt),
      );
      tokens.push(deserialisedToken);
    }
  }

  return tokens;
};
