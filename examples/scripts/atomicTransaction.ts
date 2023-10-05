import axios from "axios";
import { UserFactory } from "../../libs";
import { config } from "./appConfig";
import { BalancePerTokenId } from "../../libs/client/types";

const makeBlock = async () => {
  // TODO: For now, i am assuming this works only on localhost with optimist workers, not on testnet
  await axios.post(`${config.optimistApiTxUrl}/block/make-now`);
};

// Script
const main = async () => {
  let user1;
  let user2;

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

    let txHashL1;
    let txHashL2;

    // # 2 Make deposit
    for (let i = 0; i < 8; i += 1) {
      ({ txHashL1, txHashL2 } = await user1.makeDeposit({
        tokenContractAddress: config.tokenContractAddress,
        value: config.value,
        tokenId: config.tokenId,
        feeWei: config.feeWei,
      }));
      console.log(">>>>> Transaction hash L1", txHashL1);
      console.log(">>>>> Transaction hash L2", txHashL2);
    }

    ({ txHashL1, txHashL2 } = await user2.makeDeposit({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      feeWei: config.feeWei,
    }));
    console.log(">>>>> Transaction hash L1", txHashL1);
    console.log(">>>>> Transaction hash L2", txHashL2);

    console.log(">>>>> Making block manually..");
    await makeBlock();

    // # 7 [EXTRA] Check that L1 tx was mined before closing the websocket in `finally` clause
    let isTxL1Mined = await user2.web3Websocket.web3.eth.getTransactionReceipt(
      txHashL1,
    );
    while (isTxL1Mined === null) {
      console.log(">>>>> Waiting for L1 transaction to be mined..");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      isTxL1Mined = await user2.web3Websocket.web3.eth.getTransactionReceipt(
        txHashL1,
      );
    }

    const balancesUser1: Record<string, BalancePerTokenId> =
      await user1.checkNightfallBalances({
        tokenContractAddresses: [config.tokenContractAddress],
      });

    const balancesUser2: Record<string, BalancePerTokenId> =
      await user2.checkNightfallBalances({
        tokenContractAddresses: [config.tokenContractAddress],
      });

    console.log(
      ">>>>> Balances user1",
      (Object.values(balancesUser1)[0] as unknown as BalancePerTokenId[])[0]
        .balance,
    );
    console.log(
      ">>>>> Balances user2",
      (Object.values(balancesUser2)[0] as unknown as BalancePerTokenId[])[0]
        .balance,
    );
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
