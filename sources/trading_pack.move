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

    // Create kiosk along with empty policy for TradingPack and Central object.
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

    /// Allow admin to give mint privileges.s
    public fun mint_cap(_: &AdminCap, recipient: address, ctx: &mut TxContext) {
        let cap = MintCap {
            id: object::new(ctx)
        };

        transfer::transfer(cap, recipient);
    }

    // MintCap owner funs

    /// Ability to delete a MintCap.
    public fun delete_mint_cap(cap: MintCap) {
        let MintCap{id} = cap;
        object::delete(id);
    }

    /// Mint function that returns the TradingPack, just in case it is needed.
    public fun mint(_: &MintCap, tier: u8, season: String, ctx: &mut TxContext): TradingPack {
        TradingPack {
            id: object::new(ctx),
            tier,
            season
        }
    }

    /// Convenience function where we mint and put on sale directly.
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

    /// Example function on how to airdrop assets with kiosk.
    public fun airdrop(_: &MintCap, packs: vector<TradingPack>, recipient: address, ctx: &mut TxContext) {
        let present = Present {
            id: object::new(ctx),
            packs
        };

        transfer::transfer(present, recipient);
    }