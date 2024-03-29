import Joi, { CustomHelpers, ValidationError } from "joi";
import { NightfallSdkError } from "../utils/error";
import { TX_FEE_WEI_DEFAULT } from "./constants";
import gen from "general-number";

const { GN } = gen;

const isValidL2TokenAddress = (
  tokenContractAddress: string,
  helpers: CustomHelpers,
) => {
  const binAddress = new GN(tokenContractAddress).binary;
  const isValid =
    binAddress.charAt(0) === "1" &&
    binAddress.charAt(1) === "1" &&
    Number(binAddress.substring(61, 93)) === 0;
  if (!isValid)
    return helpers.message({
      custom: "Invalid L2TokenAddress, review Address",
    });
  return tokenContractAddress;
};

const isValidSalt = (salt: string | undefined, helpers: CustomHelpers) => {
  const isValid =
    BigInt(salt ?? "0") <
    BigInt(
      "21888242871839275222246405745257275088548364400416034343698204186575808495617",
    );
  if (!isValid)
    return helpers.message({
      custom: "Invalid salt. It should be an element of BN_128 field",
    });
  return salt;
};

const isValidTokenId = (tokenId: string | number, helpers: CustomHelpers) => {
  let isValid = typeof tokenId === "string" || typeof tokenId === "number";
  if (!isValid)
    return helpers.message({
      custom: "Invalid tokenId, should be number or string",
    });

  const tokenIdStr =
    typeof tokenId === "string" ? tokenId.trim() : tokenId.toString();
  isValid =
    BigInt(tokenIdStr) <
    BigInt(
      "21888242871839275222246405745257275088548364400416034343698204186575808495617",
    );
  if (!isValid)
    return helpers.message({
      custom: "Invalid tokenId, should be an element of BN_128 field",
    });
  return tokenIdStr;
};

// See https://joi.dev/tester/

const PATTERN_ETH_PRIVATE_KEY = /^0x[0-9a-f]{64}$/;
export const createOptions = Joi.object({
  clientApiUrl: Joi.string().trim().required(),
  clientApiTxUrl: Joi.string().trim(),
  clientApiBpUrl: Joi.string().trim(),
  blockchainWsUrl: Joi.string().trim(),
  ethereumPrivateKey: Joi.string().trim().pattern(PATTERN_ETH_PRIVATE_KEY),
  nightfallMnemonic: Joi.string().trim(),
}).with("ethereumPrivateKey", "blockchainWsUrl");

const makeTransaction = Joi.object({
  tokenContractAddress: Joi.string().trim().required(),
  value: Joi.string(),
  tokenId: Joi.string(),
  feeWei: Joi.string().default(TX_FEE_WEI_DEFAULT),
  providedCommitmentsFee: Joi.array().items(Joi.string()),
}).or("value", "tokenId"); // these cannot have default

const l2TokenisationTransaction = Joi.object({
  tokenContractAddress: Joi.string()
    .trim()
    .required()
    .custom(isValidL2TokenAddress, "custom validation"),
  tokenId: Joi.required().custom(isValidTokenId, "custom validation"),
  value: Joi.string().required(),
  feeWei: Joi.string().default(TX_FEE_WEI_DEFAULT),
});

export const makeDepositOptions = makeTransaction.append({
  salt: Joi.string().trim().custom(isValidSalt, "custom validation"),
});

export const mintL2Token = l2TokenisationTransaction.append({
  salt: Joi.string().trim().custom(isValidSalt, "custom validation"),
});

export const makeTransferOptions = makeTransaction
  .append({
    recipientNightfallAddress: Joi.string().trim().required(),
    isOffChain: Joi.boolean().default(false),
    providedCommitments: Joi.array().items(Joi.string()),
    regulatorUrl: Joi.string().trim(),
    atomicHash: Joi.string().trim(),
    atomicTimestamp: Joi.number(),
    salt: Joi.string().trim(),
  })
  .with("atomicHash", ["atomicTimestamp"]);

export const makeTransformTransferOptions = Joi.object({
  feeWei: Joi.string().default(TX_FEE_WEI_DEFAULT),
  recipientNightfallAddress: Joi.string().trim().required(),
  providedCommitments: Joi.array().items(Joi.string()),
  providedCommitmentsFee: Joi.array().items(Joi.string()),
  regulatorUrl: Joi.string().trim(),
  atomicHash: Joi.string().trim(),
  atomicTimestamp: Joi.number(),
  salt: Joi.string().trim(),
  inputTokens: Joi.array().items(
    Joi.object().custom((value, helpers) => {
      if (typeof value !== "object" || Array.isArray(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }),
  ),
  outputTokens: Joi.array().items(
    Joi.object().custom((value, helpers) => {
      if (typeof value !== "object" || Array.isArray(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }),
  ),
}).with("atomicHash", ["atomicTimestamp"]);

export const burnL2Token = makeTransaction.append({
  providedCommitments: Joi.array().items(Joi.string()),
});

export const makeWithdrawalOptions = makeTransaction.append({
  recipientEthAddress: Joi.string().trim().required(),
  isOffChain: Joi.boolean().default(false),
  providedCommitments: Joi.array().items(Joi.string()),
});

export const finaliseWithdrawalOptions = Joi.object({
  withdrawTxHashL2: Joi.string().trim().required(),
});

export const checkBalancesOptions = Joi.object({
  tokenContractAddresses: Joi.array().items(Joi.string().trim()),
});

export const transactionHashesOptions = Joi.object({
  transactionHashes: Joi.array().items(Joi.string().trim()),
});

export function isInputValid(error: ValidationError | undefined) {
  if (error !== undefined) {
    const message = error.details.map((e) => e.message).join();
    throw new NightfallSdkError(message);
  }
}
