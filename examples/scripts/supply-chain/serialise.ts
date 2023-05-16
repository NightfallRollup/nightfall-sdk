import { generalise, GN, stitchLimbs } from "general-number"
import { PurchaseOrder } from "./types";

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

export const serialise = (po: PurchaseOrder, sigR: string) : { tokenId: typeof GN, ercAddress: typeof GN} => {
  const { part, docId, deliveryDate, qty } = po

  const sigRBytes = generalise(sigR).limbs(32, 8); 
  const deliveryDateBytes = generalise(unixTimestamp(deliveryDate).toString()).limbs(32, 8);
  const tokenId = generalise(stitchLimbs(deliveryDateBytes.slice(-2).concat(sigRBytes.slice(-6)),32));

  const partBits = generalise(part).binary.padStart(48,'0');
  const qtyBits = generalise(qty).binary.padStart(16,'0');
  const docIdBits = generalise(docId).binary.padStart(64,'0');
  const sigBits = generalise(sigR).binary.padStart(255, '0');

  const ercAddressBits = '11' + sigBits.slice(0,64) + zeroes(32) + '11' + zeroes(26) + docIdBits.slice(0,64) + partBits.slice(0,48) + qtyBits.slice(0,16)
  const ercAddress = generalise(BigInt('0b' + ercAddressBits));

  return {
    tokenId,
    ercAddress
  };
}

export const deserialise = (tokenId: string, ercAddress: string): { part: string, docId: string, deliveryDate: Date, qty: number, sigR: string } => {
  const tokenIdBytes = generalise(tokenId).limbs(32, 8);
  const bottomSigRBytes = tokenIdBytes.slice(2);
  const deliveryDateBytes = tokenIdBytes.slice(0,2);

  const ercAddressBits = generalise(ercAddress).binary;
  const qtyBits = ercAddressBits.slice(-16);
  const partBits = ercAddressBits.slice(190,238);
  const docIdBits = ercAddressBits.slice(126,190);
  const topSigRBits = ercAddressBits.slice(2, 66);

  const sigR = generalise(BigInt('0b'+ topSigRBits + generalise(stitchLimbs(bottomSigRBytes,32)).binary.padStart(192,'0'))).hex(32);
  return {
    part: generalise(BigInt('0b'+ partBits)).integer,
    docId: generalise(BigInt('0b'+ docIdBits)).integer,
    deliveryDate: toDate(generalise(stitchLimbs(deliveryDateBytes,32)).integer),
    qty:  Number(generalise(BigInt('0b'+ qtyBits)).integer),
    sigR,
  };
}