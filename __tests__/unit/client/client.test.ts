import axios from "axios";
import { Client } from "../../../libs/client";

jest.mock("axios");

describe("Client", () => {
  const dummyUrl = "dummy-url";
  const client = new Client(dummyUrl);
  const zkpKeys = {
    compressedZkpPublicKey:
      "0x00781eab9bd94da3eb84c7a1b085f162f5eb58f9c189efef788a5176982a07e1",
    nullifierKey:
      "0x1ec80c50b816fff74890a5d08bc95c1c749d955201b8a9ada0f99a117b8ccc8a",
    rootKey:
      "0x2366fc5530da8bc6618f01b2ac8fee17489cdef28ee8c21a0b945ba883d0da7c",
    zkpPrivateKey:
      "0xd9f1e813a2c10559620ad3fba2050c13898d1250776f27b9e7f35de5f973788",
    zkpPublicKey: [
      "0x39cf22690edcc4d25eb1121a8d583e566b03463ef2defc8703670878ddca0ce",
      "0x781eab9bd94da3eb84c7a1b085f162f5eb58f9c189efef788a5176982a07e1",
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

    test("Should return false if client app responds with status other than 200", async () => {
      // Arrange
      const res = { data: "ko", status: 201 };
      (axios.get as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.healthCheck();

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result).toBeFalsy();
    });

    test("Should return false if client app responds with status outside the successful range", async () => {
      // Arrange
      (axios.get as jest.Mock).mockRejectedValue(
        new Error("Axios error at healthcheck"),
      );

      // Act
      const result = await client.healthCheck();

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result).toBeFalsy();
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

    test("Should return null if client app responds with status outside the successful range", async () => {
      // Arrange
      (axios.get as jest.Mock).mockRejectedValue(
        new Error("Axios error at contract-address"),
      );

      // Act
      const result = await client.getContractAddress(contractName);

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
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

    test("Should return null if client app responds with status outside the successful range", async () => {
      // Arrange
      (axios.post as jest.Mock).mockRejectedValue(
        new Error("Axios error at generate-zkp-keys"),
      );

      // Act
      const result = await client.generateZkpKeysFromMnemonic(
        mnemonic,
        addressIndex,
      );

      // Assert
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
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

    test("Should return null if client app responds with status outside the successful range", async () => {
      // Arrange
      (axios.post as jest.Mock).mockRejectedValue(
        new Error("Axios error at incoming-viewing-key"),
      );

      // Act
      const result = await client.subscribeToIncomingViewingKeys(zkpKeys);

      // Assert
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
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

    test("Should return object if client app responds successfully", async () => {
      // Arrange
      const data = {};
      const res = { data };
      (axios.post as jest.Mock).mockResolvedValue(res);

      // Act
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = await client.deposit(token, zkpKeys, value, fee);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(url, {
        ercAddress: token.contractAddress,
        tokenType: token.ercStandard,
        tokenId: "0x00", // ISSUE #32 && ISSUE #58
        value,
        compressedZkpPublicKey: zkpKeys.compressedZkpPublicKey,
        nullifierKey: zkpKeys.nullifierKey,
        fee,
      });
      expect(result).toBe(data);
    });

    test("Should return null if client app responds with status outside the successful range", async () => {
      // Arrange
      (axios.post as jest.Mock).mockRejectedValue(
        new Error("Axios error at deposit"),
      );

      // Act
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = await client.deposit(token, zkpKeys, value, fee);

      // Assert
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe("Method getPendingDeposits", () => {
    const url = dummyUrl + "/commitment/pending-deposit";

    test("Should return object if client app responds successfully", async () => {
      // Arrange
      const data = {};
      const res = { data };
      (axios.get as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.getPendingDeposits(zkpKeys);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(url, {
        params: {
          compressedZkpPublicKey: zkpKeys.compressedZkpPublicKey,
        },
      });
      expect(result).toBe(data);
    });

    test("Should return null if client app responds with status outside the successful range", async () => {
      // Arrange
      (axios.get as jest.Mock).mockRejectedValue(
        new Error("Axios error at commitment/pending-deposit"),
      );

      // Act
      const result = await client.getPendingDeposits(zkpKeys);

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe("Method getNightfallBalances", () => {
    const url = dummyUrl + "/commitment/balance";

    test("Should return object if client app responds successfully", async () => {
      // Arrange
      const data = {};
      const res = { data };
      (axios.get as jest.Mock).mockResolvedValue(res);

      // Act
      const result = await client.getNightfallBalances(zkpKeys);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(url, {
        params: {
          compressedZkpPublicKey: zkpKeys.compressedZkpPublicKey,
        },
      });
      expect(result).toBe(data);
    });

    test("Should return null if client app responds with status outside the successful range", async () => {
      // Arrange
      (axios.get as jest.Mock).mockRejectedValue(
        new Error("Axios error at commitment/pending-deposit"),
      );

      // Act
      const result = await client.getNightfallBalances(zkpKeys);

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });
});