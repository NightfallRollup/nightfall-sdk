import { Client } from "../../../libs/client";
import { createZkpKeysAndSubscribeToIncomingKeys } from "../../../libs/nightfall";

const CLIENT_API_URL = process.env.APP_CLIENT_API_URL as string;

describe("Create Zero-knowledge proof keys and subscribe to incoming keys", () => {
  let mnemonic: undefined | string;
  const client = new Client(CLIENT_API_URL);

  test("Should return a set of NightfallKeys for mnemonic undefined", async () => {
    const result = await createZkpKeysAndSubscribeToIncomingKeys(
      mnemonic,
      client,
    );
    expect(result).toHaveProperty("nightfallMnemonic");
    expect(result).toHaveProperty("zkpKeys");
  });

  test("Should return a set of NightfallKeys for valid mnemonic", async () => {
    mnemonic =
      "chef fortune soon coral laugh distance arrest summer lottery rival quarter oyster";
    const result = await createZkpKeysAndSubscribeToIncomingKeys(
      mnemonic,
      client,
    );

    const knownNightfallKeys = {
      nightfallMnemonic: mnemonic,
      zkpKeys: {
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
      },
    };
    expect(result).toStrictEqual(knownNightfallKeys);
  });

  test("Should fail if a Nightfall error is thrown", () => {
    mnemonic = "pepe";
    expect(
      async () =>
        await createZkpKeysAndSubscribeToIncomingKeys(mnemonic, client),
    ).rejects.toThrow();
  });
});
