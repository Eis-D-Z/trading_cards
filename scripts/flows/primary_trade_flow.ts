import { constants } from "../constants";
import { KioskTransaction } from "@mysten/kiosk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { kioskClient } from "./helpers";



// Frontend Call, the signAndExecute should be imported from a wallet.
// For testing a signAndExecute with another key can be passed.
const buyItem = async (id: string, buyer: string, walletSignAndExecute) => {

  const { kioskIds, kioskOwnerCaps: userKioskCaps } =
    await kioskClient.getOwnedKiosks({ address: buyer });
  console.log("User kiosk caps: ", userKioskCaps);

  if (userKioskCaps.length > 1) {
    // In this case there is not much we can do yet. But if you intend to save in a database or somehow index
    // this info, it is prudent to keep in mind that this scenario is possible.
    console.warn("User has more than one kiosks!!!");
  }

  const tx = new TransactionBlock();

  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: userKioskCaps[0],
  });
  if (userKioskCaps.length === 0) {
    kioskTx.create();
  }
  await kioskTx.purchaseAndResolve({
    itemType: `${constants.packageId}::trading_pack::TradingPack`,
    itemId: id,
    price: "10000000000", // this should be saved from when we listed.
    sellerKiosk: constants.kiosk,
  });

  if (userKioskCaps.length === 0) {
    kioskTx.shareAndTransferCap(buyer);
  }

  kioskTx.finalize();

  // TO CHANGE!!!! The code below is just some example.
  // Here we assume the buyer is the admin, this signAndExecute should be done through wallet on the frontend in a real scenario.
  const response = await walletSignAndExecute(tx);
  const ret = {
    kiosk: kioskIds[0],
    kioskCap: userKioskCaps[0],
    isNew: false,
    itemId: id,
  }

  if(userKioskCaps.length === 0) {
    const created = response.effects.created;
    created.forEach((c: any) => {
      if (c.owner.Shared)
        ret.kiosk = c.reference.objectId;
      if (c.owner.AddressOwner)
        ret.kioskCap = c.reference.objectId;
    });
    ret.isNew = true;
  }

  return ret;
  
  
};
