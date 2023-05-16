import { UserFactory, randomSalt } from "../../../libs";
import { config } from "../appConfig";
import { deserialise, serialise } from "./serialise";
import { PurchaseOrder } from "./types";
import { generalise } from "general-number"

const serialisePurchaseOrder = (po: PurchaseOrder) : { tokenId: string, ercAddress: string } => {
  const s = serialise(po, generalise('1'.padStart(255,'0')).toString(16));
  return {
    tokenId: s.tokenId.hex(32),
    ercAddress: s.ercAddress.hex(32),
  }
}

const main = async () => {
  let user;

  try {
    // # 1 Create an instance of User
    user = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic: config.nightfallMnemonic,
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });

    const po: PurchaseOrder = { part: "222", docId: "234", deliveryDate: new Date("2023/07/12"), qty: 2 };

    const serialisedInfo = serialisePurchaseOrder(po);
    console.log("SERIALIZED INFO:", po, serialisedInfo);
    const deserialisedInfo = deserialise(serialisedInfo.tokenId, serialisedInfo.ercAddress);
    console.log("DESERIALIZED INFO:", serialisedInfo, deserialisedInfo);
    // # 2 Mint token within L2
    const salt = await randomSalt();
    const { txHashL2 } = await user.mintL2Token({
      tokenAddress: serialisedInfo.ercAddress,
      value: '1', // po.qty.toString(),
      tokenId: serialisedInfo.tokenId,
      salt, // optional
      feeWei: config.feeWei,
    });
    console.log(">>>>> Transaction hash L2", txHashL2);

    // # 3 [OPTIONAL] You can check the transaction hash
    // TODO
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    user.close();
    console.log(">>>>> Bye bye");
  }
};

main();
