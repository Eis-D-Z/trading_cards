module trading_cards::admin {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};


    // Only one instance of this will be created
    struct AdminCap has key, store{
        id: UID
    }

    fun init(ctx: &mut TxContext) {
        let cap = AdminCap{id: object::new(ctx)};
        transfer::public_transfer(cap, tx_context::sender(ctx));
    }

    // Allow the cap to be burned when project finishes the lifecycle.
    public fun burn(cap: AdminCap) {
        let AdminCap {id} = cap;
        object::delete(id);
    }

    #[test_only]
    public fun init_for_test(ctx: &mut TxContext) {
        init(ctx);
    }
}