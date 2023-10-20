import axios from "axios";
import { config } from "../appConfig";

const makeBlock = async (timeoutms?: number) => {
  if (timeoutms) await new Promise((resolve) => setTimeout(resolve, timeoutms));
  // TODO: For now, i am assuming this works only on localhost with optimist workers, not on testnet
  await axios.post(`${config.optimistApiBawUrl}/block/make-now`);
};

export default makeBlock;
