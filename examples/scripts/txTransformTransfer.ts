import { UserFactory } from "../../libs";
import { createZkpKeys } from "../../libs";
import { randomL2TokenAddress, randomSalt } from "../../libs";
import { config } from "./appConfig";

const main = async () => {
  let userSender;

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
    const inputTokens = [
      JSON.stringify({
        tokenContractAddress,
        tokenId: 1,
        value: 6,
        salt,
        feeWei: "0",
      }),
    ];
    const outputTokens = [
      JSON.stringify({
        tokenContractAddress,
        tokenId: 2,
        value: "6",
        salt,
        feeWei: "0",
      }),
    ];
    await userSender.mintL2Token({
      tokenContractAddress,
      tokenId: 1,
      value: "6",
      salt,
      feeWei: "0",
    });

    // # 3 Make transformTransfer
    // For this example, we generate a L2 address to receive the transformTransfer
    const { zkpKeys } = await createZkpKeys(config.clientApiUrl);

    const isOffChain = true;
    const { txHashL1, txHashL2 } = await userSender.makeTransformTransfer({
      tokenContractAddress,
      feeWei: "0",
      recipientNightfallAddress: zkpKeys.compressedZkpPublicKey,
      inputTokens,
      outputTokens,
    });
    console.log(
      ">>>>> Transaction hash L1 (`undefined` if off-chain)",
      txHashL1,
    );
    console.log(">>>>> Transaction hash L2", txHashL2);

    // # 4 [OPTIONAL] You can check the transaction hash
    // TODO

    // # 5 [OPTIONAL] You can check transfers that are not yet in a block
    const pendingTransfers =
      await userSender.checkPendingTransfersAndWithdrawals();
    console.log(">>>>> Pending balances", pendingTransfers);

    // # 6 [EXTRA] Check that L1 tx was mined before closing the websocket in `finally` clause
    if (!isOffChain) {
      let isTxL1Mined =
        await userSender.web3Websocket.web3.eth.getTransactionReceipt(txHashL1);
      while (isTxL1Mined === null) {
        console.log(">>>>> Waiting for L1 transaction to be mined..");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        isTxL1Mined =
          await userSender.web3Websocket.web3.eth.getTransactionReceipt(
            txHashL1,
          );
      }
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    userSender.close();
    console.log(">>>>> Bye bye");
  }
};

main();
