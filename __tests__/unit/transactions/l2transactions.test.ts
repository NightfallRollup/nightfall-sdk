import {
  createTokeniseTx,
  createBurnTx,
} from "../../../libs/transactions";
import { createSignedTransaction } from "../../../libs/transactions/helpers/createSignedTx";
import { NightfallSdkError } from "../../../libs/utils/error";
import { tokeniseBurnReceipts } from "../../../__mocks__/mockTxTokeniseBurnReceipts";

jest.mock("../../../libs/transactions/helpers/createSignedTx");

describe("L2 Transactions", () => {
  const ownerZkpKeys = {};
  const l2TokenAddress =
    "0x300000000000000000000000d7b31f55b06a8fe34282aa62f250961d7afebc0a";
  const salt =
    "0x4ae258391e959abdcc53dfdd017ca2c976bf1b677dfc70b861721132dc1c10d";

  const mockedClient = {
    tokenise: jest.fn(),
    burn: jest.fn(),
  };

  describe("Tokenise", () => {
    const value = 10;
    const fee = "0";
    const tokenId = "0x00";
    const { txReceiptL2 } = tokeniseBurnReceipts;

    test("Should fail if client throws a Nightfall error", async () => {
      // Arrange
      mockedClient.tokenise.mockRejectedValue(
        new NightfallSdkError("Oops, client failed at tokenise"),
      );

      // Act, Assert
      expect(
        async () =>
          await createTokeniseTx(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ownerZkpKeys,
            mockedClient,
            l2TokenAddress,
            tokenId,
            value,
            fee,
            [],
            salt,
          ),
      ).rejects.toThrow(NightfallSdkError);
      expect(mockedClient.tokenise).toHaveBeenCalledTimes(1);
    });

    test("Should return an instance of <OffChainTransactionReceipts>", async () => {
      // Arrange
      const mockedTokeniseResData = {
        transaction: txReceiptL2,
      };
      mockedClient.tokenise.mockResolvedValue(mockedTokeniseResData);
      (createSignedTransaction as jest.Mock).mockResolvedValue(txReceiptL2);

      // Act
      const txReceipts = await createTokeniseTx(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ownerZkpKeys,
        mockedClient,
        l2TokenAddress,
        tokenId,
        value,
        fee,
        [],
        salt,
      );

      // Assert
      expect(mockedClient.tokenise).toHaveBeenCalledWith(
        ownerZkpKeys,
        l2TokenAddress,
        tokenId,
        value,
        fee,
        [],
        salt,
      );
      expect(txReceipts).toStrictEqual({ txReceiptL2 });
    });
  });

  describe("Burn", () => {
    const value = 10;
    const fee = "0";
    const tokenId = "0x00";
    const { txReceiptL2 } = tokeniseBurnReceipts;

    test("Should fail if client throws a Nightfall error", async () => {
      // Arrange
      mockedClient.burn.mockRejectedValue(
        new NightfallSdkError("Oops, client failed at burn"),
      );

      // Act, Assert
      expect(
        async () =>
          await createBurnTx(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ownerZkpKeys,
            mockedClient,
            l2TokenAddress,
            tokenId,
            value,
            fee,
          ),
      ).rejects.toThrow(NightfallSdkError);
      expect(mockedClient.burn).toHaveBeenCalledTimes(1);
    });

    test("Should return an instance of <OffChainTransactionReceipts>", async () => {
      // Arrange
      const mockedBurnResData = {
        transaction: txReceiptL2,
      };
      mockedClient.burn.mockResolvedValue(mockedBurnResData);
      (createSignedTransaction as jest.Mock).mockResolvedValue(txReceiptL2);

      // Act
      const txReceipts = await createBurnTx(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ownerZkpKeys,
        mockedClient,
        l2TokenAddress,
        tokenId,
        value,
        fee,
      );

      // Assert
      expect(mockedClient.burn).toHaveBeenCalledWith(
        ownerZkpKeys,
        l2TokenAddress,
        tokenId,
        value,
        fee,
        [],
        [],
      );
      expect(txReceipts).toStrictEqual({ txReceiptL2 });
    });
  });
});
