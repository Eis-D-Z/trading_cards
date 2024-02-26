// This will be an example of secure and insecure randmoness on Sui.

module trading_cards::trading_card{
    use sui::object::UID;

    use std::string::String;

    #[allow(unused_const)]
    const RARITIES: vector<vector<u8>> = vector[b"common", b"rare", b"epic", b"legendary"];

    // If we want the game to be on-chain we would need 
    // to store all possible card metadata in a shared object.
    #[allow(unused_field)]
    struct Card has key, store {
        id: UID,
        rarity: String
    }

}