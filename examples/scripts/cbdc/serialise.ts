import { generalise, stitchLimbs } from "general-number"
import { TokenType, Token, TokenInfo } from "./types";
import { Commitment } from "../../../libs/nightfall/types";

const zeroes = (n: number) => ''.padStart(n,'0');

/**
 * Returns a serialised { tokenId, ercAddress } from the token t.
 *
 * @param {wCBDC | rCBDC} t  token to serialise
 * @param {string} sigR  Signature of the receiver
 *
 * @returns { string, string } tokenId, ercAddress
 */
export const serialiseToken = (t: Token, sigR: string) : { tokenId: string, ercAddress: string} => {
  const { batch, type } = t;
  // TokenId Info -> sigR, description
  const sigRBytes = generalise(sigR).limbs(32, 8); 
  const batchBytes = generalise(batch).limbs(32, 8);
  const tokenId = generalise(stitchLimbs(batchBytes.slice(-2).concat(sigRBytes.slice(-6)),32));

  // ercAddress Info -> sigBits, qty, tokenType
  const tokenTypeBits = generalise(type).binary.padStart(2,'0'); // TokenType
  const sigBits = generalise(sigR).binary.padStart(255, '0');

  const ercAddressBits = '11' + sigBits.slice(0,64) + zeroes(32) + '11' + zeroes(152) + tokenTypeBits.slice(0,2);
  const ercAddress = generalise(BigInt('0b' + ercAddressBits));

  return {
    tokenId: tokenId.hex(32),
    ercAddress: ercAddress.hex(32)
  };

}

/**
 * Returns a deserialised token t from the tokenId and ercAddress serialised info.
 *
 * @param {string} tokenId  Info serialised in tokenId
 * @param {string} ercAddress  Info serialised in ercAddress
 *
 * @returns { Token, sigR } t, sigR Token and signature of the receiver
 */
const deserialiseToken = (tokenId: string, ercAddress: string, value: number): TokenInfo => {
  const tokenIdBytes = generalise(tokenId).limbs(32, 8);
  const bottomSigRBytes = tokenIdBytes.slice(2);
  const batchBytes = tokenIdBytes.slice(0,2);

  const ercAddressBits = generalise(ercAddress).binary;
  const tokenTypeBits = ercAddressBits.slice(-2);
  const topSigRBits = ercAddressBits.slice(2, 66);

  const tokenType = Number(generalise(BigInt('0b'+ tokenTypeBits)).integer);

  if (tokenType != TokenType.wCBDC && tokenType != TokenType.rCBDC) throw new Error(`Invalid token type for (${tokenType})`);

  const sigR = generalise(BigInt('0b'+ topSigRBits + generalise(stitchLimbs(bottomSigRBytes,32)).binary.padStart(192,'0'))).hex(32);
  const t : Token = { 
    batch: generalise(stitchLimbs(batchBytes,32)).integer,
    qty:  value,
    type: tokenType,
  }

  return {
    token: t,
    sigR,
  };
}

/**
 * Returns the TokenType of the ercAddress deserialized token
 *
 * @param {string} ercAddress  ercAddress to deserialised to return the TokenType
 *
 * @returns { TokenType } TokenType of the token
 */
const getTokenType = (ercAddress: string) : TokenType => {
  const ercAddressBits = generalise(ercAddress).binary;
  const tokenTypeBits = ercAddressBits.slice(-2);
  const tokenType = Number(generalise(BigInt('0b'+ tokenTypeBits)).integer);
  if (TokenType[tokenType] === 'undefined') throw new Error(`No TokenType defined for ${tokenType}`);

  return tokenType; 
}

/**
 * Returns an array of tokens from the commitments
 *
 * @param {any} commitments  Commitments to deserialised in Purchase orders
 *
 * @returns { any[] } Array of tokens deserialised
 */
export const getTokensFromCommitments = (commitments: Commitment[]) : TokenInfo[] => {
  const tokens:TokenInfo[] = [];

  for(const com of commitments) {
    if (com.preimage.ercAddress.length > 42) { // ercAddress Ethereum 20 bytes -> 40 chars + '0x' = 42 chars
      const deserialisedToken = deserialiseToken(com.preimage.tokenId, com.preimage.ercAddress, Number(generalise(com.preimage.value).bigInt))
      tokens.push(deserialisedToken);
    }
  }

  return tokens;
}