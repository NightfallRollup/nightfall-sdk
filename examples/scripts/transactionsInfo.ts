import axios from "axios";
import { UserFactory, createZkpKeys } from "../../libs";
import { config } from "./appConfig";

const makeBlock = async () => {
  // TODO: For now, i am assuming this works only on localhost with optimist workers, not on testnet
  await axios.post(`${config.optimistApiTxUrl}/block/make-now`);
};

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

    let txHashL1;
    let txHashL2;

    // # 4 Make deposit
    ({ txHashL1, txHashL2 } = await user.makeDeposit({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      feeWei: config.feeWei,
    }));
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

    // # 2 Make transfer
    // For this example, we generate a L2 address to receive the transfer
    const { zkpKeys } = await createZkpKeys(config.clientApiUrl);

    const isOffChain = true;
    ({ txHashL1, txHashL2 } = await user.makeTransfer({
      tokenContractAddress: config.tokenContractAddress,
      value: config.value,
      tokenId: config.tokenId,
      recipientNightfallAddress: zkpKeys.compressedZkpPublicKey,
      isOffChain,
      feeWei: config.feeWei,
    }));
    console.log(
      ">>>>> Transaction hash L1 (`undefined` if off-chain)",
      txHashL1,
    );
    console.log(">>>>> Transaction hash L2", txHashL2);

    // # 3 [OPTIONAL] You can check the transaction hash
    // TODO

    // # 4 [OPTIONAL] You can check transfers that are not yet in a block
    const pendingTransfers =
      await user.checkPendingTransfersAndWithdrawals();
    console.log(">>>>> Pending balances", pendingTransfers);

    // # 5 [EXTRA] Check that L1 tx was mined before closing the websocket in `finally` clause
    if (!isOffChain) {
      let isTxL1Mined =
        await user.web3Websocket.web3.eth.getTransactionReceipt(txHashL1);
      while (isTxL1Mined === null) {
        console.log(">>>>> Waiting for L1 transaction to be mined..");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        isTxL1Mined =
          await user.web3Websocket.web3.eth.getTransactionReceipt(
            txHashL1,
          );
      }
    } else {
      // # 5 [EXTRA] Wait for a block to be mined
      console.log(">>>>> Making block manually..");
      await makeBlock();
      // # 6 Get Nightfall transactions info by transaction hashes (only transactions in block return info)
      let transactionsInfo = await user.getTransactionsInfo({
        transactionHashes: [txHashL2],
      });
      while (transactionsInfo.length === 0) {
        console.log(">>>>> Waiting for L2 transaction to be mined..");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        transactionsInfo = await user.getTransactionsInfo({
          transactionHashes: [txHashL2],
        });
      }
      console.log(">>>>> transactions info", transactionsInfo);       
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    user.close();
    console.log(">>>>> Bye bye");
  }
};

main();
