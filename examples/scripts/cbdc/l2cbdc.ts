import { UserFactory, randomSalt } from "../../../libs";
import { config } from "../appConfig";
import { getTokensFromCommitments, serialiseToken } from "./serialise";
import { Token, TokenType } from "./types";
import { Client } from "../../../libs/client";
import axios from "axios";
import { Commitment } from "../../../libs/nightfall/types";

let centralBankwCBDC: any;
let commercialBank1wCBDC: any;
let commercialBank1LockedwCBDC: any;
let commercialBank1rCBDC: any;
let user1rCBDC: any;

let commitments: Commitment[];
let commitments2: Commitment[];
let commitments3: Commitment[];
let commitments4: Commitment[];
let commitments5: Commitment[];

const client = new Client(config.clientApiUrl);

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
 * Update commitments and show balance
 */
const updateCommitmentsAndShowBalance = async () => {
  commitments = centralBankwCBDC
    ? await getUnspentCommitments(centralBankwCBDC, client)
    : [];
  commitments2 = commercialBank1wCBDC
    ? await getUnspentCommitments(commercialBank1wCBDC, client)
    : [];
  commitments3 = commercialBank1LockedwCBDC
    ? await getUnspentCommitments(commercialBank1LockedwCBDC, client)
    : [];
  commitments4 = commercialBank1rCBDC
    ? await getUnspentCommitments(commercialBank1rCBDC, client)
    : [];
  commitments5 = user1rCBDC
    ? await getUnspentCommitments(user1rCBDC, client)
    : [];
  console.log(
    "-------------------------------------------------------------------------------------------------------------------",
  );
  console.log("Tokens for centralBank wCBDC:", getTokens(commitments));
  console.log("Tokens for commercialBank1 wCBDC:", getTokens(commitments2));
  console.log(
    "Tokens for commercialBank1 Locked wCBDC:",
    getTokens(commitments3),
  );
  console.log("Tokens for commercialBank1 rCBDC:", getTokens(commitments4));
  console.log("Tokens for user1 rCBDC:", getTokens(commitments5));
  console.log(
    "-------------------------------------------------------------------------------------------------------------------",
  );
};

/**
 * Main function to run the script for L2 tokenisation
 */
const main = async () => {
  try {
    // # 2 Serialize wCBDC tokens for centralBank and mint them
    console.log(`Create centralBank account`);
    centralBankwCBDC = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic: config.nightfallMnemonic,
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });
    console.log(
      `Initial minting for centralBank wCDBD account ${centralBankwCBDC.getNightfallAddress()}`,
    );

    const wCBDCTokens: Token = {
      qty: 1000_000_000_000_0000,
      type: TokenType.wCBDC,
      decimals: 4,
      symbol: "wCBDC",
    };
    console.log("wCBDC tokens to mint:", wCBDCTokens);
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

    await updateCommitmentsAndShowBalance();

    // # 3 Mint token rCBDC to commercialBank1 rCBDC account
    console.log(`Create commercialBank1 accounts`);
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
    console.log(
      `Initial minting for commercialBank1 rCBDC account ${commercialBank1rCBDC.getNightfallAddress()}`,
    );

    const rCBDCTokens: Token = {
      qty: 1000_000_000_000_0000,
      type: TokenType.rCBDC,
      decimals: 4,
      symbol: "rCBDC",
    };
    console.log("rCBDC tokens to mint:", rCBDCTokens);
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

    // # 3 transfer some wCBDC tokens from centralBank to commercialBank1
    console.log(
      `Transferring 1.000.000,0000 wCBDC from centralBank to commercialBank1 wCBDC account ${commercialBank1wCBDC.getNightfallAddress()}`,
    );

    ({ txHashL2 } = await centralBankwCBDC.makeTransfer({
      tokenContractAddress:
        commitments[commitments.length - 1].preimage.ercAddress,
      value: "10000000000",
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

    await updateCommitmentsAndShowBalance();

    // # 4 transfer wCBDC tokens from commercialBank1 to commercialBank1Locked
    // for rCBDC users accounts tokens so they are backed by wCBDC tokens
    console.log(`Create user1 account`);
    user1rCBDC = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic:
        "casual basket girl pelican circle soup easily buzz meadow fossil gasp install",
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });
    console.log(
      `Transferring 1.000,0000 wCBDC from commercialBank1 wCBDC account ${commercialBank1wCBDC.getNightfallAddress()} to commercialBank1 Locked wCBDC account ${commercialBank1LockedwCBDC.getNightfallAddress()}`,
    );

    ({ txHashL2 } = await commercialBank1wCBDC.makeTransfer({
      tokenContractAddress:
        commitments2[commitments2.length - 1].preimage.ercAddress,
      value: "10000000",
      tokenId: commitments2[commitments2.length - 1].preimage.tokenId,
      recipientNightfallAddress:
        commercialBank1LockedwCBDC.getNightfallAddress(),
      isOffChain: true,
      feeWei: "0",
      providedCommitments: [commitments2[commitments2.length - 1]._id],
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);
    console.log(
      `Transferring 1.000,0000 rCBDC from commercialBank1 rCBDC account ${commercialBank1rCBDC.getNightfallAddress()} to user1 rCBDC account ${user1rCBDC.getNightfallAddress()}`,
    );

    ({ txHashL2 } = await commercialBank1rCBDC.makeTransfer({
      tokenContractAddress:
        commitments4[commitments4.length - 1].preimage.ercAddress,
      value: "10000000",
      tokenId: commitments4[commitments4.length - 1].preimage.tokenId,
      recipientNightfallAddress: user1rCBDC.getNightfallAddress(),
      isOffChain: true,
      feeWei: "0",
      providedCommitments: [commitments4[commitments4.length - 1]._id],
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);

    await makeBlock();
    // TODO: wait 25 seconds to make a block
    await waitForTime(25000);

    await updateCommitmentsAndShowBalance();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    centralBankwCBDC.close();
    commercialBank1wCBDC.close();
    commercialBank1LockedwCBDC.close();
    commercialBank1rCBDC.close();
    user1rCBDC.close();
    console.log(">>>>> Bye bye");
  }
};

main();
