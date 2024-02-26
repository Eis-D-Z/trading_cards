module trading_cards::admin {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};


    // this will be a unique object that should be in a multi-sig address
    struct AdminCap has key, store{
        id: UID
    }

    fun init(ctx: &mut TxContext) {
        let cap = AdminCap{id: object::new(ctx)};
        transfer::public_transfer(cap, tx_context::sender(ctx));
    }
}