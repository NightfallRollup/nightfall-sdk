import gen from "general-number";
import { BN128_GROUP_ORDER, SHIFT } from "./constants";
import poseidon from "./poseidon";

const { generalise } = gen;

export class Commitment {
  preimage;

  hash;

  isNullified = false;

  isNullifiedOnChain = -1;

  constructor({
    ercAddress,
    tokenId,
    value,
    zkpPublicKey,
    salt,
  }: {
    ercAddress: any;
    tokenId: any;
    value: any;
    zkpPublicKey: any;
    salt: any;
  }) {
    const items = { ercAddress, tokenId, value, zkpPublicKey, salt };

    // the compressedPkd is not part of the pre-image but it's used widely in the rest of
    // the code, so we hold it in the commitment object (but not as part of the preimage)
    this.preimage = generalise(items);
    // we encode the top four bytes of the tokenId into the empty bytes at the top of the erc address.
    // this is consistent to what we do in the ZKP circuits
    const [top4Bytes, remainder] = this.preimage.tokenId
      .limbs(224, 2)
      .map((l: bigint) => BigInt(l));
    const packedErcAddress =
      this.preimage.ercAddress.bigInt + top4Bytes * SHIFT;
    this.hash = poseidon(
      generalise([
        packedErcAddress,
        remainder,
        this.preimage.value.field(BN128_GROUP_ORDER),
        ...this.preimage.zkpPublicKey.all.field(BN128_GROUP_ORDER),
        this.preimage.salt.field(BN128_GROUP_ORDER),
      ]),
    );
  }

  // sometimes (e.g. going over http) the general-number class is inconvenient
  toHex() {
    return {
      preimage: this.preimage.all.hex(),
      hash: this.hash.hex(),
    };
  }
}
