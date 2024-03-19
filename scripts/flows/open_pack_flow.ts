import { constants } from "../constants";
import { findKioskWithNFT } from "./helpers";
import {client} from "../utils";
import { KioskClient, Network } from "@mysten/kiosk";
import { openPack } from "../transactions";


// User calls this function to open a pack

const openPackInKiosk = async (id: string, user: string, walletSignAndExecute) => {
    const kioskClient = new KioskClient({
        client,
        network: constants.network as Network,
    });
    const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({ address: user });
    
    const cap = await findKioskWithNFT(id, user);
    if(!cap) {
        console.log("User's kiosk do not have the pack with idL: ", id);
        return;
    }
    const tx = openPack(constants.centralObj, id, cap.kioskId, cap.objectId);
    return await walletSignAndExecute(tx);
    }