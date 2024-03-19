import { client, signAndExecute } from "../utils";
import { constants } from "../constants";
import { batchMintPacks } from "../transactions";
import { KioskClient, Network } from "@mysten/kiosk";

// This is a flow performed by the backend (eg: admin)

const season = "Prelude";
const tier = 3;
const price = "10"; // 10 SUI
const mintList100 = async () => {
  // Very important here to be clear that the contract expects price in Mist, but your frontend might have them in SUI.
  // It is a design decision where to do the conversion but consistency will save you a lot of headaches.
  const priceinMist = price + "000000000";
  const tx = batchMintPacks(
    constants.centralObj,
    constants.mintCap,
    constants.kiosk,
    tier,
    season,
    priceinMist,
    5
  );
  const response = await signAndExecute(tx);
  return response;
};

// only primary listings in our kiosk inside central.
// Price is also parsable from the kioskResponse.
// If you want the full data of the pack you would need another client.getObject call.
const getAllListedPacks = async () => {

  const kioskClient = new KioskClient({
    client,
    network: constants.network as Network,
  });

  const kioskResponse = await kioskClient.getKiosk({
    id: constants.kiosk,
    options: { withListingPrices: true, withObjects: true },
  });
  const items = kioskResponse.itemIds;
  return items;
};

getAllListedPacks().then((items) => {console.log(items)});

