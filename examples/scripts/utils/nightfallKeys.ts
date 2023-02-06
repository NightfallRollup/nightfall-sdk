import { createZkpKeys } from "../../../libs/utils";
import { config } from "../appConfig";

const main = async () => {
  try {
    const keys = await createZkpKeys(
      config.clientApiUrl,
      config.nightfallMnemonic, // optional
    );

    const { nightfallMnemonic, zkpKeys } = keys;
    console.log(
      ">>>>> Nightfall bip39 mnemonic - keep this private >>>>>",
      nightfallMnemonic,
    );
    console.log(">>>>> Zkp keys derived from mnemonic", zkpKeys);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    console.log("Bye bye");
  }
};

main();
