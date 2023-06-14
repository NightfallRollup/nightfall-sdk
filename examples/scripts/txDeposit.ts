import { UserFactory } from "../../libs";
import { config } from "./appConfig";

// Example script
const main = async () => {
  let user;

  try {
    // # 1 Create an instance of User (bip39 mnemonic is optional)
    // Will generate a new bip39 mnemonic if you don't pass one and derive a new set of zero-knowledge proof keys
    user = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic: config.nightfallMnemonic,
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });

    // # 2 [OPTIONAL] If you did not pass a mnemonic, make sure to retrieve it
    // const mnemonic = user.getNightfallMnemonic();

    // # 3 [OPTIONAL] You can check API Client, blockchain ws connection
    const isClientAlive = await user.isClientAlive();
    const isWeb3WsAlive = await user.isWeb3WsAlive();
    console.log(">>>>> API Client alive", isClientAlive);
    console.log(">>>>> Blockchain ws alive", isWeb3WsAlive);

    // # 4 Make deposit
    const { txHashL1, txHashL2 } = await user.makeDeposit({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      feeWei: config.feeWei,
    });
    console.log(">>>>> Transaction hash L1", txHashL1);
    console.log(">>>>> Transaction hash L2", txHashL2);

    // # 5 [OPTIONAL] You can check the transaction hash
    // TODO

    // # 6 [OPTIONAL] You can check deposits that are not yet in Nightfall
    const pendingDeposits = await user.checkPendingDeposits({
      tokenContractAddresses: [config.tokenContractAddress],
    });
    console.log(">>>>> Pending balances for deposited token", pendingDeposits);

    // # 7 [EXTRA] Check that L1 tx was mined before closing the websocket in `finally` clause
    let isTxL1Mined = await user.web3Websocket.web3.eth.getTransactionReceipt(
      txHashL1,
    );
    while (isTxL1Mined === null) {
      console.log(">>>>> Waiting for L1 transaction to be mined..");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      isTxL1Mined = await user.web3Websocket.web3.eth.getTransactionReceipt(
        txHashL1,
      );
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    user.close();
    console.log(">>>>> Bye bye");
  }
};

main();
