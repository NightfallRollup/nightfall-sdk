export const config = {
  clientApiUrl: process.env.APP_CLIENT_API_URL || "http://localhost:8080",
  nightfallMnemonic: process.env.APP_NIGHTFALL_MNEMONIC,
  ethereumPrivateKey: process.env.APP_ETH_PRIVATE_KEY,
  blockchainWsUrl: process.env.APP_BLOCKCHAIN_WEBSOCKET_URL,
  tokenContractAddress:
    process.env.APP_TOKEN_ERC20 ||
    process.env.APP_TOKEN_ERC721 ||
    process.env.APP_TOKEN_ERC1155,
  value: process.env.APP_TX_VALUE,
  tokenId: process.env.APP_TX_TOKEN_ID,
  feeWei: process.env.APP_TX_FEE_WEI || "0",
};
