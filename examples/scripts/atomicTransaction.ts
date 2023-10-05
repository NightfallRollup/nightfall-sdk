import axios from "axios";
import { UserFactory } from "../../libs";
import { config } from "./appConfig";
import { BalancePerTokenId } from "../../libs/client/types";

const makeBlock = async () => {
  // TODO: For now, i am assuming this works only on localhost with optimist workers, not on testnet
  await axios.post(`${config.optimistApiBawUrl}/block/make-now`);
};

const getBalance = async (user: any, tokenContractAddress: string) => {
  const balancesUser: Record<string, BalancePerTokenId> =
    await user.checkNightfallBalances({
      tokenContractAddresses: [tokenContractAddress],
    });
  if (Object.keys(balancesUser).length === 0) {
    return 0;
  }
  return (Object.values(balancesUser)[0] as unknown as BalancePerTokenId[])[0]
    .balance;
};

// Script
const main = async () => {
  let user1;
  let user2;

  const tokenContractAddress = config.tokenContractAddress ?? "";

  try {
    // # 1 Create an instance of User
    user1 = await UserFactory.create({
      blockchainWsUrl: config.blockchainWsUrl,
      clientApiUrl: config.clientApiUrl,
      clientApiBpUrl: config.clientApiBpUrl,
      clientApiTxUrl: config.clientApiTxUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
      nightfallMnemonic: config.nightfallMnemonic,
    });

    user2 = await UserFactory.create({
      blockchainWsUrl: config.blockchainWsUrl,
      clientApiUrl: config.clientApiUrl,
      clientApiBpUrl: config.clientApiBpUrl,
      clientApiTxUrl: config.clientApiTxUrl,
      ethereumPrivateKey: config.ethereumPrivateKey,
    });

    const balancesUser1Before = await getBalance(user1, tokenContractAddress);
    const balancesUser2Before = await getBalance(user2, tokenContractAddress);

    let txHashL2;

    // # 2 Make deposit
    for (let i = 0; i < 8; i += 1) {
      ({ txHashL2 } = await user1.makeDeposit({
        tokenContractAddress,
        value: config.value,
        tokenId: config.tokenId,
        feeWei: config.feeWei,
      }));
      console.log(">>>>> Transaction hash L2", txHashL2);
    }

    ({ txHashL2 } = await user2.makeDeposit({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      feeWei: config.feeWei,
    }));
    console.log(">>>>> Transaction hash L2", txHashL2);

    console.log(">>>>> Making block manually..");
    await makeBlock();

    let balancesUser1After = await getBalance(user1, tokenContractAddress);
    let balancesUser2After = await getBalance(user2, tokenContractAddress);

    while (
      balancesUser1After <
        balancesUser1Before + 8 * Number(config.value) * 10 ** 9 &&
      balancesUser2After < balancesUser2Before + Number(config.value) * 10 ** 9
    ) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      balancesUser1After = await getBalance(user1, tokenContractAddress);
      balancesUser2After = await getBalance(user2, tokenContractAddress);

      console.log(
        ">>>>> Balance user1",
        balancesUser1After,
        balancesUser1Before + 8 * Number(config.value) * 10 ** 9,
      );
      console.log(
        ">>>>> Balance user2",
        balancesUser2After,
        balancesUser2Before + Number(config.value) * 10 ** 9,
      );
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    user1.close();
    user2.close();
    console.log(">>>>> Bye bye");
  }
};

main();
