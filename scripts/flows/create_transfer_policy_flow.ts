import { signAndExecute, address, updateConstants } from "../utils";
import { constants } from "../constants";
import {
  TransferPolicyTransaction,
  percentageToBasisPoints,
} from "@mysten/kiosk";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { kioskClient } from "./helpers";

// Admin call only once after publish. Could be added in publishPakcage.ts script.

// We create a transfer policy with 3% royalty, no minimum royalty.
const createTransferPolicy = async () => {

  const tx = new TransactionBlock();
  const tpTx = new TransferPolicyTransaction({
    kioskClient,
    transactionBlock: tx,
  });
  await tpTx.create({
    type: `${constants.packageId}::trading_pack::TradingPack`,
    publisher: constants.publisher,
  });
  tpTx
    .addLockRule()
    .addRoyaltyRule(percentageToBasisPoints(3), 0)
    .shareAndTransferCap(address);

  const response = await signAndExecute(tx);
  const created = response.effects.created;
  let policyId = "";
  let capId = "";
  created.forEach((c: any) => {
    if (c.owner.Shared)
        policyId = c.reference.objectId;
    if (c.owner.AddressOwner)
        capId = c.reference.objectId;
  });
  constants.transferPolicy = policyId;
  constants.transferPolicyCap = capId;
  updateConstants(constants);
};

createTransferPolicy();


