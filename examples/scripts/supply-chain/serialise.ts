import { generalise, stitchLimbs } from "general-number"
import { PurchaseOrder, Asset, TokenType, Token, TokenInfo } from "./types";
import { Commitment } from "../../../libs/nightfall/types";

const zeroes = (n: number) => ''.padStart(n,'0');


/**
 * Returns the UNIX timestamp for the given `date`. Defaults to `Date.now()`
 * when not providing the `date` argument to the method call.
 *
 * @returns {Number}
 */
function unixTimestamp (date: Date) {  
  return date.getTime()/1000;
}

/**
 * Returns a date instance from the given `unixTimestamp`.
 *
 * @param {Number} unixTimestamp  Number of seconds since Unix epoch
 *
 * @returns {Number}
 */
function toDate (unixTimestamp: number) {  
  return new Date(unixTimestamp * 1000);
}

/**
 * Returns a serialised { tokenId, ercAddress } from the PurchaseOrder po.
 *
 * @param {PurchaseOrder} po  Purchase order to serialise
 * @param {string} sigR  Signature of the receiver
 *
 * @returns { string, string } tokenId, ercAddress
 */
export const serialisePurchaseOrder = (po: PurchaseOrder, sigR: string) : { tokenId: string, ercAddress: string} => {
  const { part, poId, deliveryDate, qty } = po
  // TokenId Info -> sigR, deliveryDate
  const sigRBytes = generalise(sigR).limbs(32, 8); 
  const deliveryDateBytes = generalise(unixTimestamp(deliveryDate).toString()).limbs(32, 8);
  const tokenId = generalise(stitchLimbs(deliveryDateBytes.slice(-2).concat(sigRBytes.slice(-6)),32));

  // ercAddress Info -> sigBits, poId, qty, part, tokenType
  const tokenTypeBits = generalise(TokenType.PurchaseOrder).binary.padStart(2,'0'); // TokenType = PurchaseOrder
  const partBits = generalise(part).binary.padStart(48,'0');
  const qtyBits = generalise(qty).binary.padStart(16,'0');
  const poIdBits = generalise(poId).binary.padStart(64,'0');
  const sigBits = generalise(sigR).binary.padStart(255, '0');

  const ercAddressBits = '11' + sigBits.slice(0,64) + zeroes(32) + '11' + zeroes(24) + poIdBits.slice(0,64) + 
    partBits.slice(0,48) + qtyBits.slice(0,16) + tokenTypeBits.slice(0,2);

  const ercAddress = generalise(BigInt('0b' + ercAddressBits));

  return {
    tokenId: tokenId.hex(32),
    ercAddress: ercAddress.hex(32)
  };
}


/**
 * Returns a deserialised PurchaseOrder po from the tokenId and ercAddress serialised info.
 *
 * @param {string} tokenId  Info serialised in tokenId
 * @param {string} ercAddress  Info serialised in ercAddress
 *
 * @returns { PurchaseOrder, sigR } po, sigR Purchase order and signature of the receiver
 */
export const deserialisePurchaseOrder = (tokenId: string, ercAddress: string): TokenInfo => {
  const tokenIdBytes = generalise(tokenId).limbs(32, 8);
  const bottomSigRBytes = tokenIdBytes.slice(2);
  const deliveryDateBytes = tokenIdBytes.slice(0,2);

  const ercAddressBits = generalise(ercAddress).binary;
  const tokenTypeBits = ercAddressBits.slice(-2);
  const qtyBits = ercAddressBits.slice(236,252);
  const partBits = ercAddressBits.slice(188,236);
  const poIdBits = ercAddressBits.slice(124,188);
  const topSigRBits = ercAddressBits.slice(2, 66);

  const tokenType = Number(generalise(BigInt('0b'+ tokenTypeBits)).integer);

  if (tokenType != TokenType.PurchaseOrder) throw new Error(`Invalid token type for PurchaseOrder (${tokenType})`);

  const sigR = generalise(BigInt('0b'+ topSigRBits + generalise(stitchLimbs(bottomSigRBytes,32)).binary.padStart(192,'0'))).hex(32);
  const po : PurchaseOrder = { 
    part: generalise(BigInt('0b'+ partBits)).integer,
    poId: generalise(BigInt('0b'+ poIdBits)).integer,
    deliveryDate: toDate(generalise(stitchLimbs(deliveryDateBytes,32)).integer),
    qty:  Number(generalise(BigInt('0b'+ qtyBits)).integer),
  }

  return {
    token: po,
    sigR,
  };
}

/**
 * Returns a serialised { tokenId, ercAddress } from the Asset asset.
 *
 * @param {Asset} asset  Asset to serialise
 * @param {string} sigR  Signature of the receiver
 *
 * @returns { string, string } tokenId, ercAddress
 */
export const serialiseAsset = (asset: Asset, sigR: string) : { tokenId: string, ercAddress: string} => {
  const { part, poId, batch } = asset

  // TokenId Info -> sigR (bottom bytes), batch
  const sigRBytes = generalise(sigR).limbs(32, 8); 
  const batchBytes = generalise(batch).limbs(32, 8);
  const tokenId = generalise(stitchLimbs(batchBytes.slice(-2).concat(sigRBytes.slice(-6)),32));

  // ercAddress Info -> sigR (top bytes), poId, part, tokenType
  const tokenTypeBits = generalise(TokenType.Asset).binary.padStart(2,'0'); 
  const partBits = generalise(part).binary.padStart(64,'0');
  const poIdBits = generalise(poId).binary.padStart(64,'0');
  const sigRBits = generalise(sigR).binary.padStart(255, '0');

  const ercAddressBits = '11' + sigRBits.slice(0,64) + zeroes(32) + '11' + zeroes(24) + poIdBits.slice(0,64) + 
      partBits.slice(0,64) + tokenTypeBits.slice(0,2);
  const ercAddress = generalise(BigInt('0b' + ercAddressBits));

  return {
    tokenId: tokenId.hex(32),
    ercAddress: ercAddress.hex(32)
  };
}

/**
 * Returns a deserialised Asset asset from the tokenId and ercAddress serialised info.
 *
 * @param {string} tokenId  Info serialised in tokenId
 * @param {string} ercAddress  Info serialised in ercAddress
 *
 * @returns { Asset, sigR } asset, sigR Asset and signature of the receiver
 */
export const deserialiseAsset = (tokenId: string, ercAddress: string, value: number): TokenInfo => {
  // TokenId Info -> sigR (bottom bytes), batch
  const tokenIdBytes = generalise(tokenId).limbs(32, 8);
  const bottomSigRBytes = tokenIdBytes.slice(2);
  const batchBytes = tokenIdBytes.slice(0,2);

  // ercAddress Info -> sigR (top bytes), poId, qty, part, tokenType
  const ercAddressBits = generalise(ercAddress).binary;
  const tokenTypeBits = ercAddressBits.slice(-2);
  const partBits = ercAddressBits.slice(188,252);
  const poIdBits = ercAddressBits.slice(124,188);
  const topSigRBits = ercAddressBits.slice(2, 66);

  const tokenType = Number(generalise(BigInt('0b'+ tokenTypeBits)).integer);

  if (tokenType != TokenType.Asset) throw new Error(`Invalid token type for Asset (${tokenType})`);

  const sigR = generalise(BigInt('0b'+ topSigRBits + generalise(stitchLimbs(bottomSigRBytes,32)).binary.padStart(192,'0'))).hex(32);
  const asset : Asset = { 
    part: generalise(BigInt('0b'+ partBits)).integer,
    poId: generalise(BigInt('0b'+ poIdBits)).integer,
    batch: generalise(stitchLimbs(batchBytes,32)).integer,
    qty: value,
  }

  return {
    token: asset,
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

function isPurchaseOrder(token: Token): token is PurchaseOrder {
  return (token as PurchaseOrder).deliveryDate !== undefined;
}

/**
 * Returns a serialised { tokenId, ercAddress } from the token.
 *
 * @param {any} token  Token to serialise
 * @param {string} sigR  Signature of the receiver
 *
 * @returns { string, string } tokenId, ercAddress
 */
export const serialiseToken = (token: Token, sigR: string) : { tokenId: string, ercAddress: string} => {
  if (isPurchaseOrder(token)) {
      return serialisePurchaseOrder(token, sigR);
  }
  return serialiseAsset(token, sigR);
}

/**
 * Returns a deserialised token from the tokenId and ercAddress serialised info.
 *
 * @param {string} tokenId  Info serialised in tokenId
 * @param {string} ercAddress  Info serialised in ercAddress
 *
 * @returns {TokenInfo} token, sigR Token and signature of the receiver
 */
export const deserialiseToken = (tokenId: string, ercAddress: string, value = 0) : TokenInfo => {
  const tokenType = getTokenType(ercAddress);

  if (tokenType === TokenType.PurchaseOrder) {
    return deserialisePurchaseOrder(tokenId, ercAddress);
  }
  return deserialiseAsset(tokenId, ercAddress, value);
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