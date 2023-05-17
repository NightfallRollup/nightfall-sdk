import { UserFactory, randomSalt } from "../../../libs";
import { config } from "../appConfig";
import { deserialisePurchaseOrder, deserialiseToken, getTokensFromCommitments, serialisePurchaseOrder, serialiseToken } from "./serialise";
import { PurchaseOrder, Asset, TokenInfo } from "./types";
import { Client } from "../../../libs/client";
import { generalise } from "general-number"
import axios from "axios";

const makeBlock = async () => {
  // TODO: For now, i am assuming this works only on localhost, not on testnet
  await axios.post("http://localhost:8081/block/make-now");
};

const waitForTime = async (time:number) => {
  await new Promise((resolve) => setTimeout(resolve, time));
}

const main = async () => {
  let user;
  let user2;

  try {
    // # 1 Create an instance of User
    user = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic: config.nightfallMnemonic,
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });
    user2 = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic: "game mother news olive harbor elephant come eager junior finger better quiz",
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });

    const client = new Client(config.clientApiUrl);
    // #2 Create PO
    const po: PurchaseOrder = { part: "222", poId: "103", deliveryDate: new Date("2023/07/19"), qty: 25 };
    const asset: Asset = { part: "222", poId: "103", batch: "112234", qty: 25 };

    const serialisedInfo = serialiseToken(po, generalise('1'.padStart(255,'0')).toString(16));
    console.log("SERIALIZED INFO:", po, serialisedInfo);
    const deserialisedInfo = deserialiseToken(serialisedInfo.tokenId, serialisedInfo.ercAddress);
    console.log("DESERIALIZED INFO:", serialisedInfo, deserialisedInfo);
    // # 3 Mint token within L2
    const salt = await randomSalt();
    const { txHashL2 } = await user.mintL2Token({
      tokenAddress: serialisedInfo.ercAddress,
      value: '1',
      tokenId: serialisedInfo.tokenId,
      salt, // optional
      feeWei: config.feeWei,
    });
    console.log(">>>>> Transaction hash L2", txHashL2);

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);
  
    const myNightfallAddress = user.getNightfallAddress();

    const commitments = await client.getCommitmentsByCompressedZkpPublicKey([myNightfallAddress]);
    const tokens : TokenInfo[] = getTokensFromCommitments(commitments);

    console.log('**** Tokens ********', tokens);

    // # 4 transfer
    const recipientNightfallData = {
      recipientCompressedZkpPublicKeys: [
        user2.getNightfallAddress(),
      ],
      values: ["1"],
    };

    console.log(`Transferring commitment ${commitments[commitments.length - 1]._id} to ${user2.getNightfallAddress()}`)
    
    const res = await axios.post(`${client.apiUrl}/transfer`, {
      ercAddress: commitments[commitments.length - 1].preimage.ercAddress,
      rootKey: user.zkpKeys.rootKey,
      recipientData: recipientNightfallData,
      tokenId: commitments[commitments.length - 1].preimage.tokenId,
      fee: '0',
      offchain: true,
      providedCommitments: [commitments[commitments.length - 1]._id],
    });
    console.log(
      ">>>>> Transaction hash L1 (`undefined` if off-chain)",
      res.data,
    );

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);

    const commitmentsUser2 = await client.getCommitmentsByCompressedZkpPublicKey([user2.getNightfallAddress()]);
    const tokensUser2 : TokenInfo[] = getTokensFromCommitments(commitmentsUser2);

    console.log('**** Tokens User2 ********', tokensUser2);

    /*
    const { txHashL1, txHashL2 } = await user.makeTransfer({
      tokenContractAddress: unspentCommitmentsDetails[0][0].ercAddress ,
      value: '1',
      tokenId: unspentCommitmentsDetails[0][0].tokenId,
      recipientNightfallAddress: myNightfallAddress,
      isOffChain: true,
      feeWei: '0',
    }); */

  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    user.close();
    user2.close();
    console.log(">>>>> Bye bye");
  }
};

main();
