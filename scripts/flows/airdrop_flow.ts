import { client, signAndExecute } from "../utils";
import { constants } from "../constants";
import { airdropToMany, unwrapAirdrop } from "../transactions";
import { KioskClient, Network } from "@mysten/kiosk";

// Admin/backend part:
const aidrop = async (addresses: string[], amount: number = 1) => {
  const txs = airdropToMany(constants.mintCap, 3, "Prelude", addresses, amount);
  for (let tx of txs) {
    await signAndExecute(tx);
  }
};

// User part

const unwrap = async (id: string, user: string, walletSignAndExecute) => {
  const kioskClient = new KioskClient({
    client,
    network: constants.network as Network,
  });
  const {kioskIds, kioskOwnerCaps} = await kioskClient.getOwnedKiosks({address: user});
  // Here we assume that the user has only one kiosk
  // If there are more than one kiosk, we should check the contents of each kiosk
  const tx = unwrapAirdrop(id, kioskIds[0], kioskOwnerCaps[0].objectId, constants.transferPolicy);
  return await walletSignAndExecute(tx);
};
