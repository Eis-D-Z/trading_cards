
import { constants } from "../constants";
import {  KioskTransaction } from "@mysten/kiosk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { kioskClient, findKioskWithNFT } from "./helpers";

// The price should be clear here whether it is MIST or SUI.
// Here we assume MIST, otherwise 9 more zeros should be added.
const sellerLists = async (
  id: string,
  price: string,
  seller: string,
  walletSignAndExecute
) => {
  const cap = await findKioskWithNFT(id, seller);

  if (!cap) {
    console.log("Can't find kiosk with NFT id: ", id);
  }

  const tx = new TransactionBlock();
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: cap,
  });

  kioskTx.list({
    itemType: `${constants.packageId}::trading_pack::TradingPack`,
    itemId: id,
    price: price,
  });

  kioskTx.finalize();

  return await walletSignAndExecute(tx);
};

const buyerPurchases = async (
  id: string,
  buyer: string,
  price: string,
  sellerKiosk: string,
  walletSignAndExecute
) => {
  // check if the user has a kiosk.
  const { kioskOwnerCaps: kioskCaps } = await kioskClient.getOwnedKiosks({
    address: buyer,
  });

  if (kioskCaps.length > 1) {
    // In this case there is not much we can do yet. But if you intend to save in a database or somehow index
    // this info, it is prudent to keep in mind that this scenario is possible.
    console.warn("User has more than one kiosks!!!");
  }

  const tx = new TransactionBlock();
  const kioskTx = new KioskTransaction({
    transactionBlock: tx,
    kioskClient,
    cap: kioskCaps[0],
  });
  if (kioskCaps.length === 0) {
    kioskTx.create();
  }
  await kioskTx.purchaseAndResolve({
    itemType: `${constants.packageId}::trading_pack::TradingPack`,
    itemId: id,
    price,
    sellerKiosk,
  });

  if (kioskCaps.length === 0) {
    kioskTx.shareAndTransferCap(buyer);
  }

  kioskTx.finalize();
  const response = await walletSignAndExecute(tx);
  const ret = {
    kiosk: kioskCaps[0].kioskId,
    kioskCap: kioskCaps[0],
    isNew: false,
    itemId: id,
  };

  if (kioskCaps.length === 0) {
    const created = response.effects.created;
    created.forEach((c: any) => {
      if (c.owner.Shared) ret.kiosk = c.reference.objectId;
      if (c.owner.AddressOwner) ret.kioskCap = c.reference.objectId;
    });
    ret.isNew = true;
  }

  return ret;
};
