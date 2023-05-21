import { UserFactory, randomSalt } from "../../../libs";
import { config } from "../appConfig";
import { getTokensFromCommitments, serialiseToken } from "./serialise";
import { PurchaseOrder, Asset, TokenInfo } from "./types";
import { Client } from "../../../libs/client";
import { generalise } from "general-number"
import axios from "axios";
import { Commitment } from "../../../libs/nightfall/types";

/**
 * Make a block
 */
const makeBlock = async () => {
  console.log("Making a block...");
  // TODO: For now, i am assuming this works only on localhost, not on testnet
  await axios.post("http://localhost:8081/block/make-now");
};

/**
 * Wait for a given time in milliseconds
 */
const waitForTime = async (time:number) => {
  await new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * Get commitments for user and user2
 */
const getUnspentCommitments = async (user: any, client: Client) : Promise<Commitment[]> => {
  const commitments = await client.getCommitmentsByCompressedZkpPublicKey([user.getNightfallAddress()]);
  return commitments.filter((c: Commitment) => c.isNullifiedOnChain < 0);
}

/**
 * Get commitments for user and user2
 */
const getTokens = (commitments: Commitment[]) : TokenInfo[] => {
  return getTokensFromCommitments(commitments);
}

/**
 * Main function to run the script for L2 tokenisation
 */
const main = async () => {
  let user;
  let user2;

  try {
    // # 1 Create an instance of User and User2
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
    // #2 Create PO and serialise it
    console.warn(`Minting PurchaseOrder commitment to ${user.getNightfallAddress()}`)
    const po: PurchaseOrder = { part: "222", poId: "106", deliveryDate: new Date("2023-07-22:00:00.000Z"), qty: 32 };
    console.log("PO:", po);
    let serialisedInfo = serialiseToken(po, generalise('1'.padStart(255,'0')).toString(16));
    /* console.log("SERIALIZED INFO:", po, serialisedInfo);
     const deserialisedInfo = deserialiseToken(serialisedInfo.tokenId, serialisedInfo.ercAddress);
     console.log("DESERIALIZED INFO:", serialisedInfo, deserialisedInfo);
    */

    // # 3 Mint token of the purchase order within L2
    let salt = await randomSalt();
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
  
    let commitments = await getUnspentCommitments(user, client);
    let commitments2 = await getUnspentCommitments(user2, client);
    let tokens = getTokens(commitments);
    let tokens2 = getTokens(commitments2);
    console.log("Tokens for user1:", tokens);
    console.log("Tokens for user2:", tokens2);

    // # 4 transfer
    let recipientNightfallData = {
      recipientCompressedZkpPublicKeys: [
        user2.getNightfallAddress(),
      ],
      values: ["1"],
    };

    console.log(`Transferring PurchaseOrder commitment ${commitments[commitments.length - 1]._id} to ${user2.getNightfallAddress()}`)
    
    let res = await axios.post(`${client.apiUrl}/transfer`, {
      ercAddress: commitments[commitments.length - 1].preimage.ercAddress,
      rootKey: user.zkpKeys.rootKey,
      recipientData: recipientNightfallData,
      tokenId: commitments[commitments.length - 1].preimage.tokenId,
      fee: '0',
      offchain: true,
      providedCommitments: [commitments[commitments.length - 1]._id],
    });
    console.log(
      ">>>>> Transaction hash L2",
      res.data.transaction.transactionHash,
    );
    /*
    const { txHashL1, txHashL2 } = await user.makeTransfer({
      tokenContractAddress: unspentCommitmentsDetails[0][0].ercAddress ,
      value: '1',
      tokenId: unspentCommitmentsDetails[0][0].tokenId,
      recipientNightfallAddress: myNightfallAddress,
      isOffChain: true,
      feeWei: '0',
    }); */

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);

    commitments = await getUnspentCommitments(user, client);
    commitments2 = await getUnspentCommitments(user2, client);
    tokens = getTokens(commitments);
    tokens2 = getTokens(commitments2);
    console.log("Tokens for user1:", tokens);
    console.log("Tokens for user2:", tokens2);

    // # 5 Transform purchase order to asset (or burn purchase order and create asset)
    console.log(`Transform PurchaseOrder commitment ${commitments2[commitments2.length - 1]._id} to Asset to ${user2.getNightfallAddress()}`)
    const asset: Asset = { part: tokens2[tokens2.length - 1].token.part, poId: tokens2[tokens2.length - 1].token.poId, batch: "12345", qty: tokens2[tokens2.length - 1].token.qty };
    console.log("ASSET:", asset);
    serialisedInfo = serialiseToken(asset, generalise('1'.padStart(255,'0')).toString(16));
    salt = await randomSalt();

    await axios.post(`${client.apiUrl}/transform`,
      {
        rootKey: user2.zkpKeys.rootKey,
        inputTokens: [ 
          { 
            id: commitments2[commitments2.length - 1].preimage.tokenId, 
            address: commitments2[commitments2.length - 1].preimage.ercAddress,
            value: commitments2[commitments2.length - 1].preimage.value,
            commitmentHash: commitments2[commitments2.length - 1]._id,
          }
        ],
        outputTokens: [
          {
            id: serialisedInfo.tokenId,
            address: serialisedInfo.ercAddress,
            value: asset.qty.toString(),
            salt,
          }
        ],
        fee: '0',
      }
    );

    /* console.log(`Burning PurchaseOrder commitment ${commitments2[commitments2.length - 1]._id} and minting Asset to ${user2.getNightfallAddress()}`)
    await axios.post(`${client.apiUrl}/burn`, {
      ercAddress: commitments2[commitments2.length - 1].preimage.ercAddress,
      rootKey: user2.zkpKeys.rootKey,
      tokenId: commitments2[commitments2.length - 1].preimage.tokenId,
      value: commitments2[commitments2.length - 1].preimage.value,
      fee: '0',
      providedCommitments: [commitments2[commitments2.length - 1]._id],
    });

    const { txHashL2:txHashL2Asset } = await user2.mintL2Token({
      tokenAddress: serialisedInfo.ercAddress,
      value: asset.qty.toString(),
      tokenId: serialisedInfo.tokenId,
      salt, // optional
      feeWei: config.feeWei,
    });
    console.log(">>>>> Transaction hash L2", txHashL2Asset); */

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);

    commitments = await getUnspentCommitments(user, client);
    commitments2 = await getUnspentCommitments(user2, client);
    tokens = getTokens(commitments);
    tokens2 = getTokens(commitments2);
    console.log("Tokens for user1:", tokens);
    console.log("Tokens for user2:", tokens2);

    console.log(`Transferring Asset commitment ${commitments2[commitments2.length - 1]._id} to ${user2.getNightfallAddress()}`)
    recipientNightfallData = {
      recipientCompressedZkpPublicKeys: [
        user.getNightfallAddress(),
      ],
      values: [commitments2[commitments2.length - 1].preimage.value],
    };
    res = await axios.post(`${client.apiUrl}/transfer`, {
      ercAddress: commitments2[commitments2.length - 1].preimage.ercAddress,
      rootKey: user2.zkpKeys.rootKey,
      recipientData: recipientNightfallData,
      tokenId: commitments2[commitments2.length - 1].preimage.tokenId,
      fee: '0',
      offchain: true,
      providedCommitments: [commitments2[commitments2.length - 1]._id],
    });
    console.log(
      ">>>>> Transaction hash L2",
      res.data.transaction.transactionHash,
    );

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);

    commitments = await getUnspentCommitments(user, client);
    commitments2 = await getUnspentCommitments(user2, client);
    tokens = getTokens(commitments);
    tokens2 = getTokens(commitments2);
    console.log("Tokens for user1:", tokens);
    console.log("Tokens for user2:", tokens2);
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
