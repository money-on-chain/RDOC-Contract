#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

NETWORK=$1

if [[ -z "$NETWORK" ]]; then
    NETWORK="development"
fi

echo "Using network '$NETWORK'"

SCRIPTS="
1_deploy_MoCExchange.js
2_batch_changer.js
3_verification_changer.js
4_check_deploy.js
"

for S in $SCRIPTS; do
    echo "------------------------------------------------------------"
    echo "Running: $S"
    npx truffle exec $DIR/$S --network $NETWORK
    [ $? -eq 0 ]  || exit 1
    echo "------------------------------------------------------------"
done
