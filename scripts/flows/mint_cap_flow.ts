import { address as adminAddress, signAndExecute } from "../utils";
import { constants } from "../constants";
import { mintMintCap } from "../transactions";
import { updateConstants } from "../utils";

// This is a flow performed by the backend (eg: admin)

const main = async () => {
  const tx = mintMintCap(constants.adminCap, adminAddress);
  const response = await signAndExecute(tx);
  // we update the value of the mintCap
  if (response.effects.status.status === "success") {
    const capId = response.effects.created[0].reference.objectId;
    constants.mintCap = capId;
    updateConstants(constants);
  }
};

main();
