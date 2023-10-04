import { UserFactory } from "../../libs";
import { randomL2TokenAddress, randomSalt } from "../../libs";
import { config } from "./appConfig";

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

    // # 2 Mint token within L2
    const tokenContractAddress = await randomL2TokenAddress();
    const salt = await randomSalt();
    const { txHashL2 } = await user.mintL2Token({
      tokenContractAddress,
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
