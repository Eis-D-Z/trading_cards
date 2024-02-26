import { TransactionBlock, TransactionResult } from "@mysten/sui.js/transactions";
import { constants } from "./constants";

const module = "trading_pack";
const pkg = constants.packageId;
// Mint MintCap
export const mintMintCap = (
  adminCap: string,
  receiver: string
) => {
  const tx = new TransactionBlock();

  const mintCap = tx.moveCall({
    target: `${pkg}::${module}::mint_cap`,
    arguments: [tx.object(adminCap), tx.pure.address(receiver)],
  });

  return tx;
};

export const mint1Pack = (centralObj: string, kiosk: string, cap: string, tier: number, season: string, price: string) => {
  const tx = new TransactionBlock();

  const pack = tx.moveCall({
    target: `${pkg}::${module}::mint`,
    arguments: [tx.object(cap), tx.pure.u8(tier), tx.pure.string(season)],
  });

  tx.moveCall({
    target: `${pkg}::${module}::place_and_list_to_kiosk`,
    arguments: [tx.object(cap), tx.object(centralObj), tx.object(kiosk), pack, tx.pure.u64(price)]
  });
 
  return tx;
}

export const batchMintPacks = (centralObj: string, cap: string, kiosk: string, tier: number, season: string, price: string, amount: number = 100) => {
  const tx = new TransactionBlock();

  // Here we could call mint_many_to_kiosks
  // We will implement the alternative assuming there is only the mint function avalaible and the place into kiosk.
  // As shown the best way to do it is batch the call into a single transaction.
  for (let i = 0; i < amount; i++) {
    const pack = tx.moveCall({
      target: `${pkg}::${module}::mint`,
      arguments: [tx.object(cap), tx.pure.u8(tier), tx.pure.string(season)],
    });

    tx.moveCall({
      target: `${pkg}::${module}::place_and_list_to_kiosk`,
      arguments: [tx.object(cap), tx.object(centralObj), tx.object(kiosk), pack, tx.pure.u64(price)]
    });
  }
  
  return tx;
}

// Airdroping "ammount" packs to many players
export const airdropToMany = (cap: string, tier: number, season: string, addresses: string[], amount: number = 1) => {
  // Here we have to be mindful of the transaction limits we might hit
  // So if there are too many addresses we will only send to 300 players at a time
  const txs: TransactionBlock[] = [];
  // The theoretical limit is 1024 commands per transaction block but we set it lower because we might hit
  // other limits.
  const chunkSize = Math.ceil(addresses.length * amount / 512); 
  for (let i = 0; i < addresses.length; i += chunkSize) {
  const tx = new TransactionBlock();
  const batch = addresses.slice(i, i + chunkSize);
  for (let j = 0; j < batch.length; j++) {
    const packs: TransactionResult[] = [];
    for (let k = 0; k < amount; k++) {
      const pack = tx.moveCall({
        target: `${pkg}::${module}::mint`,
        arguments: [tx.object(cap), tx.pure.u8(tier), tx.object(season)],
      });
      packs.push(pack);
    }
    
    const packVec = tx.makeMoveVec({type: `${pkg}::${module}::TradingPack`, objects: packs});

    tx.moveCall({
      target: `${pkg}::${module}::airdrop`,
      arguments: [tx.object(cap), packVec, tx.pure.address(batch[j])]
    });
    }
    txs.push(tx);
  }
  return txs;
}

// Unwrapping airdrop
export const unwrapAirdrop = (present: string, kiosk: string, kioskCap: string, policy: string) => {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${pkg}::${module}::unwrap_airdrop`,
    arguments: [tx.object(present), tx.object(kiosk), tx.object(kioskCap), tx.object(policy)]
  });
  return tx;
}

// Opening a pack. At this stage this will destroy the pack.
// In future versions it will return trading cards.
export const openPack = (central: string, pack: string, kiosk: string, kioskCap: string) => {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${pkg}::${module}::open_pack_from_kiosk`,
    arguments: [tx.object(central), tx.object(kiosk), tx.object(kioskCap), tx.pure.id(pack)]
  });
  return tx;
}
