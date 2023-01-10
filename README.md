[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# Nightfall SDK

## What is Nightfall SDK?

Software Development Kit for interacting with Nightfall.

Clone the repo and [play with the scripts and the web app](#play-with-the-sdk-repository), or [install it as a dependency](#install-the-sdk-as-a-dependency) from NPM.

More about [Nightfall](https://github.com/EYBlockchain/nightfall_3/blob/master/doc/how_it_works.md).

## SDK core features

- Deposit ERC20,ERC721 and ERC1155 tokens from Ethereum L1 to Nightfall L2
- Transfer ERC20,ERC721 and ERC1155 token commitments on Nightfall L2
- Withdraw ERC20,ERC721 and ERC1155 token commitments from Nightfall L2 to Ethereum L1
- Mint, Transfer and Burn Nightfall native tokens exclusively on L2
- Check Nightfall L2 balances
- Export/import commitments from and to Nightfall L2

## SDK requirements (Nightfall Client)

To use the SDK a Nightfall Client must be up and running.

The Client is one of the key services composing Nightfall architecture. It enables interactions with the protocol via API calls, for example enables all available transactions facilitating the generation zero-knowledge proofs.

### Set up a local Client

Run a local Client by [running the Nightfall project](https://github.com/EYBlockchain/nightfall_3#to-start-the-application).

When running Nightfall locally, a local Proposer application is also needed:

```bash
# From Nightfall dir root
./bin/start-apps
```

## Play with the SDK repository

Run the example scripts available by cloning this repository. Note that Node 16 is required.

```bash
git clone git@github.com:NightfallRollup/nightfall-sdk.git
cd nightfall-sdk
nvm use && npm install
```

### Getting started

To get a good idea of how to interact with Nightfall using the SDK, we provide a set of example scripts and a React web app.

**Read this section carefully to learn how to run these examples successfully**.

#### Environment setup

The SDK is a library, so it does not use environment variables (except for tests and logs). However, the example scripts require a few parameters, some of them sensitive.

As such, the scripts will use a `config` object that preloads env vars from a file. We suggest to create a file per environments.

```bash
# Contents of examples/scripts/.env.ganache (based on .env.example)
LOG_LEVEL=info

APP_CLIENT_API_URL=http://localhost:8080
APP_NIGHTFALL_MNEMONIC= # A bip39 mnemonic
APP_ETH_PRIVATE_KEY=0x4775af73d6dc84a0ae76f8726bda4b9ecf187c377229cb39e1afa7a18236a69e
APP_BLOCKCHAIN_WEBSOCKET_URL=ws://localhost:8546

# Monitor the local deployment and double-check the contract addresses below
APP_TOKEN_ERC20=0x7F68ba0dB1D62fB166758Fe5Ef10853537F8DFc5
APP_TOKEN_ERC721=0x60234EB1380175818ca2c22Fa64Eee04e174fbE2
APP_TOKEN_ERC1155=0xe28C7F9D1a79677F2C48BdcD678197bDa40b883e

APP_TX_VALUE=0.001
APP_TX_TOKEN_ID=28948022309329048855892746252171976963317496166410141009864396001978282410021
```

#### Nightfall keys

To transact on Nightfall L2 a set of zero-knowledge keys is needed. This can be derived from a bip39 mnemonic, which can be passed as an env var.

If no mnemonic is provided, a new mnemonic is generated upon each running of any of the scripts. This can be convenient to play with deposits, but it also means that a new Nightfall "wallet" is generated each time.

**Make sure to grab a mnemonic and update the environment variable to access funds on Nightfall**.

```js
user.getNightfallMnemonic();
```

#### Nightfall transactions and L2 balance

Nightfall is an optimistic rollup. Start by making a deposit transaction, then wait until the transaction is included in an L2 block to have balance. After this, you can perform transfers and withdrawals.

Having said this, note that Nightfall supports a number of native transactions for tokenisation, ie managing assets exclusively on L2.

### Example scripts

See [scripts](/examples/scripts/).

All of the scripts are explained in short detail below. Run them using the given commands (present in the project package.json `scripts`).

**We strongly recommend reading the [Getting started](#getting-started) section first**.

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
- Check spent balances not yet included in an L2 block - TODO

:bulb: For making a transfer an already existing account in L2 with balance is required. This can be achieved by saving the mnemonic used for previous deposits and adding it to the .env file.


```bash
npm run eg:[network]:transfer
```

#### Tx withdrawal

See [txWithdrawal.ts](/examples/scripts/txWithdrawal.ts).

Learn how to:

- Create an SDK instance via `UserFactory` class
- Make a withdrawal
- Check spent balances not yet included in an L2 block - TODO

:bulb: For making a withdrawal an already existing account in L2 with balance is required. This can be achieved by saving the mnemonic used for previous deposits and adding it to the .env file.

```bash
npm run eg:[network]:withdrawal
```

#### Finalise withdrawal

See [txWithdrawalFinalise.ts](/examples/scripts/txWithdrawalFinalise.ts).

Learn how to create an SDK instance via `UserFactory` class and finalise a previously initiated withdrawal.

:bulb: To finalise a withdrawal, update `withdrawTxHashL2` in `txWithdrawalFinalise.ts`. Run the script after the cooling off period to get the funds back to L1.

```
npm run eg:[network]:finalise-withdrawal
```

#### Balance in L2

See [balances.ts](/examples/scripts/balances.ts).

Learn how to create an SDK instance via `UserFactory` class and check balances in Nightfall.

```
npm run eg:[network]:balances
```

#### Commitments export

See [commitmentsExport.ts](/examples/scripts/commitmentsExport.ts).

Learn how to export commitments to prevent losing L2 funds.

```
npm run eg:[network]:export-commitments
```

#### Commitments import

See [commitmentsImport.ts](/examples/scripts/commitmentsImport.ts).

Learn how to import already exported Nightfall commitments.

:bulb: Commitments are exported to a JSON file. The same file should be used for the import. Make sure that the import was successful by checking the balance in L2.

```
npm run eg:[network]:import-commitments
```

### Example web app

See [web app](/examples/web-app/).

This React app is an example of how to use the SDK in the browser, to interact with Nightfall via MetaMask.

**We strongly recommend reading the [Getting started](#getting-started) section first**.

#### Configure MetaMask

The app is set to work on Ganache. Set MetaMask provider to `localhost`:

| Key             | Value                 |
| --------------- | --------------------- |
| Network name    | localhost             |
| RPC URL         | http://localhost:8546 |
| Chain ID        | 1337                  |
| Currency symbol | Test                  |

Then, import a ganache account with Test token to be able to execute transactions. Use the private key given in the above [.env file](#environment-setup).

#### Start the app

Open the repository, navigate to the web-app and install the dependencies

```
cd examples/web-app
npm install
```

Navigate to the root directory and run the following script. The app is running on port 4000.

```
cd ../../
npm run eg:start-react-app
```

### Error handling

Today we are handling errors using the `NightfallSdkError` class, which is a simple implementation of the Error class. We might improve this in the future, but in the meantime make sure to wrap all SDK calls within a `try/catch` block.

## Install the SDK as a dependency

TODO

## Need help?

If you have any questions or need some help, join the [Nightfall discord server](https://discord.com/invite/pZkC3JV2bR).
