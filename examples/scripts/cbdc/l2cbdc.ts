import { UserFactory, randomSalt } from "../../../libs";
import { config } from "../appConfig";
import { getTokensFromCommitments, serialiseToken } from "./serialise";
import { Token, TokenType } from "./types";
import { Client } from "../../../libs/client";
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
const waitForTime = async (time: number) => {
  await new Promise((resolve) => setTimeout(resolve, time));
};

/**
 * Get commitments for banks
 */
const getUnspentCommitments = async (
  user: any,
  client: Client,
): Promise<Commitment[]> => {
  const commitments = await client.getCommitmentsByCompressedZkpPublicKey([
    user.getNightfallAddress(),
  ]);
  return commitments.filter((c: Commitment) => c.isNullifiedOnChain < 0);
};

/**
 * Get commitments for banks
 */
const getTokens = (commitments: Commitment[]): Token[] => {
  return getTokensFromCommitments(commitments);
};

/**
 * Main function to run the script for L2 tokenisation
 */
const main = async () => {
  let centralBankwCBDC;
  let commercialBank1wCBDC;
  let commercialBank1LockedwCBDC;
  let commercialBank1rCBDC;

  try {
    // # 1 Create an instance of centralBank and commercialBank accounts
    centralBankwCBDC = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic: config.nightfallMnemonic,
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });
    commercialBank1wCBDC = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic:
        "game mother news olive harbor elephant come eager junior finger better quiz",
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });
    commercialBank1LockedwCBDC = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic:
        "practice pottery connect tank walnut anchor focus umbrella desk outdoor other guess",
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });
    commercialBank1rCBDC = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic:
        "any health broken measure main friend unfold act promote fatigue bulb domain",
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });

    const client = new Client(config.clientApiUrl);
    // # 2 Serialize wCBDC tokens for centralBank and mint them
    console.log(
      `Minting wCBDC commitment for centralBank ${centralBankwCBDC.getNightfallAddress()}`,
    );
    const wCBDCTokens: Token = {
      qty: 4000,
      type: TokenType.wCBDC,
      decimals: 2,
      symbol: "wCBDC",
    };
    console.log("wCBDC tokens:", wCBDCTokens);
    const serialisedInfoWCDBC = serialiseToken(wCBDCTokens);
    /* console.log("SERIALIZED INFO:", wCBDCTokens, serialisedInfoWCDBC);
    const deserialisedInfo = deserialiseToken(
      serialisedInfoWCDBC.tokenId,
      serialisedInfoWCDBC.ercAddress,
      wCBDCTokens.qty,
    );
    console.log("DESERIALIZED INFO:", serialisedInfoWCDBC, deserialisedInfo); */

    let salt = await randomSalt();
    let { txHashL2 } = await centralBankwCBDC.mintL2Token({
      tokenContractAddress: serialisedInfoWCDBC.ercAddress,
      value: wCBDCTokens.qty.toString(),
      tokenId: serialisedInfoWCDBC.tokenId,
      salt, // optional
      feeWei: config.feeWei,
    });
    console.log(">>>>> Transaction hash L2", txHashL2);

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);

    let commitments = await getUnspentCommitments(centralBankwCBDC, client);
    let commitments2 = await getUnspentCommitments(
      commercialBank1wCBDC,
      client,
    );
    let commitments3 = await getUnspentCommitments(
      commercialBank1LockedwCBDC,
      client,
    );
    let commitments4 = await getUnspentCommitments(
      commercialBank1rCBDC,
      client,
    );
    let tokens = getTokens(commitments);
    let tokens2 = getTokens(commitments2);
    let tokens3 = getTokens(commitments3);
    let tokens4 = getTokens(commitments4);
    console.log("Tokens for centralBank wCBDC:", tokens);
    console.log("Tokens for commercialBank1 wCBDC:", tokens2);
    console.log("Tokens for commercialBank1 Locked wCBDC:", tokens3);
    console.log("Tokens for commercialBank1 rCBDC:", tokens4);

    // # 3 transfer some wCBDC tokens from centralBank to commercialBank1
    console.log(
      `Transferring wCBDC 1000 value of commitment ${
        commitments[commitments.length - 1]._id
      } to commercialBank1 wCBDC account ${commercialBank1wCBDC.getNightfallAddress()}`,
    );

    ({ txHashL2 } = await centralBankwCBDC.makeTransfer({
      tokenContractAddress:
        commitments[commitments.length - 1].preimage.ercAddress,
      value: "1000",
      tokenId: commitments[commitments.length - 1].preimage.tokenId,
      recipientNightfallAddress: commercialBank1wCBDC.getNightfallAddress(),
      isOffChain: true,
      feeWei: "0",
      providedCommitments: [commitments[commitments.length - 1]._id],
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);

    commitments = await getUnspentCommitments(centralBankwCBDC, client);
    commitments2 = await getUnspentCommitments(commercialBank1wCBDC, client);
    commitments3 = await getUnspentCommitments(
      commercialBank1LockedwCBDC,
      client,
    );
    commitments4 = await getUnspentCommitments(commercialBank1rCBDC, client);
    tokens = getTokens(commitments);
    tokens2 = getTokens(commitments2);
    tokens3 = getTokens(commitments3);
    tokens4 = getTokens(commitments4);
    console.log("Tokens for centralBank wCBDC:", tokens);
    console.log("Tokens for commercialBank1 wCBDC:", tokens2);
    console.log("Tokens for commercialBank1 Locked wCBDC:", tokens3);
    console.log("Tokens for commercialBank1 rCBDC:", tokens4);

    // # 4 transfer wCBDC tokens from commercialBank1 to commercialBank1Locked
    // for minting rCBDC tokens so they are backed by wCBDC tokens
    console.log(
      `Transferring wCBDC 1000 value of commitment ${
        commitments2[commitments2.length - 1]._id
      } from commercialBank1 wCBDC account ${commercialBank1wCBDC.getNightfallAddress()} to commercialBank1 Locked wCBDC account ${commercialBank1LockedwCBDC.getNightfallAddress()}`,
    );

    ({ txHashL2 } = await commercialBank1wCBDC.makeTransfer({
      tokenContractAddress:
        commitments2[commitments2.length - 1].preimage.ercAddress,
      value: "1000",
      tokenId: commitments2[commitments2.length - 1].preimage.tokenId,
      recipientNightfallAddress:
        commercialBank1LockedwCBDC.getNightfallAddress(),
      isOffChain: true,
      feeWei: "0",
      providedCommitments: [commitments2[commitments2.length - 1]._id],
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);

    // # 5 Mint token rCBDC to commercialBank1 rCBDC account after locking wCBDC tokens
    console.log(
      `Minting rCBDC commitment to commercialBank1 rCBDC account ${commercialBank1rCBDC.getNightfallAddress()}`,
    );
    const rCBDCTokens: Token = {
      qty: 1000,
      type: TokenType.rCBDC,
      decimals: 2,
      symbol: "rCBDC",
    };
    console.log("rCBDCTokens:", rCBDCTokens);
    const serialisedInfoRCDBC = serialiseToken(rCBDCTokens);
    salt = await randomSalt();
    ({ txHashL2 } = await commercialBank1rCBDC.mintL2Token({
      tokenContractAddress: serialisedInfoRCDBC.ercAddress,
      value: rCBDCTokens.qty.toString(),
      tokenId: serialisedInfoRCDBC.tokenId,
      salt, // optional
      feeWei: config.feeWei,
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);

    commitments = await getUnspentCommitments(centralBankwCBDC, client);
    commitments2 = await getUnspentCommitments(commercialBank1wCBDC, client);
    commitments3 = await getUnspentCommitments(
      commercialBank1LockedwCBDC,
      client,
    );
    commitments4 = await getUnspentCommitments(commercialBank1rCBDC, client);
    tokens = getTokens(commitments);
    tokens2 = getTokens(commitments2);
    tokens3 = getTokens(commitments3);
    tokens4 = getTokens(commitments4);
    console.log("Tokens for centralBank wCBDC:", tokens);
    console.log("Tokens for commercialBank1 wCBDC:", tokens2);
    console.log("Tokens for commercialBank1 Locked wCBDC:", tokens3);
    console.log("Tokens for commercialBank1 rCBDC:", tokens4);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    centralBankwCBDC.close();
    commercialBank1wCBDC.close();
    commercialBank1LockedwCBDC.close();
    commercialBank1rCBDC.close();
    console.log(">>>>> Bye bye");
  }
};

main();
