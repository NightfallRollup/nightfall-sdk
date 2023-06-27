import { UserFactory, randomSalt } from "../../../libs";
import { config } from "../appConfig";
import { getTokensFromCommitments, serialiseToken } from "./serialise";
import { Token, TokenInfo, TokenType } from "./types";
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
    console.warn(`Minting wCBDC commitment to ${user.getNightfallAddress()}`)
    const wCBDCTokens: Token = { batch: "1", qty: 32, type: TokenType.wCBDC };
    console.log("wCBDCTokens:", wCBDCTokens);
    const serialisedInfo = serialiseToken(wCBDCTokens, generalise('1'.padStart(255,'0')).toString(16));
    /* console.log("SERIALIZED INFO:", po, serialisedInfo);
     const deserialisedInfo = deserialiseToken(serialisedInfo.tokenId, serialisedInfo.ercAddress);
     console.log("DESERIALIZED INFO:", serialisedInfo, deserialisedInfo);
    */

    // # 3 Mint token of the purchase order within L2
    const salt = await randomSalt();
    const { txHashL2 } = await user.mintL2Token({
      tokenContractAddress: serialisedInfo.ercAddress,
      value: wCBDCTokens.qty.toString(),
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
    const recipientNightfallData = {
      recipientCompressedZkpPublicKeys: [
        user2.getNightfallAddress(),
      ],
      values: ["1"],
    };

    console.log(`Transferring wCBDC commitment ${commitments[commitments.length - 1]._id} to ${user2.getNightfallAddress()}`)
    
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