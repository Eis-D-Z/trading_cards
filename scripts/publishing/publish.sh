echo "You are currently using the following env:"
sui client active-env
echo "Make sure it is correct or press ctrl+c to cancel within 3 seconds."
sleep 3
echo "Proceeding with publishing"
sui client publish --json --gas-budget 1000000000 ../../ > publish.json