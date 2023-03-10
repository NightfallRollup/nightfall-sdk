import React, { useState, useEffect } from "react";
import { UserFactory } from "nightfall-sdk";
import "./Home.css";
import {
  makeDeposit,
  makeTransfer,
  makeWithdrawal,
  makeDepositERC721,
  makeTransferERC721,
  makeWithdrawalERC721,
  makeDepositERC1155,
  makeTransferERC1155,
  makeWithdrawalERC1155,
  checkBalances,
  createUser,
  createUserFirstTime,
} from "../Utils";

export default function User() {
  const [userAddress, setUserAddress] = useState();
  const [userNightfallAddress, setUserNightfallAddress] = useState();
  const [nightfallMnemonic, setNightfallMnemonic] = useState();
  const [nightfallBalances, setNightfallBalances] = useState(0);
  useState(null);
  const [showERC20, setShowERC20] = useState(true);
  const [showERC721, setShowERC721] = useState(null);
  const [showERC1155, setShowERC1155] = useState(null);
  const [tokenIdDeposit, setTokenIdDeposit] = useState(null);
  const [tokenIdTransfer, setTokenIdTransfer] = useState(null);
  const [tokenIdWithdrawal, setTokenIdWithdrawal] = useState(null);
  const [depositTokenValue, setDepositTokenValue] = useState(null);
  const [transferTokenValue, setTransferTokenValue] = useState(null);
  const [withdrawalTokenValue, setWithdrawalTokenValue] = useState(null);
  const clientApiUrl = process.env.CLIENT_API_URL;

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", function (accounts) {
      setUserAddress(accounts[0]);
      localStorage.setItem("userAddress", accounts[0]);
      location.reload();
    });
    useEffect(() => {}, [nightfallBalances]);

    useEffect(() => {
      const localMnemonic = localStorage.getItem("nightfallMnemonic");
      const nightfallMnemonic = process.env.NIGHTFALL_MNEMONIC;
      const mnemonic = nightfallMnemonic || localMnemonic;
      const chainId = parseInt(window.ethereum.chainId);
      localStorage.setItem("chainId", chainId);

      if (nightfallMnemonic == "" && localMnemonic == null) {
        createUserFirstTime();
      } else {
        createUser(mnemonic);
      }

      console.log(localStorage.getItem("nightfallBalances"));
      setUserNightfallAddress(localStorage.getItem("nightfallUserAddress"));
      setUserAddress(localStorage.getItem("userAddress"));
      setNightfallMnemonic(localStorage.getItem("nightfallMnemonic"));
      setNightfallBalances(localStorage.getItem("nightfallBalances"));
    }, []);
  }

  return (
    <div>
      <div className="container-md home-container">
        {window.ethereum ? (
          <div>
            <div className="ercs-section">
              <button
                className={showERC20 ? "is-clicked" : ""}
                onClick={() => {
                  setShowERC20(!showERC20);
                  setShowERC721(false);
                  setShowERC1155(false);
                }}
              >
                ERC 20
              </button>
              <button
                className={showERC721 ? "is-clicked" : ""}
                onClick={() => {
                  setShowERC721(!showERC721);
                  setShowERC20(false);
                  setShowERC1155(false);
                }}
              >
                ERC 721
              </button>
              <button
                className={showERC1155 ? "is-clicked" : ""}
                onClick={() => {
                  setShowERC20(false);
                  setShowERC721(false);
                  setShowERC1155(!showERC1155);
                }}
              >
                ERC 1155
              </button>
            </div>
            <h5 className="section">
              Nightfall address: <div>{userNightfallAddress}</div>
            </h5>

            {showERC20 && (
              <div>
                <h6 className="section">
                  Create a deposit of 0.0001 TEST Matic
                </h6>
                <button
                  className="nf-button"
                  onClick={(e) => {
                    makeDeposit(e, nightfallMnemonic);
                  }}
                >
                  {" "}
                  Deposit
                </button>
                <h6 className="section">
                  Create a transfer of 0.0001 TEST Matic
                </h6>
                <button
                  className="nf-button"
                  onClick={(e) => makeTransfer(e, nightfallMnemonic)}
                >
                  {" "}
                  Transfer
                </button>
                <h6 className="section">
                  Create a withdrawal of 0.0001 TEST Matic
                </h6>
                <button
                  className="nf-button"
                  onClick={(e) => makeWithdrawal(e, nightfallMnemonic)}
                >
                  {" "}
                  Withdrawal
                </button>
              </div>
            )}

            {/* // ERC721 */}
            {showERC721 && (
              <div>
                <h6 className="section">Create a deposit of an ERC721</h6>
                <form>
                  <div>Token ID</div>
                  <input
                    type="text"
                    value={tokenIdDeposit || ""}
                    required
                    onChange={(e) => setTokenIdDeposit(e.target.value)}
                  />
                  <div>
                    <button
                      className="nf-button"
                      onClick={(e) =>
                        makeDepositERC721(e, nightfallMnemonic, tokenIdDeposit)
                      }
                    >
                      {" "}
                      Deposit
                    </button>
                  </div>
                </form>
                <h6 className="section">Create a transfer of an ERC721</h6>
                <form>
                  <div>Token ID</div>
                  <input
                    type="text"
                    required
                    value={tokenIdTransfer || ""}
                    onChange={(e) => setTokenIdTransfer(e.target.value)}
                  />
                  <div>
                    <button
                      className="nf-button"
                      onClick={(e) =>
                        makeTransferERC721(
                          e,
                          nightfallMnemonic,
                          tokenIdTransfer,
                        )
                      }
                    >
                      {" "}
                      Transfer
                    </button>
                  </div>
                </form>
                <h6 className="section">Create a withdrawal of an ERC721</h6>
                <form>
                  <div>Token ID</div>
                  <input
                    type="text"
                    required
                    value={tokenIdWithdrawal || ""}
                    onChange={(e) => setTokenIdWithdrawal(e.target.value)}
                  />
                  <div>
                    <button
                      className="nf-button"
                      onClick={(e) =>
                        makeWithdrawalERC721(
                          e,
                          nightfallMnemonic,
                          tokenIdWithdrawal,
                        )
                      }
                    >
                      {" "}
                      Withdraw
                    </button>
                  </div>
                </form>
              </div>
            )}
            {showERC1155 && (
              <div>
                <h6 className="section">Create a deposit of an ERC1155</h6>
                <form>
                  <div>Token ID</div>
                  <input
                    type="text"
                    value={tokenIdDeposit || ""}
                    required
                    onChange={(e) => setTokenIdDeposit(e.target.value)}
                  />
                  <div>Value</div>
                  <input
                    type="text"
                    value={depositTokenValue || ""}
                    required
                    onChange={(e) => setDepositTokenValue(e.target.value)}
                  />
                  <div>
                    <button
                      className="nf-button"
                      onClick={(e) =>
                        makeDepositERC1155(
                          e,
                          nightfallMnemonic,
                          tokenIdDeposit,
                          depositTokenValue,
                        )
                      }
                    >
                      {" "}
                      Deposit
                    </button>
                  </div>
                </form>
                <h6 className="section">Create a transfer of an ERC1155</h6>
                <form>
                  <div>Token ID</div>
                  <input
                    type="text"
                    value={tokenIdTransfer || ""}
                    onChange={(e) => setTokenIdTransfer(e.target.value)}
                  />
                  <div>Value </div>
                  <input
                    type="text"
                    value={transferTokenValue || ""}
                    onChange={(e) => setTransferTokenValue(e.target.value)}
                  />
                  <div>
                    <button
                      className="nf-button"
                      onClick={(e) =>
                        makeTransferERC1155(
                          e,
                          nightfallMnemonic,
                          tokenIdTransfer,
                          transferTokenValue,
                        )
                      }
                    >
                      {" "}
                      Transfer
                    </button>
                  </div>
                </form>
                <h6 className="section">Create a withdrawal of an ERC1155</h6>
                <form>
                  <div>Token ID</div>
                  <input
                    type="text"
                    value={tokenIdWithdrawal || ""}
                    onChange={(e) => setTokenIdWithdrawal(e.target.value)}
                  />
                  <div>Value </div>
                  <input
                    type="text"
                    value={withdrawalTokenValue || ""}
                    onChange={(e) => setWithdrawalTokenValue(e.target.value)}
                  />
                  <div>
                    <button
                      className="nf-button"
                      onClick={(e) =>
                        makeWithdrawalERC1155(
                          e,
                          nightfallMnemonic,
                          tokenIdWithdrawal,
                          withdrawalTokenValue,
                        )
                      }
                    >
                      {" "}
                      Withdraw
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="section">
              Your Nightfall Balance is:{" "}
              {nightfallBalances ? nightfallBalances : "0"}
            </div>
            <button
              className="nf-button"
              onClick={async () => {
                const balance = await checkBalances(nightfallMnemonic);
                setNightfallBalances(balance);
              }}
            >
              Check Balance
            </button>
          </div>
        ) : (
          <div className="install-metamask">
            To use the app one must have metamask installed.<br></br>
            <a href="https://metamask.io/" target="_blank">
              Install Metamask
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
