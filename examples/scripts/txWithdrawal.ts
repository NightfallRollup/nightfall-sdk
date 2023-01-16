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
      tokenId: config.tokenId,
      recipientEthAddress: user.ethAddress,
      isOffChain: true,
      feeWei: config.feeWei,
    });
    console.log("Transaction receipts", txReceipts);

    // # 3 Retrieve the transaction hash to finalise the withdrawal after the cooling off period
    console.log(
      "Nightfall withdrawal tx hashes",
      user.nightfallWithdrawalTxHashes,
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    user.close();
    console.log("Bye bye");
  }
};

main();
