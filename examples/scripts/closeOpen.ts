import { UserFactory } from "../../libs";
import { config } from "./appConfig";

// Script
const main = async () => {
  let user1;

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

    let blockNumber = await user1.web3Websocket.web3.eth.getBlockNumber();
    console.log(">>>>> Block number initial", blockNumber);
    // close and open the websocket connection
    user1.close();
    user1.open();
    blockNumber = await user1.web3Websocket.web3.eth.getBlockNumber();
    console.log(
      ">>>>> Block number after closing and opening the connection again",
      blockNumber,
    );
    // open without closing the websocket connection (internally closes the connection before opening a new one)
    user1.open();
    blockNumber = await user1.web3Websocket.web3.eth.getBlockNumber();
    console.log(
      ">>>>> Block number after opening the connection again without closing it",
      blockNumber,
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    user1.close();
    console.log(">>>>> Bye bye");
  }
};

main();
