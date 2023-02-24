import { getContractAddress } from "../../../libs";
import { config } from "../appConfig";

const main = async () => {
  try {
    const { clientApiUrl } = config;

    const ERC20Mock = "ERC20Mock";
    const erc20Address = await getContractAddress(clientApiUrl, ERC20Mock);

    const ERC721Mock = "ERC721Mock";
    const erc721Address = await getContractAddress(clientApiUrl, ERC721Mock);

    const ERC1155Mock = "ERC1155Mock";
    const erc1155Address = await getContractAddress(clientApiUrl, ERC1155Mock);

    console.log(">>>>> ADDRESSES");
    console.log("ERC20", erc20Address);
    console.log("ERC721", erc721Address);
    console.log("ERC1155", erc1155Address);
    console.log(">>>>> END");
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    console.log("Bye bye");
  }
};

main();
