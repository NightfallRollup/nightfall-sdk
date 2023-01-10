import { UserFactory } from "../../libs/user";
import { config } from "./appConfig";

const main = async () => {
  let user;

  try {
    // # 1 Create an instance of User
    user = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic: config.nightfallMnemonic,
      blockchainWsUrl: config.blockchainWsUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
    });

    // # 2 Make withdrawal
    const txReceipts = await user.makeWithdrawal({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      // tokenId: config.tokenId,
      recipientEthAddress: user.ethAddress,
      // isOffChain: true,
    });
    console.log("Transaction receipts", txReceipts);

    // # 3 Retrieve the transaction hash to finalise the withdrawal after the cooling off period
    console.log(
      "Nightfall withdrawal tx hashes",
      user.nightfallWithdrawalTxHashes,
    );

    // # 4 [OPTIONAL] You can check transfers that are not yet in a block
    const pendingTransfers = await user.checkPendingTransfers();
    console.log("Pending ****************", pendingTransfers);
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    user.close();
    console.log("Bye bye");
  }
};

main();
