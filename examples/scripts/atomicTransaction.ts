import axios from "axios";
import { UserFactory, randomSalt } from "../../libs";
import { config } from "./appConfig";
import { BalancePerTokenId } from "../../libs/client/types";
import { Commitment } from "../../libs";
import { BN128_GROUP_ORDER } from "../../libs/commitment/constants";

const makeBlock = async (timeoutms: number) => {
  await new Promise((resolve) => setTimeout(resolve, timeoutms));
  // TODO: For now, i am assuming this works only on localhost with optimist workers, not on testnet
  await axios.post(`${config.optimistApiBawUrl}/block/make-now`);
};

const getBalance = async (user: any, tokenContractAddress: string) => {
  const balancesUser: Record<string, BalancePerTokenId> =
    await user.checkNightfallBalances({
      tokenContractAddresses: [tokenContractAddress],
    });
  if (Object.keys(balancesUser).length === 0) {
    return 0;
  }
  return (Object.values(balancesUser)[0] as unknown as BalancePerTokenId[])[0]
    .balance;
};

// Script
const main = async () => {
  let user1;
  let user2;

  const tokenContractAddress = config.tokenContractAddress ?? "";

  try {
    // # 1 Create an instance of User
    user1 = await UserFactory.create({
      blockchainWsUrl: config.blockchainWsUrl,
      clientApiUrl: config.clientApiUrl,
      clientApiBpUrl: config.clientApiBpUrl,
      clientApiTxUrl: config.clientApiTxUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
      nightfallMnemonic: config.nightfallMnemonic,
    });

    user2 = await UserFactory.create({
      blockchainWsUrl: config.blockchainWsUrl,
      clientApiUrl: config.clientApiUrl,
      clientApiBpUrl: config.clientApiBpUrl,
      clientApiTxUrl: config.clientApiTxUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
    });

    const balancesUser1Before = await getBalance(user1, tokenContractAddress);
    const balancesUser2Before = await getBalance(user2, tokenContractAddress);

    let txHashL2;

    // # 2 Make deposit
    for (let i = 0; i < 8; i += 1) {
      ({ txHashL2 } = await user1.makeDeposit({
        tokenContractAddress,
        value: config.value,
        tokenId: config.tokenId,
        feeWei: config.feeWei,
      }));
      console.log(">>>>> Transaction hash L2", txHashL2);
    }

    ({ txHashL2 } = await user2.makeDeposit({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      feeWei: config.feeWei,
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);

    console.log(">>>>> Making block manually..");
    await makeBlock(10000);

    let balancesUser1After = await getBalance(user1, tokenContractAddress);
    let balancesUser2After = await getBalance(user2, tokenContractAddress);

    while (
      balancesUser1After <
        balancesUser1Before + 8 * Number(config.value) * 10 ** 9 &&
      balancesUser2After < balancesUser2Before + Number(config.value) * 10 ** 9
    ) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      balancesUser1After = await getBalance(user1, tokenContractAddress);
      balancesUser2After = await getBalance(user2, tokenContractAddress);

      console.log(
        ">>>>> Balance user1",
        balancesUser1After,
        balancesUser1Before + 8 * Number(config.value) * 10 ** 9,
      );
      console.log(
        ">>>>> Balance user2",
        balancesUser2After,
        balancesUser2Before + Number(config.value) * 10 ** 9,
      );
    }

    const blockNumber = await user1.web3Websocket.web3.eth.getBlockNumber();
    const timestamp = (await user1.web3Websocket.web3.eth.getBlock(blockNumber))
      .timestamp;

    let salt = await randomSalt();
    let salt2 = await randomSalt();
    let salt3 = await randomSalt();

    let commitment = new Commitment({
      zkpPublicKey: user2.zkpKeys.zkpPublicKey.map((x) => x),
      ercAddress: BigInt(config.tokenContractAddress ?? 0),
      tokenId: BigInt(config.tokenId ?? 0),
      value: BigInt(config.value ?? 0),
      salt: BigInt(salt),
    });

    let commitment2 = new Commitment({
      zkpPublicKey: user2.zkpKeys.zkpPublicKey.map((x) => x),
      ercAddress: BigInt(config.tokenContractAddress ?? 0),
      tokenId: BigInt(config.tokenId ?? 0),
      value: BigInt(config.value ?? 0),
      salt: BigInt(salt2),
    });

    let commitment3 = new Commitment({
      zkpPublicKey: user1.zkpKeys.zkpPublicKey.map((x) => x),
      ercAddress: BigInt(config.tokenContractAddress ?? 0),
      tokenId: BigInt(config.tokenId ?? 0),
      value: BigInt(config.value ?? 0),
      salt: BigInt(salt3),
    });

    let atomicHash = `0x${(
      BigInt(commitment.hash._hex) ^
      BigInt(commitment2.hash._hex) ^
      BigInt(commitment3.hash._hex) ^
      BigInt(timestamp)
    ).toString(16)}`;

    while (BigInt(atomicHash) > BN128_GROUP_ORDER) {
      console.log("recalculcating atomic hash");
      salt = await randomSalt();
      salt2 = await randomSalt();
      salt3 = await randomSalt();

      commitment = new Commitment({
        zkpPublicKey: user2.zkpKeys.zkpPublicKey.map((x) => x),
        ercAddress: BigInt(config.tokenContractAddress ?? 0),
        tokenId: BigInt(config.tokenId ?? 0),
        value: BigInt(config.value ?? 0),
        salt: BigInt(salt),
      });

      commitment2 = new Commitment({
        zkpPublicKey: user2.zkpKeys.zkpPublicKey.map((x) => x),
        ercAddress: BigInt(config.tokenContractAddress ?? 0),
        tokenId: BigInt(config.tokenId ?? 0),
        value: BigInt(config.value ?? 0),
        salt: BigInt(salt2),
      });

      commitment3 = new Commitment({
        zkpPublicKey: user1.zkpKeys.zkpPublicKey.map((x) => x),
        ercAddress: BigInt(config.tokenContractAddress ?? 0),
        tokenId: BigInt(config.tokenId ?? 0),
        value: BigInt(config.value ?? 0),
        salt: BigInt(salt3),
      });

      atomicHash = `0x${(
        BigInt(commitment.hash._hex) ^
        BigInt(commitment2.hash._hex) ^
        BigInt(commitment3.hash._hex) ^
        BigInt(timestamp)
      ).toString(16)}`;
    }
    console.log({
      msg: `Atomic transaction:`,
      commitment: commitment.hash._hex,
      commitment2: commitment2.hash._hex,
      commitment3: commitment3.hash._hex,
      atomicHash,
    });

    console.log(
      `Adding first transaction of the atomic transaction ${atomicHash}...`,
    );

    const isOffChain = true;

    // Send the first atomic transaction
    ({ txHashL2 } = await user1.makeTransfer({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      recipientNightfallAddress: user2.zkpKeys.compressedZkpPublicKey,
      isOffChain,
      feeWei: config.feeWei,
      atomicHash,
      atomicTimestamp: Number(timestamp),
      salt,
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);

    // Send another transaction to build a block because atomic transaction is not still completed to be included in a block
    ({ txHashL2 } = await user1.makeTransfer({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      recipientNightfallAddress: user1.zkpKeys.compressedZkpPublicKey,
      isOffChain,
      feeWei: config.feeWei,
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);
    await makeBlock(20000);

    console.log(
      `Adding second transaction of the atomic transaction ${atomicHash}...`,
    );
    // Send the second atomic transaction
    ({ txHashL2 } = await user1.makeTransfer({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      recipientNightfallAddress: user2.zkpKeys.compressedZkpPublicKey,
      isOffChain,
      feeWei: config.feeWei,
      atomicHash,
      atomicTimestamp: Number(timestamp),
      salt: salt2,
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);

    // Send another transaction to build a block because atomic transaction is not still completed to be included in a block
    ({ txHashL2 } = await user1.makeTransfer({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      recipientNightfallAddress: user1.zkpKeys.compressedZkpPublicKey,
      isOffChain,
      feeWei: config.feeWei,
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);
    await makeBlock(20000);

    console.log(
      `Adding third transaction of the atomic transaction ${atomicHash}...`,
    );

    // Send the third atomic transaction
    // Send the second atomic transaction
    ({ txHashL2 } = await user2.makeTransfer({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      recipientNightfallAddress: user1.zkpKeys.compressedZkpPublicKey,
      isOffChain,
      feeWei: config.feeWei,
      atomicHash,
      atomicTimestamp: Number(timestamp),
      salt: salt3,
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);

    // Send another transaction to build a block because atomic transaction is not still completed to be included in a block
    ({ txHashL2 } = await user1.makeTransfer({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      recipientNightfallAddress: user1.zkpKeys.compressedZkpPublicKey,
      isOffChain,
      feeWei: config.feeWei,
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);
    await makeBlock(20000);
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    user1.close();
    user2.close();
    console.log(">>>>> Bye bye");
  }
};

main();
