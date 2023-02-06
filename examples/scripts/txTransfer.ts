import { UserFactory } from "../../libs/user";
import { createZkpKeys } from "../../libs/utils";
import { config } from "./appConfig";

const main = async () => {
  let userSender;

  try {
    // # 1 Create an instance of User
    userSender = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
      nightfallMnemonic: config.nightfallMnemonic,
      blockchainWsUrl: config.blockchainWsUrl,
    });

    // # 2 Make transfer
    // For this example, we generate a L2 address to receive the transfer
    const { zkpKeys } = await createZkpKeys(config.clientApiUrl);

    const txReceipts = await userSender.makeTransfer({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      recipientNightfallAddress: zkpKeys.compressedZkpPublicKey,
      isOffChain: true,
      feeWei: config.feeWei,
    });
    console.log("Transaction receipts", txReceipts);

    // # 4 [OPTIONAL] You can check the transaction hash
    console.log(
      "Nightfall transfer tx hashes",
      userSender.nightfallTransferTxHashes,
    );

    // # 5 [OPTIONAL] You can check transfers that are not yet in a block
    const pendingTransfers = await userSender.checkPendingTransfers();
    console.log("Pending balances", pendingTransfers);
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    userSender.close();
    console.log("Bye bye");
  }
};

main();
