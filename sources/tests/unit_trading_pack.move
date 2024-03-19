#[test_only]
module trading_cards::unit_trading_pack {
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::object;
    use sui::package::{Publisher};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::transfer;
    use sui::transfer_policy::{Self as tp, TransferPolicy};

    use std::string;
    use std::vector;

    use trading_cards::trading_pack::{Self, Central, MintCap, Present, TradingPack};
    use trading_cards::admin::{Self, AdminCap};

    const ADMIN: address = @0xAD00;
    const MINTER: address = @0x123;
    const PLAYER: address = @0x456;

    const PackAddress: address = @0x1611edd9a9d42dbcd9ae773ffa22be0f6017b00590959dd5c767e4efcd34cd0b;

    fun create_admin_cap_and_mint_cap(scenario: &mut Scenario) {
        admin::init_for_test(ts::ctx(scenario));
        ts::next_tx(scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(scenario);
            trading_pack::mint_cap(&admin_cap, MINTER, ts::ctx(scenario));

            ts::return_to_sender(scenario, admin_cap);
        };

    }

    fun create_policy(scenario: &mut Scenario, publisher: &Publisher) {
        let (policy, policy_cap) = tp::new<TradingPack>(publisher, ts::ctx(scenario));
        transfer::public_share_object(policy);
        transfer::public_transfer(policy_cap, ADMIN);
    }



    fun mint_one(scenario: &mut Scenario, mint_cap: &MintCap): TradingPack {
       let pack = trading_pack::mint(mint_cap, 1, string::utf8(b"season 1"), ts::ctx(scenario));
       pack
    }

    #[test]
    public fun test_caps()
    {
        let scenario = ts::begin(ADMIN);
        create_admin_cap_and_mint_cap(&mut scenario);

        ts::next_tx(&mut scenario, MINTER);
        {
            let mint_cap = ts::take_from_sender<MintCap>(&scenario);
            trading_pack::delete_mint_cap(mint_cap);
        };

        ts::end(scenario);
    }

    #[test]
    public fun test_airdrop_and_open()
    {
        let scenario = ts::begin(ADMIN);
        create_admin_cap_and_mint_cap(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            trading_pack::init_for_test(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let publisher = ts::take_from_sender<Publisher>(&scenario);
            create_policy(&mut scenario, &publisher);
            ts::return_to_sender(&scenario, publisher);
        };

        ts::next_tx(&mut scenario, MINTER);
        {
            let mint_cap = ts::take_from_sender<MintCap>(&scenario);
            let pack = mint_one(&mut scenario, &mint_cap);
            // std::debug::print<TradingPack>(&pack);
            let pack_vec = vector::singleton<TradingPack>(pack);
            trading_pack::airdrop(&mint_cap, pack_vec, PLAYER, ts::ctx(&mut scenario));

            ts::return_to_sender(&scenario, mint_cap);
        };

        ts::next_tx(&mut scenario, PLAYER);
        {
            let policy = ts::take_shared<TransferPolicy<TradingPack>>(&scenario);
            let present = ts::take_from_sender<Present>(&scenario);
            let (kiosk, kiosk_cap) = kiosk::new(ts::ctx(&mut scenario));

            trading_pack::unwrap(present, &mut kiosk, &kiosk_cap, &policy);

            ts::return_shared(policy);
            transfer::public_transfer(kiosk_cap, PLAYER);
            transfer::public_transfer(kiosk, PLAYER);
        };

        // test open pack
        ts::next_tx(&mut scenario, PLAYER);
        {
            let kiosk = ts::take_from_sender<Kiosk>(&scenario);
            let kiosk_cap = ts::take_from_sender<KioskOwnerCap>(&scenario);
            let central = ts::take_shared<Central>(&scenario);
            trading_pack::open_pack_from_kiosk
                (&mut central,
                 &mut kiosk,
                 &kiosk_cap,
                 object::id_from_address(PackAddress),
                 ts::ctx(&mut scenario)
                );

            ts::return_shared(central);
            ts::return_to_sender(&scenario, kiosk);
            ts::return_to_sender(&scenario, kiosk_cap);
            
        };


        ts::end(scenario);
    }

    #[test]
    public fun test_put_for_sale() {
        let scenario = ts::begin(ADMIN);
        create_admin_cap_and_mint_cap(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            trading_pack::init_for_test(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, MINTER);
        {
            let mint_cap = ts::take_from_sender<MintCap>(&scenario);
            let our_kiosk = ts::take_shared<Kiosk>(&scenario);
            let central = ts::take_shared<Central>(&scenario);
            let pack = mint_one(&mut scenario, &mint_cap);
            trading_pack::place_and_list_to_kiosk(
                &mint_cap,
                &mut central,
                &mut our_kiosk,
                pack,
                10,
                ts::ctx(&mut scenario)
            );

            ts::return_to_sender(&scenario, mint_cap);
            ts::return_shared(central);
            ts::return_shared(our_kiosk);
        };

        ts::end(scenario);
    }

    #[test]
    public fun test_mint_and_list_many() {
        let scenario = ts::begin(ADMIN);
        create_admin_cap_and_mint_cap(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            trading_pack::init_for_test(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, MINTER);
        {
            let mint_cap = ts::take_from_sender<MintCap>(&scenario);
            let our_kiosk = ts::take_shared<Kiosk>(&scenario);
            let central = ts::take_shared<Central>(&scenario);
            trading_pack::mint_many_to_kiosk(
                &mint_cap,
                &mut central,
                &mut our_kiosk,
                1,
                string::utf8(b"season 1"),
                3,
                14,
                ts::ctx(&mut scenario)
            );

            ts::return_to_sender(&scenario, mint_cap);
            ts::return_shared(central);
            ts::return_shared(our_kiosk);
        };

        ts::end(scenario);
    }

}