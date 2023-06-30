#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

NETWORK=$1

if [[ -z "$NETWORK" ]]; then
    NETWORK="development"
fi

echo "Using network '$NETWORK'"

SCRIPTS="
1_deploy_MoC.js
2_deploy_MoCConnector.js
3_deploy_MoCExchange.js
4_deploy_MoCState.js
5_deploy_MoCSettlement.js
6_deploy_Changer.js
7_verification_Changer.js
"

for S in $SCRIPTS; do
    echo "------------------------------------------------------------"
    echo "Running: $S"
    npx truffle exec $DIR/$S --network $NETWORK
    [ $? -eq 0 ]  || exit 1
    echo "------------------------------------------------------------"
done