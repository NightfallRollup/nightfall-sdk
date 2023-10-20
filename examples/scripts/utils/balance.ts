import { BalancePerTokenId } from "../../../libs/client/types";

const getBalance = async (user: any, tokenContractAddress: string) => {
  const balancesUser: Record<string, BalancePerTokenId> =
    await user.checkNightfallBalances({
      tokenContractAddresses: [tokenContractAddress],
    });
  if (Object.keys(balancesUser).length === 0) {
    return 0;
  }
  return (Object.values(balancesUser)[0] as unknown as BalancePerTokenId[])[0]
    .balance;
};

export default getBalance;
