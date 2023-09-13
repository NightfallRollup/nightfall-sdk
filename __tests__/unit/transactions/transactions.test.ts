/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createDepositTx,
  createTransferTx,
  createWithdrawalTx,
  createFinaliseWithdrawalTx,
} from "../../../libs/transactions";
import { createSignedTransaction } from "../../../libs/transactions/helpers/createSignedTx";
import { NightfallSdkError } from "../../../libs/utils/error";
import { depositReceipts } from "../../../__mocks__/mockTxDepositReceipts";
import { transferReceipts } from "../../../__mocks__/mockTxTransferReceipts";
import { withdrawalReceipts } from "../../../__mocks__/mockTxWithdrawalReceipts";
import { txReceipt } from "../../../__mocks__/mockTxWithdrawalFinaliseReceipt";
import type { NightfallZkpKeys } from "../../../libs/nightfall/types";
import type Web3 from "web3";
import type { Client } from "../../../libs/client";

jest.mock("../../../libs/transactions/helpers/createSignedTx");

describe("Transactions", () => {
  const token = {};
  const ownerEthAddress = "0x0ownerEthAddress";
  const ownerEthPrivateKey = "0x0ownerEthPrivateKey";
  const ownerZkpKeys = {};
  const shieldContractAddress = "0x0shieldContractAddress";
  const web3 = {};

  const mockedClient = {
    deposit: jest.fn(),
    transfer: jest.fn(),
    withdraw: jest.fn(),
    finaliseWithdrawal: jest.fn(),
  };

  describe("Deposit", () => {
    const value = "70000000000000000";
    const fee = "10";
    const tokenId = "0x00";
    const unsignedTx =
      "0x9ae2b6be00000000000000000000000000000000000000000000000000f...";
    const { signedTxL1, txReceiptL2 } = depositReceipts;

    test("Should fail if client throws a Nightfall error", () => {
      // Arrange
      mockedClient.deposit.mockRejectedValue(
        new NightfallSdkError("Oops, client failed at deposit"),
      );

      // Act, Assert
      expect(
        async () =>
          await createDepositTx(
            token,
            ownerEthAddress,
            ownerEthPrivateKey,
            ownerZkpKeys as unknown as NightfallZkpKeys,
            shieldContractAddress,
            web3 as unknown as Web3,
            mockedClient as unknown as Client,
            value,
            tokenId,
            fee,
          ),
      ).rejects.toThrow(NightfallSdkError);
      expect(mockedClient.deposit).toHaveBeenCalledTimes(1);
    });

    test("Should return an instance of <OnChainTransactionReceipts>", async () => {
      // Arrange
      const mockedDepositResData = {
        txDataToSign: unsignedTx,
        transaction: txReceiptL2,
      };
      mockedClient.deposit.mockResolvedValue(mockedDepositResData);
      (createSignedTransaction as jest.Mock).mockResolvedValue(signedTxL1);

      // Act
      const txReceipts = await createDepositTx(
        token,
        ownerEthAddress,
        ownerEthPrivateKey,
        ownerZkpKeys as unknown as NightfallZkpKeys,
        shieldContractAddress,
        web3 as unknown as Web3,
        mockedClient as unknown as Client,
        value,
        tokenId,
        fee,
      );

      // Assert
      expect(mockedClient.deposit).toHaveBeenCalledWith(
        token,
        ownerZkpKeys,
        value,
        tokenId,
        fee,
        [],
        undefined,
      );
      expect(createSignedTransaction).toHaveBeenCalledWith(
        ownerEthAddress,
        ownerEthPrivateKey,
        shieldContractAddress,
        unsignedTx,
        web3,
      );
      expect(txReceipts).toStrictEqual({ signedTxL1, txReceiptL2 });
    });

    test("Call deposit with salt", async () => {
      // Act
      const salt = '0x12345678';
      const providedCommitmentsFee: [] = [];
      await createDepositTx(
        token,
        ownerEthAddress,
        ownerEthPrivateKey,
        ownerZkpKeys as unknown as NightfallZkpKeys,
        shieldContractAddress,
        web3 as unknown as Web3,
        mockedClient as unknown as Client,
        value,
        tokenId,
        fee,
        providedCommitmentsFee,
        salt,
      );

      // Assert
      expect(mockedClient.deposit).toHaveBeenCalledWith(
        token,
        ownerZkpKeys,
        value,
        tokenId,
        fee,
        [],
        salt,
      );
    });
  });

  describe("Transfer", () => {
    const value = "100000000000000";
    const fee = "10";
    const tokenId = "0x00";
    const recipientNightfallAddress = "0x0recipientNightfallAddress";
    const recipientNightfallData = {
      recipientCompressedZkpPublicKeys: [recipientNightfallAddress],
      values: [value],
    };
    let isOffChain = true;

    const { txReceiptL2 } = transferReceipts;

    test("Should fail if client throws a Nightfall error", () => {
      // Arrange
      mockedClient.transfer.mockRejectedValue(
        new NightfallSdkError("Oops, client failed at transfer"),
      );

      // Act, Assert
      expect(
        async () =>
          await createTransferTx(
            token,
            ownerEthAddress,
            ownerEthPrivateKey,
            ownerZkpKeys as unknown as NightfallZkpKeys,
            shieldContractAddress,
            web3 as unknown as Web3,
            mockedClient as unknown as Client,
            value,
            tokenId,
            fee,
            recipientNightfallAddress,
            isOffChain,
            []
          ),
      ).rejects.toThrow(NightfallSdkError);
      expect(mockedClient.transfer).toHaveBeenCalledTimes(1);
    });

    test("Should return an instance of <OffChainTransactionReceipt> when sending off-chain tx", async () => {
      // Arrange
      isOffChain = true;
      const mockedTransferResData = { transaction: txReceiptL2 };
      mockedClient.transfer.mockResolvedValue(mockedTransferResData);

      // Act
      const txReceipts = await createTransferTx(
        token,
        ownerEthAddress,
        ownerEthPrivateKey,
        ownerZkpKeys as unknown as NightfallZkpKeys,
        shieldContractAddress,
        web3 as unknown as Web3,
        mockedClient as unknown as Client,
        value,
        tokenId,
        fee,
        recipientNightfallAddress,
        isOffChain,
      );

      // Assert
      expect(mockedClient.transfer).toHaveBeenCalledWith(
        token,
        ownerZkpKeys,
        recipientNightfallData,
        tokenId,
        fee,
        isOffChain,
        [],
        [],
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(createSignedTransaction).not.toHaveBeenCalled();
      expect(txReceipts).toStrictEqual({ txReceiptL2 });
    });

    test("Call transfer with regulator Url", async () => {
      // Arrange
      isOffChain = true;
      const regulatorUrl = 'http://regulator';

      // Act
      await createTransferTx(
        token,
        ownerEthAddress,
        ownerEthPrivateKey,
        ownerZkpKeys as unknown as NightfallZkpKeys,
        shieldContractAddress,
        web3 as unknown as Web3,
        mockedClient as unknown as Client,
        value,
        tokenId,
        fee,
        recipientNightfallAddress,
        isOffChain,
        [],
        [],
        regulatorUrl,
      );

      // Assert
      expect(mockedClient.transfer).toHaveBeenCalledWith(
        token,
        ownerZkpKeys,
        recipientNightfallData,
        tokenId,
        fee,
        isOffChain,
        [],
        [],
        regulatorUrl,
        undefined,
        undefined,
        undefined,
      );
    });

    test("Call transfer with atomic transaction", async () => {
      // Arrange
      isOffChain = true;

      const atomicHash = '0x0123456000000000000000000000000000000000000000000000000000000111';
      const atomicTimestamp = '0x01';

      const salt = '0x251543af6a222378665a76fe38dbceae4871a070b7fdaf5c6c30cf758dc33cc0';

      // Act
      await createTransferTx(
        token,
        ownerEthAddress,
        ownerEthPrivateKey,
        ownerZkpKeys as unknown as NightfallZkpKeys,
        shieldContractAddress,
        web3 as unknown as Web3,
        mockedClient as unknown as Client,
        value,
        tokenId,
        fee,
        recipientNightfallAddress,
        isOffChain,
        [],
        [],
        undefined,
        atomicHash,
        atomicTimestamp,
        salt,
      );

      // Assert
      expect(mockedClient.transfer).toHaveBeenCalledWith(
        token,
        ownerZkpKeys,
        recipientNightfallData,
        tokenId,
        fee,
        isOffChain,
        [],
        [],
        undefined,
        atomicHash,
        atomicTimestamp,
        salt,
      );
    });    
  });

  describe("Withdrawal", () => {
    const value = "100000000000000";
    const fee = "10";
    const recipientEthAddress = "0x0recipientEthAddress";
    const tokenId = "0x00";
    // eslint-disable-next-line prefer-const
    let isOffChain = true;

    const { txReceiptL2 } = withdrawalReceipts;

    test("Should fail if client throws a Nightfall error", () => {
      // Arrange
      mockedClient.withdraw.mockRejectedValue(
        new NightfallSdkError("Oops, client failed at withdrawal"),
      );

      // Act, Assert
      expect(
        async () =>
          await createWithdrawalTx(
            token,
            ownerEthAddress,
            ownerEthPrivateKey,
            ownerZkpKeys as unknown as NightfallZkpKeys,
            shieldContractAddress,
            web3 as unknown as Web3,
            mockedClient as unknown as Client,
            value,
            tokenId,
            fee,
            recipientEthAddress,
            isOffChain,
          ),
      ).rejects.toThrow(NightfallSdkError);
      expect(mockedClient.withdraw).toHaveBeenCalledTimes(1);
    });

    test("Should return an instance of <OffChainTransactionReceipt> when sending off-chain tx", async () => {
      // Arrange
      isOffChain = true;
      const mockedWithdrawResData = { transaction: txReceiptL2 };
      mockedClient.withdraw.mockResolvedValue(mockedWithdrawResData);

      // Act
      const txReceipts = await createWithdrawalTx(
        token,
        ownerEthAddress,
        ownerEthPrivateKey,
        ownerZkpKeys as unknown as NightfallZkpKeys,
        shieldContractAddress,
        web3 as unknown as Web3,
        mockedClient as unknown as Client,
        value,
        tokenId,
        fee,
        recipientEthAddress,
        isOffChain,
      );

      // Assert
      expect(mockedClient.withdraw).toHaveBeenCalledWith(
        token,
        ownerZkpKeys,
        value,
        tokenId,
        fee,
        recipientEthAddress,
        isOffChain,
        [],
        [],
      );
      expect(createSignedTransaction).not.toHaveBeenCalled();
      expect(txReceipts).toStrictEqual({ txReceiptL2 });
    });
  });

  describe("Finalise withdrawal", () => {
    const withdrawTxHashL2 = "0x0aaabbbcd";

    const unsignedTx =
      "0xa334229a00000000000000000000000000000000000000000000000000000...";

    test("Should fail if client throws a Nightfall error", () => {
      // Arrange
      mockedClient.finaliseWithdrawal.mockRejectedValue(
        new NightfallSdkError("Oops, client failed at finalise-withdrawal"),
      );

      // Act, Assert
      expect(
        async () =>
          await createFinaliseWithdrawalTx(
            ownerEthAddress,
            ownerEthPrivateKey,
            shieldContractAddress,
            web3 as unknown as Web3,
            mockedClient as unknown as Client,
            withdrawTxHashL2,
          ),
      ).rejects.toThrow(NightfallSdkError);
      expect(mockedClient.finaliseWithdrawal).toHaveBeenCalledTimes(1);
    });

    test("Should return an instance of <TransactionReceipt>", async () => {
      // Arrange
      const mockedFinaliseWithdrawalResData = { txDataToSign: unsignedTx };
      mockedClient.finaliseWithdrawal.mockResolvedValue(
        mockedFinaliseWithdrawalResData,
      );
      (createSignedTransaction as jest.Mock).mockResolvedValue(txReceipt);

      // Act
      const result = await createFinaliseWithdrawalTx(
        ownerEthAddress,
        ownerEthPrivateKey,
        shieldContractAddress,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        web3,
        mockedClient,
        withdrawTxHashL2,
      );

      // Assert
      expect(mockedClient.finaliseWithdrawal).toHaveBeenCalledWith(
        withdrawTxHashL2,
      );
      expect(createSignedTransaction).toHaveBeenCalledWith(
        ownerEthAddress,
        ownerEthPrivateKey,
        shieldContractAddress,
        unsignedTx,
        web3,
      );
      expect(result.signedTxL1).toStrictEqual(txReceipt);
    });
  });
});
