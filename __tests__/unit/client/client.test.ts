import axios from "axios";
import { Client } from "../../../libs/client";
import { NightfallSdkError } from "../../../libs/utils/error";

jest.mock("axios");

describe("Client", () => {
  const dummyUrl = "dummy-url";
  const client = new Client(dummyUrl);
  const zkpKeys = {
    compressedZkpPublicKey:
      "0x1b28c15d62dd0e837a227e7644c20cd4f96f7d4edca3bd5e544b24dfaabf9c8b",
    nullifierKey:
      "0xef9123f8fa4046940a79b6915e11ebe84f5c7ae60023423f7a0f47b96d32a34",
    rootKey:
      "0x1765c51ea2da66a362a6507dd64572694d6b31fbc1524c7b8e2bed5e514c979a",
    zkpPrivateKey:
      "0x668d89fd55437fe7440de835599a75d70c846c0cb40aacfdd0af02d44cb5a6a",
    zkpPublicKey: [
      "0x28dbdb83efde29f2757add6807cbb301831fabfb89a85d3f69beb5f6bc78ba2",
      "0x1b28c15d62dd0e837a227e7644c20cd4f96f7d4edca3bd5e544b24dfaabf9c8b",
    ],
  };

  describe("Constructor", () => {
    test("Should set apiUrl", () => {
      expect(client.apiUrl).toBe(dummyUrl);
    });
  });

  describe("Method healthCheck", () => {
    const url = dummyUrl + "/healthcheck";

    test("Should return true if client app responds with status 200", async () => {
      // Arrange
      const res = { data: "ok", status: 200 };
      (axios.get as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.healthCheck();

      // Assert
      expect(axios.get).toHaveBeenCalledWith(url);
      expect(result).toBeTruthy();
    });

    test("Should throw an error when client app responds with status other than 200", () => {
      // Arrange
      const res = { data: "ko", status: 201 };
      (axios.get as jest.Mock).mockResolvedValue(res);

      // Act, Assert
      expect(async () => await client.healthCheck()).rejects.toThrow(
        NightfallSdkError,
      );
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("Method getContractAddress", () => {
    const url = dummyUrl + "/contract-address";
    const contractName = "SHIELD";

    test("Should return Shield contract string if client app responds successfully", async () => {
      // Arrange
      const shieldContractAddress =
        "0xff07Edffc0127E5905Fabc40Ff9718eFfE4C14a1";
      const res = { data: { address: shieldContractAddress } };
      (axios.get as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.getContractAddress(contractName);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(`${url}/${contractName}`);
      expect(result).toBe(shieldContractAddress);
    });
  });

  describe("Method generateZkpKeysFromMnemonic", () => {
    const url = dummyUrl + "/generate-zkp-keys";
    const mnemonic =
      "chef fortune soon coral laugh distance arrest summer lottery rival quarter oyster";
    const addressIndex = 0;

    test("Should return a set of Zero-knowledge proof keys if client app responds successfully", async () => {
      // Arrange
      const res = { data: zkpKeys };
      (axios.post as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.generateZkpKeysFromMnemonic(
        mnemonic,
        addressIndex,
      );

      // Assert
      expect(axios.post).toHaveBeenCalledWith(url, { mnemonic, addressIndex });
      expect(result).toBe(zkpKeys);
    });
  });

  describe("Method subscribeToIncomingViewingKeys", () => {
    const url = dummyUrl + "/incoming-viewing-key";

    test("Should return string if client app responds successfully", async () => {
      // Arrange
      const msg = "wagmi";
      const res = { data: msg };
      (axios.post as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.subscribeToIncomingViewingKeys(zkpKeys);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(url, {
        zkpPrivateKeys: [zkpKeys.zkpPrivateKey],
        nullifierKeys: [zkpKeys.nullifierKey],
      });
      expect(result).toBe(msg);
    });
  });

  describe("Method deposit", () => {
    const url = dummyUrl + "/deposit";
    const token = {
      contractAddress: "0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae",
      ercStandard: "ERC20",
    };
    const value = "0.01";
    const fee = "11000000000";
    const tokenId = "0x00";

    test("Should return an instance of <TransactionResponseData> if client app responds successfully", async () => {
      // Arrange
      const txDataToSign = {};
      const transaction = {};
      const data = { txDataToSign, transaction };
      const res = { data };
      (axios.post as jest.Mock).mockResolvedValue(res);

      // Act
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = await client.deposit(token, zkpKeys, value, tokenId, fee);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(url, {
        ercAddress: token.contractAddress,
        tokenType: token.ercStandard,
        tokenId: "0x00",
        value,
        rootKey: zkpKeys.rootKey,
        fee,
      });
      expect(result).toBe(data);
    });
  });

  describe("Method transfer", () => {
    const url = dummyUrl + "/transfer";
    const token = {
      contractAddress: "0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae",
    };
    const recipientNightfallData = {
      recipientCompressedZkpPublicKeys: [
        "0x96f9999c45ded16f8f81c89a7e70ec8eab4fb9298c156d9ce5762ec3b18c3075",
      ],
      values: ["0.01"],
    };
    const fee = "11000000000";
    const isOffChain = false;
    const tokenId = "0x00";

    test("Should return an instance of <TransactionResponseData> if client app responds successfully", async () => {
      // Arrange
      const txDataToSign = {};
      const transaction = {};
      const data = { txDataToSign, transaction };
      const res = { data };
      (axios.post as jest.Mock).mockResolvedValue(res);

      // Act
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = await client.transfer(
        token,
        zkpKeys,
        recipientNightfallData,
        tokenId,
        fee,
        isOffChain,
      );

      // Assert
      expect(axios.post).toHaveBeenCalledWith(url, {
        ercAddress: token.contractAddress,
        rootKey: zkpKeys.rootKey,
        recipientData: recipientNightfallData,
        tokenId: "0x00",
        fee,
        offchain: isOffChain,
      });
      expect(result).toBe(data);
    });

    test("Should throw an error when no suitable commitments are found", () => {
      // Arrange
      const data = { error: "No suitable commitments" };
      const res = { data };
      (axios.post as jest.Mock).mockResolvedValue(res);

      // Act, Assert
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(
        async () =>
          await client.transfer(
            token,
            zkpKeys,
            recipientNightfallData,
            tokenId,
            fee,
            isOffChain,
            [],
            [],
          ),
      ).rejects.toThrow(NightfallSdkError);
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe("Method withdraw", () => {
    const url = dummyUrl + "/withdraw";
    const token = {
      contractAddress: "0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae",
      ercStandard: "ERC20",
    };
    const value = "0.01";
    const fee = "11000000000";
    const recipientEthAddress = "0x0recipientEthAddress";
    const isOffChain = false;
    const tokenId = "0x00";

    test("Should return an instance of <TransactionResponseData> if client app responds successfully", async () => {
      // Arrange
      const txDataToSign = {};
      const transaction = {};
      const data = { txDataToSign, transaction };
      const res = { data };
      (axios.post as jest.Mock).mockResolvedValue(res);

      // Act
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = await client.withdraw(
        token,
        zkpKeys,
        value,
        tokenId,
        fee,
        recipientEthAddress,
        isOffChain,
      );

      // Assert
      expect(axios.post).toHaveBeenCalledWith(url, {
        ercAddress: token.contractAddress,
        tokenType: token.ercStandard,
        tokenId,
        rootKey: zkpKeys.rootKey,
        recipientAddress: recipientEthAddress,
        value,
        fee,
        offchain: isOffChain,
      });
      expect(result).toBe(data);
    });
  });

  describe("Method finaliseWithdrawal", () => {
    const url = dummyUrl + "/finalise-withdrawal";
    const withdrawTxHashL2 = "0x0thitroboatututututu";

    test("Should return an instance of <TransactionResponseData> if client app responds successfully", async () => {
      // Arrange
      const txDataToSign = {};
      const res = { data: txDataToSign };
      (axios.post as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.finaliseWithdrawal(withdrawTxHashL2);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(url, {
        transactionHash: withdrawTxHashL2,
      });
      expect(result).toBe(txDataToSign);
    });
  });

  describe("Method getPendingDeposits", () => {
    const url = dummyUrl + "/commitment/pending-deposit";
    const tokenContractAddresses: string[] = [];

    test("Should return object if client app responds successfully", async () => {
      // Arrange
      const tokenBalances = {
        "0xa8473bef03cbe50229a39718cbdc1fdee2f26b1a": [
          200000,
          {
            balance: 200000,
            tokenId:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
        ],
      };
      const balance = { [zkpKeys.compressedZkpPublicKey]: tokenBalances };
      const res = { data: { balance } };
      (axios.get as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.getPendingDeposits(
        zkpKeys,
        tokenContractAddresses,
      );

      // Assert
      expect(axios.get).toHaveBeenCalledWith(url, {
        params: {
          compressedZkpPublicKey: zkpKeys.compressedZkpPublicKey,
          ercList: tokenContractAddresses,
        },
      });
      expect(result).toBe(tokenBalances);
    });
  });

  describe("Method getNightfallBalances", () => {
    const url = dummyUrl + "/commitment/balance";

    test("Should return object if client app responds successfully", async () => {
      // Arrange
      const tokenBalances = {
        "0xa8473bef03cbe50229a39718cbdc1fdee2f26b1a": [
          {
            balance: 200000,
            tokenId:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
        ],
      };
      const balance = tokenBalances;
      const res = { data: { balance } };
      (axios.get as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.getNightfallBalances(zkpKeys);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(url, {
        params: {
          compressedZkpPublicKey: zkpKeys.compressedZkpPublicKey,
        },
      });
      expect(result).toBe(tokenBalances);
    });
  });
});
