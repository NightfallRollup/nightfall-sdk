import { UserFactory } from "../../libs";
import { Client } from "../../libs/client";
import { config } from "./appConfig";

const main = async () => {
  let user;
  const client = new Client(config.clientApiUrl);

  try {
    // # 1 Create an instance of User
    user = await UserFactory.create({
      blockchainWsUrl: config.blockchainWsUrl,
      clientApiUrl: config.clientApiUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
      nightfallMnemonic: config.nightfallMnemonic,
    });

    // # 2 Get my unspent commitments, then
    // pick one commitment to burn (for now, at most 1 commitment can be burnt)
    const myNightfallAddress = user.getNightfallAddress();
    const unspentCommitments = await client.getUnspentCommitments([
      myNightfallAddress,
    ]);

    const commitmentsToBurn = Object.values(
      unspentCommitments[myNightfallAddress as keyof object],
    )[0];
    console.log(">>>> commitmentToBurn", commitmentsToBurn);

    // # 3 Burn
    const { txHashL2 } = await user.burnL2Token({
      tokenContractAddress: commitmentsToBurn[0].ercAddress,
      value: String(commitmentsToBurn[0].balance),
      tokenId: commitmentsToBurn[0].tokenId,
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
