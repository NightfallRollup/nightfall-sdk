import { UserFactory } from "../../libs";
import { config } from "./appConfig";

const main = async () => {
  let user;

  try {
    // # 1 Create an instance of User
    user = await UserFactory.create({
      blockchainWsUrl: config.blockchainWsUrl,
      clientApiUrl: config.clientApiUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
      nightfallMnemonic: config.nightfallMnemonic,
    });

    // # 2 Get my unspent commitments, then pick a commitment to burn
    const availableCommitments = await user.checkAvailableCommitments();

    const [tokenContractAddress] = Object.keys(availableCommitments);
    const [commitmentToBurn] = availableCommitments[tokenContractAddress];
    console.log(">>>> commitmentToBurn", commitmentToBurn);

    // # 3 Burn the commitment
    const { txHashL2 } = await user.burnL2Token({
      tokenContractAddress,
      value: String(commitmentToBurn.balance),
      tokenId: commitmentToBurn.tokenId,
      feeWei: config.feeWei,
    });
    console.log(">>>>> Transaction hash L2", txHashL2);

    // # 4 [OPTIONAL] You can check the transaction hash
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
