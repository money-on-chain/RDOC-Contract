# Upgrade Process for Flux Capacitor

## Description

The Flux Capacitor is a transaction doser based on a set of methods to be added in the flow to the protocol that prevent the execution of a price variation or manipulation attack.

Its operation is based on two concepts:

1. Maximum Transaction Value: involves setting a maximum transaction value for a specified number of consecutive blocks.
2. Detection of Opposite Issuance-Redemption Patterns: this concept centers around identifying and preventing patterns of consecutive opposite issuance and redemption transactions. This measure is intended to prevent the misuse of these transactions in the face of price manipulation.

### Implementation Components

*Absolute Accumulator (AA)*: this component tracks the absolute value of both minting and redeeming transactions working with the **Pseudo-Lineal Decay Factor**. Both types of transactions contribute to the cumulative value held in the AA.

*Differential Accumulator (DA)*: in contrast, the DA records the signed value of minting and redeeming transactions working with the **Pseudo-Lineal Decay Factor**. Minting transactions add to the cumulative value, while redeeming transactions subtract from it.

*Block Number of the Last Accepted Transaction (BNLAT)*: retains the block number of the most recent transaction. It's continually updated with each new transaction.

### Parameters

Absolute Maximum Transaction Allowed (AMTA): maximum limit allowed for the absolute accumulator (AA). If actual AA considering the actual amount of reserve token intend to operate reaches this limit, the transaction will revert

Maximum Operational Difference Allowed (MODA): maximum limit allowed for operational difference (OD = AA - |DA|). If actual OD considering the actual the amount of reserve token intend to operate reaches this limit, the transaction will revert

Decay Block Span (BS): is the number of blocks that have to elapse for both accumulator to be 0 again.

### Pseudo-Lineal Decay Factor

Formula to update both accumulators on each operation.

- LDF = -n/BS + 1
- AA = (AA * LDF) + amountToOperate
- DA = (DA * LDF) +/- amountToOperate (+ for mint ; - for redeem)

## Upgrade Process

Contracts to be upgraded:

- MoC.sol:
  - Because MoCExchange is not a governed contract it cannot be modified by an authorized changer, only can be upgraded. So, we added new parameters setters in MoC contract and this executes the changes on MoCExchange. That is validated on MoCExchange using the current whitelist mechanism
- MoCExchange.sol:
  - Flux capacitor functionality, variables and parameters were added here.
- Stopper.sol:
  - This contract is used to speed up the change of some parameters and not wait for a governance vote.

The changer that will execute all these upgrades in an atomic way is the following one:

- FluxCapacitorChanger.sol

### Deploy new MoC protocol implementations

- create a file named `RDOC-Contract-Internal/scripts/deploy/upgrade_v0.1.16.1/deployConfig-targetNetwork.json` with all current addresses used in the targetNetwork
- Add the parameters to assign:

    `maxAbsoluteOperation`, `maxOperationalDifference` are expressed on Reserve Token and are adjusted to 10 ** 18 on deploy time

    for example:

    ```json
    "valuesToAssign": {
        "maxAbsoluteOperation": 1000000, // 1000000 Rif
        "maxOperationalDifference": 200000, // 200000 Rif
        "decayBlockSpan": 720,
    },
    ```

- Run the upgrade.

```sh
sh ./scripts/deploy/upgrade_v0.1.16.1/0_deploy.sh targetNetwork
```

That script will do the following steps:

1. deploy MoC implementation
2. deploy MoCExchange implementation
3. deploy Stopper implementation
4. deploy FluxCapacitorChanger setting all the involved addresses
5. verify that addresses set in the changer are ok corresponding with the json file provided
