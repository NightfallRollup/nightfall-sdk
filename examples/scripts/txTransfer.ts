import { UserFactory } from "../../libs/user";
import { config } from "./appConfig";

const main = async () => {
  let userSender;
  let userRecipient;

  try {
    // # 1 Create an instance of User
    userSender = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
      nightfallMnemonic: config.nightfallMnemonic,
      blockchainWsUrl: config.blockchainWsUrl,
    });

    // # 2 [OPTIONAL] For this example, we create a 2nd User
    // For simplicity, we re-use L1 wallet,
    // but we skip the mnemonic to generate new keys or 'a different wallet'
    userRecipient = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });

    // # 3 Make transfer
    const isOffChain = true;
    const { txHashL1, txHashL2 } = await userSender.makeTransfer({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      recipientNightfallAddress: userRecipient.getNightfallAddress(),
      isOffChain,
      feeWei: config.feeWei,
    });
    console.log(
      ">>>>> Transaction hash L1 (`undefined` if off-chain)",
      txHashL1,
    );
    console.log(">>>>> Transaction hash L2", txHashL2);

    // # 4 [OPTIONAL] You can check the transaction hash
    // TODO

    // # 5 [OPTIONAL] You can check transfers that are not yet in a block
    const pendingTransfers = await userSender.checkPendingTransfers();
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
    userRecipient.close();
    console.log(">>>>> Bye bye");
  }
};

main();
