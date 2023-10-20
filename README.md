[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# Nightfall SDK

## What is Nightfall SDK?

Software Development Kit for interacting with Nightfall.

Clone the repo and [play with the scripts](#play-with-the-sdk-repository), or [install it as a dependency](#install-the-sdk-as-a-dependency) from NPM.

More about [Nightfall protocol](https://github.com/NightfallRollup/nightfall-docs).

## SDK core features

- Deposit ERC20,ERC721 and ERC1155 tokens from Ethereum L1 to Nightfall L2
- Transfer ERC20,ERC721 and ERC1155 token commitments on Nightfall L2
- Withdraw ERC20,ERC721 and ERC1155 token commitments from Nightfall L2 to Ethereum L1
- Mint, Transfer and Burn Nightfall native tokens exclusively on L2
- Check Nightfall L2 balances
- Export/import commitments from and to Nightfall L2

## SDK requirements (Nightfall Client)

**To use the SDK a Nightfall Client must be up and running**.

The Client is one of the key services composing Nightfall architecture. It enables interactions with the protocol via API calls, for example enables all available transactions facilitating the generation of zero-knowledge proofs.

### Set up a local Client

Run a local Client by [running the Nightfall project](https://github.com/EYBlockchain/nightfall_3#to-start-the-application). We recommend the following flags:

```bash
# From Nightfall dir root
./bin/start-nightfall -g -d
```

When running Nightfall locally, a local Proposer is also needed to produce blocks:

```bash
# From terminal, after starting Nightfall
curl -k -X POST -d "url=http://optimist" http://localhost:8081/proposer/register
# FYI this is how to require proposer to produce L2 block
curl -k -X POST http://localhost:8081/block/make-now
```

## Play with the SDK repository

Run the example scripts available by cloning this repository. Node 16 is required.

```bash
git clone git@github.com:NightfallRollup/nightfall-sdk.git
cd nightfall-sdk
nvm use && npm install
```

### Getting started

To get a good idea of how to interact with Nightfall using the SDK, we provide a set of example scripts.

**Read this section carefully to learn how to run these examples successfully**.

#### Environment setup

The SDK is a library, so it does not use environment variables (except for tests and logs). However, the example scripts require a few parameters, some of them sensitive.

As such, the scripts use a [config](./examples/scripts/appConfig.ts) object that preloads env vars from a file. We suggest to create a file per environment.

```bash
# Contents of examples/scripts/.env.ganache (based on .env.example)
LOG_LEVEL=warn

APP_CLIENT_API_URL=http://localhost:8080
APP_NIGHTFALL_MNEMONIC= # A bip39 mnemonic
APP_ETH_PRIVATE_KEY=0x4775af73d6dc84a0ae76f8726bda4b9ecf187c377229cb39e1afa7a18236a69e
APP_BLOCKCHAIN_WEBSOCKET_URL=ws://localhost:8546

# When running Nightfall in Ganache
# use `npm run utils:ganache:contract-addresses` to populate the vars below
APP_TOKEN_ERC20=0x7F68ba0dB1D62fB166758Fe5Ef10853537F8DFc5
APP_TOKEN_ERC721=0x60234EB1380175818ca2c22Fa64Eee04e174fbE2
APP_TOKEN_ERC1155=0xe28C7F9D1a79677F2C48BdcD678197bDa40b883e

APP_TX_VALUE=0.001
APP_TX_TOKEN_ID=28948022309329048855892746252171976963317496166410141009864396001978282410021
APP_TX_FEE_WEI=0
```

#### Nightfall keys

Similar to Ethereum keys, a set of zero-knowledge proof keys (zkpKeys) is required to transact in Nightfall. This can be derived from a bip39 mnemonic, which can be passed as an env var.

If no mnemonic is provided, a new mnemonic is generated upon each running of any of the scripts. This can be convenient to play with deposits, but it also means that a new Nightfall "wallet" is generated each time.

**Make sure to grab a mnemonic and update the environment variable to access funds on Nightfall**.

```js
user.getNightfallMnemonic();
```

Learn more about [Nightfall zkpKeys](https://github.com/NightfallRollup/nightfall-docs/blob/main/protocol/keys.md#keys).

#### Nightfall transactions and L2 balance

Start by making a deposit transaction, then wait until the transaction is included in an L2 block to have balance.

After depositing funds, you can perform transfers and withdrawals. Nightfall is an optimistic rollup, so after withdrawals are included in an L2 block you must wait for some "challenge period" to expire, then it is possible to "finalise the withdrawal" and move the funds back to L1. The challenge period is often 1 week, but can be configured per deployment.

Having said this, note that Nightfall supports a number of native transactions for tokenisation, ie managing assets exclusively on L2.

### Example scripts

See [scripts](/examples/scripts/).

All scripts are explained in short detail below. Run them using the given commands (present in the project package.json `scripts`).

**We strongly recommend reading the [Getting started](#getting-started) section first**.

#### User Factory

Most of the examples begin with an instantiation of the `UserFactory` class, which requires the following params:

- `clientApiUrl`: HTTP URL of a running Nightfall Client
- `blockchainWsUrl`: [optional] Websocket URL of a blockchain node - not needed when using SDK in browser
- `ethereumPrivateKey`: [optional] Ethereum (Eth) private key to sign L1 transactions - not needed when using SDK in browser
- `nightfallMnemonic`: [optional] bip39 mnemonic to derive a set of zkpKeys

**The SDK can be used in browser applications that can connect with MetaMask**. To signal this, do not provide an `ethereumPrivateKey` (in such case `blockchainWsUrl` can be ignored too).

Nightfall is a L2 protocol, but for instance deposits require to sign a L1 transaction which is why the Eth private key is required. Same happens when finalising a withdrawal, once the challenge period has expired. Other operations like transfer and withdrawal can be performed on-chain too, but this is not recommended.

Regarding zkpKeys, the same set of keys is derived from the mnemonic when instantiating `UserFactory`. But if you don't pass a mnemonic, a new one is created. Make sure to recover the mnemonic to be able to spend the associated commitments.

#### Transaction (Tx) deposit

See [txDeposit.ts](/examples/scripts/txDeposit.ts).

Learn how to:

- Create an SDK instance via `UserFactory` class
- **Retrieve an auto-generated `nightfallMnemonic`, used for L2 transactions**
- Check the liveliness of Client API and blockchain websocket
- Make a deposit
- Check deposit balances not yet included in an L2 block

:bulb: Balance on Nightfall will update as soon as funds settle, i.e. soon as an L2 block is produced.

```bash
npm run eg:[network]:deposit
```

#### Tx transfer

See [txTransfer.ts](/examples/scripts/txTransfer.ts).

Learn how to:

- Create an SDK instance via `UserFactory` class
- Make a transfer
- Check spent balances not yet included in an L2 block

:bulb: For making a transfer an already existing account in L2 with balance is required. This can be achieved by saving the mnemonic used for previous deposits and adding it to the .env file.

```bash
npm run eg:[network]:transfer
```

#### Tx withdrawal

See [txWithdrawal.ts](/examples/scripts/txWithdrawal.ts).

Learn how to:

- Create an SDK instance via `UserFactory` class
- Make a withdrawal

:bulb: For making a withdrawal an already existing account in L2 with balance is required. This can be achieved by saving the mnemonic used for previous deposits and adding it to the .env file.

```bash
npm run eg:[network]:withdrawal
```

#### Finalise withdrawal

See [txWithdrawalFinalise.ts](/examples/scripts/txWithdrawalFinalise.ts).

Learn how to create an SDK instance via `UserFactory` class and finalise a previously initiated withdrawal.

:bulb: To finalise a withdrawal, update `withdrawTxHashL2` in `txWithdrawalFinalise.ts`. Run the script after the challenge period to get the funds back to L1.

```bash
npm run eg:[network]:finalise-withdrawal
```

#### Balance in L2

See [balances.ts](/examples/scripts/balances.ts).

Learn how to create an SDK instance via `UserFactory` class and check balances in Nightfall.

```bash
npm run eg:[network]:balances
```

#### Commitments export

See [commitmentsExport.ts](/examples/scripts/commitmentsExport.ts).

Learn how to export commitments to prevent losing L2 funds.

```bash
npm run eg:[network]:export-commitments
```

#### Commitments import

See [commitmentsImport.ts](/examples/scripts/commitmentsImport.ts).

Learn how to import already exported Nightfall commitments.

:bulb: Commitments are exported to a JSON file. The same file should be used for the import. Make sure that the import was successful by checking the balance in L2.

```bash
npm run eg:[network]:import-commitments
```

#### Nightfall keys util

See [nightfallKeys.ts](/examples/scripts/utils/nightfallKeys.ts).

Following from [Nightfall keys](#nightfall-keys) above, use this script to obtain a set of zkpKeys from a given/new bip39 mnemonic.

The script returns the `nightfallMnemonic` as string, and the set of `zkpKeys` which contains:

- **rootKey**: derived from the mnemonic
- **nullifierKey**: used for spending commitments, derived from rootKey
- **zkpPrivateKey**: private key, derived from rootKey
- **zkpPublicKey**: array of public keys, derived from rootKey
- **compressedZkpPublicKey**: **a.k.a. Nightfall address**, obtained from zkpPublicKey

```bash
npm run utils:ganache:l2-keys
```

#### Other scripts

When running Nightfall in Ganache, the following Mock Tokens are deployed: ERC20Mock, ERC721Mock, ERC1155Mock. Use the script below to learn the addresses:

```bash
npm run utils:ganache:contract-addresses
```

## Install the SDK as a dependency

Add the Nightfall SDK to your project:

```bash
npm install nightfall-sdk
```

Import `UserFactory` to open an SDK instance and interact with the methods available.

```bash
import { UserFactory } from 'nightfall-sdk';
```

A part from the factory, there are a number of utils available:

- `createZkpKeys`: derive a set of zkpKeys from given/new mnemonic
- `getContractAddress`: get Nightfall contract address by name
- `NightfallSdkError`: see [error handling](#error-handling)

Refer to the [example scripts](#example-scripts) to understand how to integrate the SDK into your codebase.

## Error handling

Today we handle errors using the `NightfallSdkError` class, which is a simple implementation of the `Error` class. We might improve this in the future, but in the meantime make sure to wrap all SDK calls within a `try/catch` block.

## Need help?

If you have any questions or need some help, join the [Nightfall discord server](https://discord.com/invite/pZkC3JV2bR).
