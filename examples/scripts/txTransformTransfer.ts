import { Commitment, UserFactory } from "../../libs";
import { createZkpKeys } from "../../libs";
import { randomL2TokenAddress, randomSalt } from "../../libs";
import { config } from "./appConfig";
import getBalance from "./utils/balance";
import makeBlock from "./utils/blocks";

const main = async () => {
  let userSender;
  const value = 6;

  try {
    // # 1 Create an instance of User
    userSender = await UserFactory.create({
      blockchainWsUrl: config.blockchainWsUrl,
      clientApiUrl: config.clientApiUrl,
      clientApiBpUrl: config.clientApiBpUrl,
      clientApiTxUrl: config.clientApiTxUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
      nightfallMnemonic: config.nightfallMnemonic,
    });

    // # 2 Mint token within L2
    const tokenContractAddress = await randomL2TokenAddress();
    const salt = await randomSalt();
    const commitment = new Commitment({
      zkpPublicKey: userSender.zkpKeys.zkpPublicKey.map((x) => BigInt(x)),
      ercAddress: BigInt(tokenContractAddress),
      tokenId: BigInt(1),
      value: BigInt(value),
      salt: BigInt(salt),
    });
    const inputTokens = [
      {
        id: 1,
        address: tokenContractAddress,
        value,
        salt,
        commitmentHash: `0x${BigInt(commitment.hash._hex)
          .toString(16)
          .padStart(64, "0")}`,
      },
    ];
    const outputTokens = [
      {
        id: 2,
        address: tokenContractAddress,
        value,
        salt,
      },
    ];

    const { txHashL2: txHashL2mint } = await userSender.mintL2Token({
      tokenContractAddress,
      tokenId: 1,
      value: value.toString(),
      salt,
      feeWei: "0",
    });

    console.log(">>>>> Mint transaction hash L2", txHashL2mint);
    await makeBlock();

    console.log(">>>>> Wait for minted token to be in a block");

    let balanceToken = await getBalance(userSender, tokenContractAddress);
    while (balanceToken !== value) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      balanceToken = await getBalance(userSender, tokenContractAddress);
    }

    // # 3 Make transformTransfer
    // For this example, we generate a L2 address to receive the transformTransfer
    const { zkpKeys } = await createZkpKeys(config.clientApiUrl);

    const { txHashL2 } = await userSender.makeTransformTransfer({
      inputTokens,
      outputTokens,
      recipientNightfallAddress: zkpKeys.compressedZkpPublicKey,
      feeWei: "0",
    });
    console.log(">>>>> Transaction hash L2 transform transfer", txHashL2);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    userSender.close();
    console.log(">>>>> Bye bye");
  }
};

main();
