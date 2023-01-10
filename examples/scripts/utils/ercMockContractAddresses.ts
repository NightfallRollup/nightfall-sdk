import { UserFactory } from "../../../libs/user";
import { config } from "../appConfig";

// Example script
const main = async () => {
  let user;

  try {
    // # 1 Create an instance of User (mnemonic is optional)
    // Not providing an existing mnemonic creates generates new Nightfall keys
    user = await UserFactory.create({
      clientApiUrl: config.clientApiUrl,
      nightfallMnemonic: config.nightfallMnemonic,
      ethereumPrivateKey: config.ethereumPrivateKey,
      blockchainWsUrl: config.blockchainWsUrl,
    });

    // # 2 Learn ERC Mocked contract addresses (Ganache only)
    const erc20Address = await user.getContractAddress({
      contractName: "ERC20Mock",
    });
    const erc721Address = await user.getContractAddress({
      contractName: "ERC721Mock",
    });
    const erc1155Address = await user.getContractAddress({
      contractName: "ERC1155Mock",
    });
    console.log("ADDRESSES**********");
    console.log("ERC20", erc20Address);
    console.log("ERC721", erc721Address);
    console.log("ERC1155", erc1155Address);
    console.log("****************END");
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    user.close();
    console.log("Bye bye");
  }
};

main();
