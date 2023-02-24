import { UserFactory } from "../../libs";
import { randomL2TokenAddress, randomSalt } from "../../libs";
import { config } from "./appConfig";

const main = async () => {
  let user;

  try {
    // # 1 Create an instance of User
    user = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic: config.nightfallMnemonic,
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });

    // # 2 Mint token within L2
    const tokenAddress = await randomL2TokenAddress();
    const salt = await randomSalt();
    const { txHashL2 } = await user.mintL2Token({
      tokenAddress,
      value: config.value,
      tokenId: config.tokenId,
      salt, // optional
      feeWei: config.feeWei,
    });
    console.log(">>>>> Transaction hash L2", txHashL2);

    // # 3 [OPTIONAL] You can check the transaction hash
    // TODO
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    user.close();
    console.log(">>>>> Bye bye");
  }
};

main();
