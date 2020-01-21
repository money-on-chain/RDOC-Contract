# Money on Chain - RRC20 Collateralized

1. [Introduction](#introduction)
1. [What doesn't change](#what-doesnt-change)
1. [What does it change](#what-does-it-change)
   1. [General naming](#general-naming)
   1. [RRC20 generic collateral](#rrc20-generic-collateral)
   1. [RRC20 payment](#rrc20-payment)
   1. [Collateral injection](#collateral-injection)
   1. [Commission splitting](#commission-splitting)
1. [Contracts](#contracts)
   1. [MoCReserve](#mocReserve)
   1. [CommissionSplitter](#commissionSplitter)
1. [Contract Mocks](#contract-mocks)
1. [Getting started](#getting-started)

# Introduction

Money On Chain - RRC20 Collateralized is a suite of smart contracts based on the project Money On Chain.

Just like MoC, the RRC20 collateralized version goal is to provide a stable-coin, a passive income hodler-targeted token, and a leveraged investment instrument. But with a big difference, it uses an RRC20 token as collateral and not RBTC.

You can learn about Money On Chain and the main mechanism that make it work in the main document [MoC.md](MoC.md)

# What doesn't change

All main Money On Chain mechanism for maintaining incentives and token stability stays the same in this project, as well as Governance features. This includes mainly:

- Minting and Redemption operations.
- Minting and Redemption limits.
- MoC Commissions.
- Interest payment.
- Buckets.
- Settlement.
- System states and liquidation process.
- Governance enabled operations.

# What does it change

Although all main functionalities maintains there are some new features and changes in this system:

- General naming.
- RRC20 generic collateral.
- RRC20 payment.
- Collateral injection.
- Commission splitting.

## General naming

As this system changes some base elements, some names used in the code lost sense and were replaced for new ones. This affects mainly token names and collateral currency references. The main changes are:

- StableToken is the stable-token and is the generic name for MoC's DOC.
- RiskPro is the hodler-targeted token and is the generic name for MoC's BitPro.
- RiskProx is the leveraged investment instrument and is the generic name for MoC's BTCX series.
- ReserveToken is the collateral token of the system and is the replacement of MoC's RBTC collateral.

## RRC20 generic collateral

What makes this project different is that it uses a RRC20 token as collateral instead of RBTC.
Any RRC20 token could be used as collateral, the only requirement for this to work is the token to be RRC20 compatible and to be deployed at the moment this contracts are deployed.
The only moment the Reserve token can be set is at deploy event. From there on, no one can change it.

## RRC20 Payment

RBTC value transfer can be made in the transaction itself as RBTC is the native RSK currency, so in the main MoC system all payment operations are made by adding the corresponding value in the transaction.
As we don't use RBTC as collateral, we neither use it as payment for minting and redemption operations, so we needed to implement a mechanism to make the RRC20 payment possible.
The main steps of the payment process are:

1. The user should give allowance to main MoC contract to spend an amount of this RRC20 tokens. This could be made with the function `approve(address spender, uint256 amount)` of the RRC20 interface using MoC contract address in the spender parameter.
2. The user make an operation to spend his Reserve token just like in main Money on Chain system.
3. The smart contracts will validate the amount of reserve token the user can spend and make the operation just like in main Money on Chain system.

**IMPORTANT:** The payment process should be used in any MoC payment operations. A direct RRC20 transfer to MoC Contract will result in the loss of the funds.

## Collateral injection

Collateral injection is the operation of adding reserveTokens to the system's reserves without minting RiskPro. This come in handy when reserves are runnning low and there is a need of Stable token minting.

This injection is made by using the function `addReserves(uint256 tokenAmount)` of MoC Contract.

Collateral injection payment should be made using the mentioned [RRC20 payment](#rrc20-payment) process.

## Commission splitting

By adding the CommissionSplitter contract and set it as the destination of Money on Chain commissions (just as a normal commission destination address), the splitting process can be made.

The CommissionSplitter contract will accummulate commissions until the `split()` function is called. At that moment a part of the commissions will be added to Money on Chain reserves using the Collateral Injection functionality and the other part will be sent to a final destination address.

# Contracts

All core Money on Chain contracts are still present in this system and two new contracts were added in order to apply the new functionalities.

## MoCReserve

This contract is the main contract for the [RRC20 generic collateral](#rrc20-generic-collateral) functionality and defines the core logic for deposit and withdraw operations using a RRC20 token. Also, takes accountability of the amount of tokens held and the amount of tokens a user can deposit.

## CommissionSplitter

The CommissionSplitter is the contract used to implement [Commission Splitting](#commission-splitting) functionality.
The contract have two main properties that can be modified by Governance:

- _commissionAddress_: Defines the final destination of the commissions after the split process takes place. Can be changed with `setCommissionAddress(address _commissionAddress)` function.
- _mocProportion_: Defines the proportion of the accumulated commissions that will be injected into MoC contract as collateral. Can be changed with `function setMocProportion(uint256 _mocProportion)`.

# Contract Mocks

Mocks are for testing purposes, most of them are inherited from main MoC system and are described [here](MoC.md#Contract-mocks). Also, we add the ReserveToken contract that is **only meant for testing purposes**. ReserveToken is an RRC20 token with whitelisting and limitless claiming functionality.

# Getting started

Running, testing and deployment process can be seen in [MoC readme](MoC.md#getting-started).

## Settings

All [MoC settings](MoC.md#settings) are maintained and the following setttings are added:

- _commissionSplitter_: Defines an address for an existing CommissionSplitter. If none is set, then the CommissionSplitter will be deployed.
- _mocCommissionProportion_: Defines the proportion of commissions that will be injected as collateral to MoC as defined in [Commission splitting](#commission-splitting). This configuration only works if no _commissiomSplitter_ address is set.
- _reserveToken_: Defines the address of the Reserve token. If no address is set, then a **ONLY-TESTING-PURPOSE** RRC20 Token will be deployed and used. This Test token should **NOT BE USED IN A PRODUCTION ENVIRONMENT**.
