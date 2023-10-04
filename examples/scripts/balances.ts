import { UserFactory } from "../../libs";
import { config } from "./appConfig";

// Script
const main = async () => {
  let user;
  try {
    // # 1 Create an instance of User
    user = await UserFactory.create({
      blockchainWsUrl: config.blockchainWsUrl,
      clientApiUrl: config.clientApiUrl,
      clientApiBpUrl: config.clientApiBpUrl,
      clientApiTxUrl: config.clientApiTxUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
      nightfallMnemonic: config.nightfallMnemonic,
    });

    // # 2 Check Nightfall balances - allows filtering by tokenContractAddresses
    const balances = await user.checkNightfallBalances({
      tokenContractAddresses: [config.tokenContractAddress],
    });
    console.log(">>>>> Balances", balances);
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    user.close();
    console.log(">>>>> Bye bye");
  }
};

main();
