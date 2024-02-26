import { KioskClient, KioskTransaction, Network } from "@mysten/kiosk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { client, address } from "../utils";
import { constants } from "../constants";

export const kioskClient = new KioskClient({
  client: client,
  network: constants.network as Network,
});

export const findKioskWithNFT = async (nft: string, user: string) => {
    const {kioskOwnerCaps} = await kioskClient.getOwnedKiosks({address: user});

    for (let cap of kioskOwnerCaps) {
        const kioskResponse = await kioskClient.getKiosk({
            id: cap.kioskId,
          });
          console.log("Kiosk response: ", kioskResponse);
          if (kioskResponse.itemIds.indexOf(nft) > -1)
            return cap;
    }
};