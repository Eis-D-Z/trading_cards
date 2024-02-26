module trading_cards::trading_pack {
    use sui::coin;
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::object::{Self, UID, ID};
    use sui::package;
    use sui::sui::SUI;
    use sui::transfer;
    use sui::transfer_policy::{Self as tp, TransferPolicy, TransferPolicyCap};
    use sui::tx_context::{Self, TxContext};

    use std::string::String;
    use std::vector;

    use trading_cards::admin::AdminCap;

    // Witness
    struct TRADING_PACK has drop {}

    // shared object with transfer policys and kiosk
    struct Central has key {
        id: UID,
        kiosk_cap: KioskOwnerCap,
        empty_policy: TransferPolicy<TradingPack>,
        policy_cap: TransferPolicyCap<TradingPack>
    }

    // We want to keep the supply limited so all packs will be minted in a Kiosk by an Admin.
    struct TradingPack has key, store {
        id: UID,
        tier: u8,
        season: String        
    }

    struct Present has key {
        id: UID,
        packs: vector<TradingPack>
    }

    struct MintCap has key {
        id: UID,
    }

    #[allow(lint(share_owned))]
    fun init(witness: TRADING_PACK, ctx: &mut TxContext) {
        let publisher = package::claim(witness, ctx);

        let (kiosk, kiosk_cap) = kiosk::new(ctx);
        let (policy, policy_cap) = tp::new<TradingPack>(&publisher, ctx);
        let toShare = Central {
            id: object::new(ctx),
            kiosk_cap,
            empty_policy: policy,
            policy_cap
        };
        transfer::share_object(toShare);
        // share the kiosk as well
        transfer::public_share_object(kiosk);
        // display

        transfer::public_transfer(publisher, tx_context::sender(ctx));
    }


    // Admin-only funs
    public fun mint_cap(_: &AdminCap, recipient: address, ctx: &mut TxContext) {
        let cap = MintCap {
            id: object::new(ctx)
        };

        transfer::transfer(cap, recipient);
    }

    // MintCap owner funs

    public fun delete_mint_cap(cap: MintCap) {
        let MintCap{id} = cap;
        object::delete(id);
    }

    public fun mint(_: &MintCap, tier: u8, season: String, ctx: &mut TxContext): TradingPack {
        TradingPack {
            id: object::new(ctx),
            tier,
            season
        }
    }

    public fun place_and_list_to_kiosk(
        _: &MintCap,
        central: &mut Central,
        kiosk: &mut Kiosk,
        pack: TradingPack,
        price: u64,
        _ctx: &mut TxContext
    )
    {
        kiosk::place_and_list<TradingPack>(kiosk, &central.kiosk_cap, pack, price);
    }

    // In case we want to airdrop
    public fun airdrop(_: &MintCap, packs: vector<TradingPack>, recipient: address, ctx: &mut TxContext) {
        let present = Present {
            id: object::new(ctx),
            packs
        };

        transfer::transfer(present, recipient);
    }

    // This can be done with PTBs. We'll implement it as an example or convenience.
    // We're minting trading packs and putting them for sale
    public fun mint_many_to_kiosk(
        _: &MintCap,
        central: &mut Central,
        kiosk: &mut Kiosk,
        tier: u8,
        season: String,
        amount: u64,
        price: u64,
        ctx: &mut TxContext
    )
    {
        let counter: u64 = 0;
        while (counter < amount) {
            let pack = TradingPack {
                id: object::new(ctx),
                tier,
                season
            };
            kiosk::place_and_list<TradingPack>(kiosk, &central.kiosk_cap, pack, price);
            counter = counter + 1;
        }
    }


    // Player funs

    /// Allows to unrwap a present and puts the TradingPacks into the player's kiosk.
    public fun unwrap(present: Present, kiosk: &mut Kiosk, kiosk_cap: &KioskOwnerCap, policy: &TransferPolicy<TradingPack>) {
        let Present{id, packs} = present;
        object::delete(id);

        while(!vector::is_empty(&packs)) {
            let pack = vector::pop_back<TradingPack>(&mut packs);
            kiosk::lock(kiosk, kiosk_cap, policy, pack);
        };

        vector::destroy_empty<TradingPack>(packs);
    }

    // here we need to unlock the pack and we'll stop at destroying it, but in the full solution
    // it would re-lock the resulting cards into the kiosk
    public fun open_pack_from_kiosk(
        central: &mut Central,
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        pack_id: ID,
        ctx: &mut TxContext) 
    {
        // unlock item from kiosk
        let purchase_cap = kiosk::list_with_purchase_cap<TradingPack>(
            kiosk,
            kiosk_cap,
            pack_id,
            0, // price
            ctx
        );
        let (pack, transfer_req) = kiosk::purchase_with_cap<TradingPack>(kiosk, purchase_cap, coin::zero<SUI>(ctx));
        tp::confirm_request<TradingPack>(&central.empty_policy, transfer_req);

        // here we just burn the pack, the full solution would mint some random cards
        let TradingPack{id, tier: _, season: _} = pack;
        object::delete(id);
    }
}
