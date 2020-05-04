# Integration to Money on Chain Platform

1.  [Introduction to MoC](#introduction-to-moc)
    1.  [The Moc Contract](#the-moc-contract)
    1.  [MoC State Contracts](#the-moc-state-contract)
1.  [Getting RIFPros](#getting-rifpros)
    1.  [Minting RIFPros](#minting-rifpros)
    1.  [Redeeming RIFPros](#redeeming-rifpros)
1.  [Getting RDOCs](#getting-rdocs)
    1.  [Minting RDOCs](#minting-rdocs)
    1.  [Redeeming RDOCs](#redeeming-rdocs)
1.  [Getting RIF2X](#getting-rif2x)
    1.  [Minting RIF2X](#minting-rif2x)
    1.  [Redeeming RIF2X](#redeeming-rif2x)
1.  [From outside the blockchain](#from-outside-of-the-blockchain)
    1.  [Using RSK nodes](#using-rsk-nodes)
    1.  [Using web3](#using-web3)
    1.  [Official Money on Chain ABIS](#official-money-on-chain-abis)
    1.  [Events](#events)
    1.  [Example code minting RIFPros](#example-code-minting-rifpros)
    1.  [Example code redeeming RIFPros](#example-code-redeeming-rifpros)
    1.  [Example code minting RDOCS](#example-code-minting-rdocs)
    1.  [Example code redeeming RDOCS](#example-code-redeeming-rdocs)
    1.  [Example code redeeming free RDOCS](#example-code-redeeming-free-rdocs)
    1.  [Example code redeeming all RDOCS](#example-code-redeeming-all-rdocs)
    1.  [Example code minting RIF2X](#example-code-minting-rif2x)
    1.  [Example code redeeming RIF2X](#example-code-redeeming-rif2x)

# Introduction to MoC

Money On Chain is a suite of smart contracts whose purpose is providing:

- A RIF-collateralized stable-coin, Dollar On Chain, (RDOC)
- A passive income hodler-targeted token, RIFPro (RIFP)
- A leveraged Bitcoin investment instrument (RIFX series).

Money on Chain runs on the [RSK network](https://www.rsk.co/) and uses the RIF token as reserve assets to back Money on Chain. You can find more info on the RIF token and decentralized economies [here](https://www.rifos.org/).

The rationale behind this is that deposits of RIF help collateralize the RDOCs, RIFPro absorbs the USD-RIF rate fluctuations, and RIF2X is leveraged borrowing value from RIFPro and RDOC holders, with a daily interest rate being paid to the former.

MoC system is a network of cooperative smart contracts working together to ultimately provide a US dollar pegged ERC20 Token (RDOC). In this sense, the contracts we can categorize them into 4 categories:

- _MoC state Contracts_: They keep MoC state variables and logic (MoC, MoCState, MoCBucketContainer, MoCSettlement, MoCBurnout)
- _MoC pure logic Contracts & Libraries_: Functional extensions of the above merely to have responsibility separation and contracts size (aka deploy fee) low. (MoCHelperLib, MoCLibConnection, MoCConverter, MoCExchange, MoCConnector, MoCBProxManager, MoCInrate, MoCWhitelist, MoCBase)
- _Tokens_: Tokens backed by the system (OwnerBurnableToken, StableToken, RiskProToken)
- _External Dependencies_: External contracts the system relies on, in this case the Oracle or price provider; this could evolve independently of MoC system as along as the interface is maintained. (PriceProvider)

Also you can read official information about [MoC architecture and Money on Chain's smart contracts](https://github.com/money-on-chain/RDOC-Contract/blob/master/MoC.md)

## The Moc Contract

The Money On Chain's Smart Contract suite is in control of the minting and redeeming of its tokens, including the RIFPro, RDOC and RIF2X tokens. This means that the generation of new tokens is controlled programmatically by said suite. To get some new tokens you should interact with the suite. The entry point is the MoC smart contract whose addresses are available on the following networks:

- mainnet: [ ADDRESS_MAINNET ](https://explorer.rsk.co/address/ADDRESS_MAINNET)
- testnet: [ ADDRESS_TESTNET ](https://explorer.testnet.rsk.co/address/ADDRESS_TESTNET)

In the world of second and third generation blockchains it is not possible to update the code of an already deployed smart contract. If we need to fix a bug or update the logic of a function, then we can use the proxy architecture pattern.

The proxy pattern allows all function calls to go through a Proxy contract that will redirect the message to another smart contract that contains the business logic. MoC is a Proxy Contract.

When the logic needs to be updated, a new version of your business logic contract is created and the reference is updated in the proxy contract. You can read more about proxies contracts [here](https://blog.openzeppelin.com/proxy-patterns/).

### MoC precisions

The Money on Chain system handles different types of currency precision to operate with tokens and RIF. The **MoCLibConnection** contract defines 2 variables that are used across the platform:

- _mocPrecision_: Currently RDOC, BROS and RIF2X tokens use 18 decimal places of precision.
- _reservePrecision_: Currently RIF amounts use 18 decimal places of precision.

### MoC State Contracts

#### MocInrate

Deals with interest payments on leverage deposits and defines the interest rates to trade with RDOC and RIF2X. Also with the commission rates to operate on the Money on Chain platform.

- mainnet: [ MOC_INRATE_MAINNET_ADDRESS ](https://explorer.rsk.co/address/MOC_INRATE_MAINNET_ADDRESS)
- testnet: [ MOC_INRATE_TESTNET_ADDRESS ](https://explorer.testnet.rsk.co/address/MOC_INRATE_TESTNET_ADDRESS)

#### MocState

This contract holds the system variables to manage the state, whether it's the state itself or the liquidation thresholds, as well as many `view` functions to access and evaluate it.

- mainnet: [ MOC_STATE_MAINNET_ADDRESS ](https://explorer.rsk.co/address/MOC_STATE_MAINNET_ADDRESS)
- testnet: [ MOC_STATE_TESTNET_ADDRESS ](https://explorer.testnet.rsk.co/address/MOC_STATE_TESTNET_ADDRESS)

# Getting RIFPros

In this tutorial we will show you how to get RIFPro tokens.

The RIFPro, as you may already know, is an _ERC20_ token.(If you didn't, and you don't know what is exactly an _ERC20_ token [here](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) is a full explanation of it).
​
This means that most wallets like Nifty and MetaMask can handle them if you tell them to ([MetaMask tutorial on how to do it](https://metamask.zendesk.com/hc/en-us/articles/360015489031-How-to-View-Your-Tokens), Nifty is very similar to it so you should follow that link too if you are using the latter).
​
That RIFPro is an _ERC20_ Token also means that any user that has already some tokens can trade them to you in exchange for a service or for another token.
​
But in some circumstances you may not find such a user. In those cases, you may be happy to know that you can create them(or mint them, as it is usually said) using the Smart Contracts.
​
​## Minting RIFPros

In this tutorial the method(or function) that is of interest to us is `function mintRiskPro(uint256 resTokensToMint) public`.

You must approve the amount of RIF token that you are willing to use on the Money on Chain platform before minting RIFPro. The approved amount is called **allowedBalance**. You can do this by invoking `function approve(address _spender, uint256 _value) public returns (bool success)` that is part of the [ERC20 standard](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md).

### Parameters of the operation

#### The resTokensToMint parameter

It is the amount the contract will use to actually mint RIFPros, i.e. it will not be used to pay commission, all of this funds will be transformed purely on RIFPros.
This parameter is a RIF amount and uses a precision of the type **reservePrecision** that contains 18 decimal places is defined in **MoCLibConnection** contract.

Maybe, depending on the state of the contract, a value lesser than resTokensToMint will be used to mint the RIFPros. In that case, all the extra RIFs will be sent to you.

You have to take into consideration that it will be split in three.

- The first part will be used to mint some RIFPro, the size of this part depends directly on the resTokensToMint, and, as explained in the previous section, it may be smaller than resTokensToMint.
- The second part will be used to pay the commission, this part is a percentage of the previous part. The exact percentage of it is set in the variable **commissionRate** of the **MocInrate** contract. The current value is 0.002 and can be consulted through the method `commissionRate()​` as this parameter is public(Note that this parameter when consulted through said method has also a precision of 18 decimals, i.e. a 2 \* 10^15 in that parameter means that 0.2% is being charged as a commission).
- The third part is always returned, so if you have doubts of how much you should send, keep in mind that if you send too much RIFs we will return everything that it is not used for commissions or minting.
  In conclusion the amount sent has to be at least the resTokensToMint plus the commission, the commission being resTokensToMint times the commission rate.

```
allowedBalance (RIF Token) >= resTokensToMint + resTokensToMint * commissionRate
```

#### Gas limit and gas price

This two values are a parameter of the transaction, this is not used in the contract and it is usually managed by your wallet(you should read about them if you are developing and you don't know exactly what are they) but you should take them into account when trying to send all of your funds to mint some RIFPros.

### Possible failures

This operation may fail if one of the following scenarios occurs:

#### The MoC contract is liquidated:

In the extraneous case where a coverage that barely covers the stable tokens funds is reached, the contract will liquidate all of its assets. If this state occurs, no more RIFPros will be available for minting.
To know if the contract is liquidated you can ask the **MocState** for the **state**, this will return a 0 if liquidated(it is actually an enum).

#### The MoC contract is paused:

If the system suffers some type of attack, the contract can be paused so that operations cannot be done and the risk of the users losing their funds with the operation can be minimized. You can get more information about stoppables contracts [here](https://github.com/money-on-chain/Areopagus-Governance/blob/develop/contracts/Stopper/Stoppable.sol)
In that state, the contract doesn't allow minting any type of token.

To know if this is the case you can ask to **MoC** if it's **paused()**.

#### You allowed too few funds:

If the RIF funds you allowed doesn't cover the amount you specified on resTokensToMint.

If this is the case the transaction will revert, all your funds will be returned (except the fee paid to the network). The error message will be "amount is not enough".

#### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert(again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.

### How-to

In the following sections we will give some code on how this can be done through a Smart Contract or directly, with a console or with an app.
​

#### Smart Contract​

​
To create a new Smart Contract that uses the Money On Chain platform, you can use any language and IDE you want. In this tutorial, we will show you how to do it using [Solidity language](https://solidity.readthedocs.io/en/v0.5.8/), [Truffle Framework](https://www.trufflesuite.com/) and [NPM](https://www.npmjs.com/).
Truffle framework offers some template projects that you can use to develop applications that use smart contracts. You can get more information [here](https://www.trufflesuite.com/boxes).
Assuming you already have your project up and running (if you don't, please follow [this link](https://github.com/money-on-chain/main-RIF-contract/blob/master/README.md)) the only extra thing you need to do is to install our repo as a dependency in your NPM project. In order you need to do this you just need to run the following command.
​

```
npm install --save -E git+https://git@github.com/money-on-chain/main-RIF-contract.git
```

​
Having done that lets you use our contract as a dependency to your contract. For this let's suppose you are doing some kind of contract that when executing a certain task charges a fixed commission. Now let's suppose that the commission is sent in RIFs because it is easier for the user but actually you want some RIFPros. The good news is that you can do this instantly just by minting them. The code necessary to do this is actually pretty simple.
​
You just have to import the contract
​

```js
import 'money-on-chain/contracts/MoC.sol';
import 'money-on-chain/contracts/MoCInrate.sol';
```

Receive the address in the constructor in order to be able to interact with it later

```js
constructor (MoC _mocContract, MoCInrate _mocInrateContract, rest of your params...) {
//....rest of your constructor....
}
​
```

​and, finally, when you receive a commission, exchange it for some RIFPros
​

```js
uint256 resTokensToMint = 100000000;
if (resTokensToMint <= moc.getAllowance(msg.sender)){
    uint256 commissionOfMoC = mocInrate.calcCommissionValue(msg.value);
    moc.mintRiskPro(resTokensToMint-commissionOfMoC);
}
```

​
You can send it immediately to you so you can start using it right away. In order to do this you should add a few more lines similar to the ones before, only that you will have to use the RIFPro token.
​
This will leave you with a contract similar to the following
​
​

```js
pragma solidity 0.5.8;
​
import "money-on-chain/contracts/MoC.sol";
import "money-on-chain/contracts/MoCInrate.sol";
import "money-on-chain/contracts/token/RiskProToken.sol";
// Here you will import your own dependencies
​
contract YourMintingRiskProContract {
    // Address of the MoC contract
    MoC public moc;
    // Address of the MocInrate contract
    MoCInrate public mocInrate;
    // Address of the RIFPro token
    RiskProToken public riskPro;
    // Address that will receive all the commissions
    address public receiverAddress;
    // rest of your variables
​
    constructor (MoC _moc, MoCInrate _mocInrate, RiskProToken _riskPro, address _receiverAddress) public {
        moc = _moc;
        mocInrate = _mocInrate;
        riskPro = _riskPro;
        receiverAddress = _receiverAddress;
        // You could have more variables to initialize here
    }
​
    function doTask(uint256 _resTokensToMint) public {
        //We compute the commision.
​        uint256 commission = mocInrate.calcCommissionValue(_resTokensToMint);
        //We compute the resTokensToMint.
        uint256 resTokensToMint = _resTokensToMint - commission;
        // Mint some new RIFPro
        moc.mintRiskPro(_resTokensToMint);
​        // Transfer it to your receiver account
        riskPro.transfer(receiverAddress, riskPro.balanceOf(address(this)));
        // Rest of the function to actually perform the task
    }
    // rest of your contract
}
​
​
```

And that is it, the only thing left to do is to add in the [truffle migrations](https://www.trufflesuite.com/docs/truffle/getting-started/running-migrations) scripts the address to MoC and BPro when deploying YourContract and you are done.
​​

## Redeeming RIFPros

The Money On Chain's Smart Contract suite is in control of the redeeming of its tokens, including the RIFPro token. This means that the return of RIFPros is controlled programmatically by said suite. ​A user can "sell" their RIFPro back to the contract and recover the corresponding amount of RIF.

This means that to redeem RIFPros you must interact with the suite. The entry point are the same as explained in [Minting RIFPros](#minting-rifpros).

In this tutorial the method(or function) that is of interest to us is `function redeemRiskPro(uint256 riskProAmount) public`.

### Parameters of the operation

#### The riskProAmount parameter

It is the amount that the contract will use to redeem RIFPros and to calculate commissions. All of these funds will be transformed exclusively into RIF.
This parameter uses a precision of the type **reservePrecision** that contains 18 decimal places and is defined in **MoCLibConnection** contract.
Money on Chain is a dynamic system that allows you to redeem a maximum amount of RIFPros and can be obtained by calling the `absoluteMaxRiskPro()` view of the **MocState** contract.

The redeeming process is divided into 3 parts:
The first part transforms the amount **riskProAmount** into an RIF amount, but 3 things can happen:

- The amount entered in riskProAmount must not exceed the user's balance in RIFPros. If this occurs then the user’s balance will be used to calculate the value in RIF.

```
userBalance = riskProToken.balanceOf(user);
userAmount  = Math.min(riskProAmount, userBalance);

```

- The userAmount must not exceed the absolute maximum amount of RIFPros. If this occurs then absoluteMaxRiskPro will be used to transform it to RIF.

```
riskProFinalAmount = Math.min(userAmount, absoluteMaxRiskPro);
```

The second part will be used to pay the commission, this part is a percentage of the previous part. The exact percentage is established in the variable **commissionRate** of the contract **MocInrate**. The current value is 0.002 and can be queried through the `getCommissionRate()` function since this parameter is public (note that this parameter when queried through that method also has an accuracy of 18 decimal places, that is, a 2 \ \* 10 ^ 15 in that parameter means that 0.2% is charged as commission).

The third part returns the amount in RIF discounting the previously calculated commissions.

```
totalRif = riskProToResToken(riskProFinalAmount);
rifReceived = totalRif - totalRif * commissionRate
```

#### Gas limit and gas price

These two values are a parameter of the transaction, this is not used in the contract and is generally managed by your wallet (you should read about them if you are developing and do not know exactly what they are), but you should take them into account when trying to redeem some RIFPros.

### Possible failures

This operation may fail if one of the following scenarios occurs:

#### The contract is liquidated:

In the extraneous case where a coverage that barely covers the stable tokens funds is reached, the contract will liquidate all of its assets. If this state occurs, no more RIFPros will be available for redeeming. The condition is the same as that explained in [The MoC contract is liquidated](#the-MoC-contract-is-liquidated).

#### The contract is paused:

If the system suffers some type of attack, the contract can be paused so that operations cannot be done and the risk of the users losing their funds with the operation can be minimized. The condition is the same as that explained in [The MoC contract is paused](#the-MoC-contract-is-paused).

#### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert(again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.

### How-to

In the following sections we will give some code on how this can be done through a Smart Contract or directly, with a console or with an app.
​

#### Smart Contract​

​
To create a new Smart Contract that uses the Money On Chain platform, you can use any language and IDE you want. In this tutorial, we will show you how to do it using [Solidity language](https://solidity.readthedocs.io/en/v0.5.8/), [Truffle Framework](https://www.trufflesuite.com/) and [NPM](https://www.npmjs.com/).
Truffle framework offers some template projects that you can use to develop applications that use smart contracts. You can get more information [here](https://www.trufflesuite.com/boxes).
Assuming you already have your project up and running (if you don't, please follow [this link](https://github.com/money-on-chain/main-RIF-contract/blob/master/README.md)) the only extra thing you need to do is to install our repo as a dependency in your NPM project. In order you need to do this you just need to run the following command.
​

```
npm install --save -E git+https://git@github.com/money-on-chain/main-RIF-contract.git
```

Having done that lets you use our contract as a dependency to your contract. For this let's suppose you are doing some kind of contract that when executing a certain task charges a fixed commission. Now let's suppose that the commission is sent in RIFs because it is easier for the user but actually you want some RIFPros. The good news is that you can do this instantly just by minting them. The code necessary to do this is actually pretty simple.
​
You just have to import the contract
​

```js
import 'money-on-chain/contracts/MoC.sol';
```

Receive the address in the constructor in order to be able to interact with it later

```js
constructor (MoC _mocContract, MoCInrate _mocInrateContract, rest of your params...) {
//....rest of your constructor....
}
​
```

```js
uint256 riskProAmount = 9000000;
moc.redeemRiskPro(riskProAmount);
```

​
You can send it immediately to you so you can start using it right away. In order to do this you should add a few more lines similar to the ones before, only that you will have to use the RIFPro token.
​
This will leave you with a contract similar to the following

```js
import 'money-on-chain/contracts/MoC.sol';
import 'money-on-chain/contracts/MoCInrate.sol';
```

Receive the address in the constructor in order to be able to interact with it later

```js
constructor (MoC _mocContract, MoCInrate _mocInrateContract, rest of your params...) {
//....rest of your constructor....
}
​
```

You can send it immediately to you so you can start using it right away. In order to do this you should add a few more lines similar to the ones before, only that you will have to use the RIFPro token.
​
This will leave you with a contract similar to the following
​​

```js
pragma solidity 0.5.8;
​
import "money-on-chain/contracts/MoC.sol";
import "money-on-chain/contracts/token/RiskProToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
// Here you will import your own dependencies

contract YourRedeemingRiskProContract {
    // Address of the MoC contract
    MoC public moc;
    // Address of the RIFPro token
    RiskProToken public riskPro;
    // Address of the RIF token
    IERC20 public rif;
    // rest of your variables
​
    constructor (MoC _moc, RiskProToken _riskPro, IERC20 _rif) public {
        moc = _moc;
        riskPro = _riskPro;
        rif = _rif;
        // You could have more variables to initialize here
    }
​
    function doTask(uint256 _riskProAmount) public {
        uint256 previousBalance = bpro.balanceOf(msg.sender);
        uint256 previousRifBalance = rif.balanceOf(msg.sender);
        moc.redeemRiskPro(_riskProAmount);
        uint256 newBalance = bpro.balanceOf(msg.sender);
        uint256 newRifBalance = rif.balanceOf(msg.sender);
    }
    // rest of your contract
}​
​
```

And that is it, the only thing left to do is to add in the [truffle migrations](https://www.trufflesuite.com/docs/truffle/getting-started/running-migrations) scripts the address to MoC and BPro when deploying YourContract and you are done.
​​

# Getting RDOCs

A RDOC, RIF Dollar On Chain, is a RIF-collateralized stable-coin. Its value is pegged to one dollar.

That RDOC is an _ERC20_ Token means that any user that has already some tokens can trade them to you in exchange for a service or for another token. You can find specific information about ERC-20 tokens [here](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md).

## Minting RDOCs

RDOC can only be minted in exchange for RIF. Given an amount of RIF paid to the contract, the system calculates the corresponding RDOCs amount to mint, RIF and RDOC balances are added to the Money on Chain system and the new tokens are sent to the user.

In this tutorial the method(or function) that is of interest to us is `function mintStableToken(uint256 resTokensToMint) public` .

You must approve the amount of RIF token that you are willing to use on the Money on Chain platform before minting RDOC. The approved amount is called **allowedBalance**. You can do this by invoking `function approve(address _spender, uint256 _value) public returns (bool success)` that is part of the [ERC20 standard](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md).

### Parameters of the operation

#### The resTokensToMint parameter

It is the amount the contract will use to actually mint RDOCs, i.e. it will not be used to pay commission, all of this funds will be transformed purely on RDOCs.
This parameter uses a precision of the type **reservePrecision** that contains 18 decimal places and is defined in **MoCLibConnection** contract.
It could be the case, depending on the state of the contract, that a value less than resTokensToMint will be used to mint the RDOCs. In that case, all the extra RIFs will be sent to you.

The redeem process is split in three parts.

- The first part will be used to mint some RDOC, the size of this part depends directly on the **resTokensToMint**. For security reasons, the system allows to mint a maximum amount of RDOCs that can be obtained by invoking the `absoluteMaxDoc()` function of the **MoCState** contract.
- The second part will be used to pay the commission, this part is a percentage of the previous part. The exact percentage of it is set in the variable **commissionRate** of the **MocInrate** contract. The current value is 0.002 and can be consulted through the method `commissionRate()​` as this parameter is public(Note that this parameter when consulted through said method has also a precision of 18 decimals, i.e. a 2 \* 10^15 in that parameter means that 0.2% is being charged as a commission).
- The third part is always returned, so if you have doubts of how much you should send, keep in mind that if you send too much RIFs we will return everything that is not used for commissions or minting.
  In conclusion the amount sent has to be at least the resTokensToMint plus the commission, the commission being resTokensToMint times the commission rate.

```
allowedBalance (RIF Token) >= resTokensToMint + resTokensToMint * commissionRate
```

#### Gas limit and gas price

This two values are a parameter of the transaction, which are not used in the contract and are usually managed by your wallet(you should read about them if you are developing and you don't know exactly what are they), but you should take them into account when trying to send all of your funds to mint some RDOCs.

### Possible failures

This operation may fail if one of the following scenarios occurs:

#### The MoC contract is liquidated:

In the extraneous case where a coverage that barely covers the stable tokens funds is reached, the contract will liquidate all of its assets. If this state occurs, no more RDOCs will be available for minting.
To know if the contract is liquidated you can ask the **MocState** for the **state**, this will return a 0 if liquidated(it is actually an enum).

#### The MoC contract is paused:

If the system suffers some type of attack, the contract can be paused so that operations cannot be done and the risk of the users losing their funds with the operation can be minimized. You can get more information about stoppables contracts [here](https://github.com/money-on-chain/Areopagus-Governance/blob/develop/contracts/Stopper/Stoppable.sol)
In that state, the contract doesn't allow minting any type of token.

To know if this is the case you can ask to **MoC** if it's **paused()**.

#### You allowed too few funds:

If the RIF funds you allowed doesn't cover the amount you specified on resTokensToMint.

If this is the case the transaction will revert, all your funds will be returned (except the fee paid to the network). The error message will be "amount is not enough".

#### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert(again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.

### How-to

In the following sections we will give some code on how this can be done through a Smart Contract or directly, with a console or with an app.
​

#### Smart Contract​

​
To create a new Smart Contract that uses the Money On Chain platform, you can use any language and IDE you want. In this tutorial, we will show you how to do it using [Solidity language](https://solidity.readthedocs.io/en/v0.5.8/), [Truffle Framework](https://www.trufflesuite.com/) and [NPM](https://www.npmjs.com/).
Truffle framework offers some template projects that you can use to develop applications that use smart contracts. You can get more information [here](https://www.trufflesuite.com/boxes).
Assuming you already have your project up and running (if you don't, please follow [this link](https://github.com/money-on-chain/main-RIF-contract/blob/master/README.md)) the only extra thing you need to do is to install our repo as a dependency in your NPM project. In order you need to do this you just need to run the following command.
​

```
npm install --save -E git+https://git@github.com/money-on-chain/main-RIF-contract.git
```

Having done that lets you use our contract as a dependency to your contract. For this let's suppose you are doing some kind of contract that when executing a certain task charges a fixed commission. Now let's suppose that the commission is sent in RIFs because it is easier for the user but actually you want some RDOCs. The good news is that you can do this instantly just by minting them. The code necessary to do this is actually pretty simple.
​
You just have to import the contract
​

```js
import 'money-on-chain/contracts/MoC.sol';
import 'money-on-chain/contracts/MoCInrate.sol';
```

Receive the address in the constructor in order to be able to interact with it later

```js
constructor (MoC _mocContract, MoCInrate _mocInrateContract, rest of your params...) {
//....rest of your constructor....
}
​
```

​and, finally, when you receive a commission, exchange it for some RIFPros
​

```js
uint256 resTokenToMint = 100000;
if (resTokenToMint > moc.getAllowance(msg.sender)){
    resTokenToMint = moc.getAllowance(msg.sender);
}
uint256 commissionOfMoC = mocInrate.calcCommissionValue(resTokenToMint);
moc.mintStableToken(resTokenToMint-commissionOfMoC);
```

​
You can send it immediately to you so you can start using it right away. In order to do this you should add a few more lines similar to the ones before, only that you will have to use the RDOC token.
​
This will leave you with a contract similar to the following
​
​

```js
pragma solidity 0.5.8;
​
import "money-on-chain/contracts/MoC.sol";
import "money-on-chain/contracts/MoCInrate.sol";
import "money-on-chain/contracts/token/StableToken.sol";
// Here you will import your own dependencies
​
contract YourMintingRDocContract {
    // Address of the MoC contract
    MoC public moc;
    // Address of the MocInrate contract
    MoCInrate public mocInrate;
    // Address of the doc token
    StableToken public doc;
    // Address that will receive all the commissions
    address public receiverAddress;
    // rest of your variables
​
    constructor (MoC _moc, MoCInrate _mocInrate, StableToken _doc_, address _receiverAddress) public {
        moc = _moc;
        mocInrate = _mocInrate;
        doc = _doc;
        receiverAddress = _receiverAddress;
        // You could have more variables to initialize here
    }
​
    function doTask(uint256 _restTokenToMint) public {
        //We compute the commision.
​        uint256 commission = mocInrate.calcCommissionValue(_restTokenToMint);
        //We compute the resTokensToMint.
        uint256 resTokensToMint = _restTokenToMint - commission;
        // Mint some new RDOC
        moc.mintStableToken(resTokensToMint);
​        // Transfer it to your receiver account
        doc.transfer(receiverAddress, doc.balanceOf(address(this)));
        // Rest of the function to actually perform the task
    }
    // rest of your contract
}
​
​
```

And that is it, the only thing left to do is to add in the [truffle migrations](https://www.trufflesuite.com/docs/truffle/getting-started/running-migrations) scripts the address to MoC and RiskPro when deploying YourContract and you are done.

## Redeeming RDOCs

**Settlements** is a time based recurring process that allows or rejects the processing of RDOC redeem requests. The process runs in 90 days intervals.

There are three ways to redeem RDOCs:

- On settlement: A RDOC redeem request can be created to redeem any amount of RDOCs, but this will be processed on the next settlement. The amount can be greater than the user's balance at request time, allowing to, for example, redeem all future user's RDOCs regardless of whether their balance increases. The functions that interests us are: `function redeemStableTokenRequest(uint256 stableTokenAmount) public` and `function alterRedeemRequestAmount(bool isAddition, uint256 delta) public`

- Outside of settlement: Only free RDOCs can be redeemed outside of the settlement. Free RDOCs are those that were not transferred to another to provide leverage. The function that interests us is: `function redeemFreeStableToken(uint256 stableTokenAmount) public`.

- On Liquidation State: The user can redeem all his RDOCs with the method: `function redeemAllStableToken() public`

### Redeeming RDOCs on Settlement: redeemStableTokenRequest

`function redeemStableTokenRequest(uint256 stableTokenAmount) public`
There is only one redeem request per user during a settlement. A new reedeem request is created if the user invokes it for the first time or has its value updated if it already exists.

#### Parameters of the operation

##### The stableTokenAmount parameter

It is the amount that the contract will use to create or update a RDOCs redeem request.
This parameter uses a precision of the type **reservePrecision** that contains 18 decimal places and can be greater than user's balance at request time, allowing to, for example, redeem all future user's RDOCs.

##### Gas limit and gas price

These two values are a parameter of the transaction, this is not used in the contract and is generally managed by your wallet (you should read about them if you are developing and do not know exactly what they are), but you should take them into account when trying to redeem some RDOCs.

#### Possible failures

This operation may fail if one of the following scenarios occurs:

##### The contract is paused:

If the system suffers some type of attack, the contract can be paused so that operations cannot be done and the risk of the users losing their funds with the operation can be minimized. The condition is the same as that explained in [The MoC contract is paused](#the-MoC-contract-is-paused).

##### Settlement is not ready:

The function can only be invoked when the Settlement is finished executing. If called during execution, the transaction reverts with the error message: _Function can only be called when settlement is ready_.

##### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert(again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.

##### Not active redeemer:

When a user tries to update a reedem request, but the system can not find its address as an active user for the current settlement. It is a very rare condition in which a transaction reverts with the error message: _This is not an active redeemer_.
If this situation occurs then you can contact the [Money on Chain team](https://moneyonchain.com/) to help you.

##### Not allowed redeemer:

When a user tries to update a reedem request and the system found its address as an active user but redeem request has a different address in the current settlement. It is a very rare condition in which a transaction reverts with the error message: _Not allowed redeemer_.
If this situation occurs then you can contact the [Money on Chain team](https://moneyonchain.com/) to help you.

#### Commisions

The redeemStableTokenRequest operation has no commissions, but when the settlement runs, the total amount of redeem requests will be used to pay the commission, this part is a percentage of the previous part. The exact percentage is established in the variable **commissionRate** of the contract **MocInrate**. The current value is 0.002 and can be queried through the `getCommissionRate()` function since this parameter is public (note that this parameter when queried through that method also has an accuracy of 18 decimal places, that is, a 2 \ \* 10 ^ 15 in those parameters means that 0.2% is charged as commission).

### Redeeming RDOCs on Settlement: alterRedeemRequestAmount

`alterRedeemRequestAmount(bool isAddition, uint256 delta) public`
There is only at most one redeem request per user during a settlement. A new reedeem request is created if the user invokes it for the first time or updates its value if it already exists.

#### Parameters of the operation

##### The isAddition parameter

**true** if you increase the amount of the redemption order amount, **false** otherwise.

##### The delta parameter

It is the amount that the contract will be used to update a RDOCs redeem request amount.
This parameter uses a precision of the type **reservePrecision** that contains 18 decimal places and can be greater than user's balance at request time, allowing to, for example, redeem all future user's RDOCs.
If isAddition is false and the **delta** param is greater than the total amount of the redeem request, then the total amount of the request will be set to 0.

##### Gas limit and gas price

These two values are a parameter of the transaction, this is not used in the contract and is generally managed by your wallet (you should read about them if you are developing and do not know exactly what they are), but you should take them into account when trying to redeem some RDOCs.

#### Possible failures

This operation may fail if one of the following scenarios occurs:

##### The contract is paused:

If the system suffers some type of attack, the contract can be paused so that operations cannot be done and the risk of the users losing their funds with the operation can be minimized. The condition is the same as that explained in [The MoC contract is paused](#the-MoC-contract-is-paused).

##### Settlement is not ready:

The function can only be invoked when the Settlement is finished executing. If called during execution, the transaction reverts with the error message: _Function can only be called when settlement is ready_.

##### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert(again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.

##### Not active redeemer:

When a user tries to update a redeem request, but the system cannot find its address as an active user for the current settlement. It is a rare condition in which a transaction reverts with the error message: _This is not an active redeemer_.
If this situation occurs then you can contact the [Money on Chain team](https://moneyonchain.com/) to help you.

##### Not allowed redeemer:

When a user tries to update a reedem request and the system found its address as an active user but redeem request has a different address in the current settlement. It is a very rare condition in which a transaction reverts with the error message: _Not allowed redeemer_.
If this situation occurs then you can contact the [Money on Chain team](https://moneyonchain.com/) to help you.

#### Commissions

The alterRedeemRequestAmount operation has no commissions, but when the settlement runs, the total amount of
redeem requests will be used to pay the commission, this part is a percentage of the previous part. The exact percentage is established in the variable **commissionRate** of the contract **MocInrate**. The current value is 0.002 and can be queried through the `getCommissionRate()` function since this parameter is public (note that this parameter when queried through that method also has an accuracy of 18 decimal places, that is, a 2 \ \* 10 ^ 15 in those parameters means that 0.2% is charged as commission).

### Redeeming RDOCs on Settlement: redeemFreeStableToken

`function redeemFreeStableToken(uint256 stableTokenAmount) public`

Redeems the requested **stableTokenAmount** for the user or the max amount of free docs possible if **stableTokenAmount** is bigger than max.

#### Parameters of the operation

##### The stableTokenAmount parameter

It is the amount that the contract will use to redeem free RDOCs.
This parameter uses a precision of the type **reservePrecision** that contains 18 decimal places and is defined in **MoCLibConnection** contract.
Money on Chain is a dynamic system that allows you to redeem a maximum amount of free RDOCS and can be obtained by calling the `freeStableToken()` view of the **MocState** contract.

The first part transforms the amount **stableTokenAmount** into an RIF amount, but 3 things can happen:

- If the absolute maximum amount of allowed RDOCs is bigger than the user's balance in RDOCs, then the user's total balance will be used to transform it to RIF.

```
      stableTokenAmountToRedeem = Math.min(mocState.freeStableToken(), docToken.balanceOf(account));
```

- If the previous amount is greater than the stableTokenAmount value, then stableTokenAmount will be used to transform it to RIF.

```
      finalDocAmount = Math.min(stableTokenAmount, stableTokenAmountToRedeem );
```

- If none of the above conditions are met, stableTokenAmount will be used to transform it to RIF.

```
      rdocRifValue <= stableTokensToResToken(finalDocAmount);
```

The second part will be used to compute and pay the interests of the operation that depends on the abundance of RDOCs in the MOC system. The value can be obtained by invoking the function `calcStableTokenRedInterestValues(finalDocAmount, rdocRifValue)` of the contract **MocInrate** and also has an accuracy of 18 decimal places.

The third part will be used to pay the commission, this part is a percentage of the previous part. The exact percentage is established in the variable **commissionRate** of the contract **MocInrate**. The current value is 0.002 and can be queried through the `getCommissionRate()` function since this parameter is public (note that this parameter when queried through that method also has an accuracy of 18 decimal places, that is, a 2 \ \* 10 ^ 15 in those parameters means that 0.2% is charged as commission).

The fourth part returns the amount in RIF discounting the previously calculated commissions and interests. In conclusion, the user receives the amount of RIF discounting the commissions

```
    rifReceived = finalRifAmount - finalRifAmount * commisionRate;
```

##### Gas limit and gas price

These two values are a parameter of the transaction, this is not used in the contract and is generally managed by your wallet (you should read about them if you are developing and do not know exactly what they are), but you should take them into account when trying to redeem some RDOCs.

#### Possible failures

This operation may fail if one of the following scenarios occurs:

##### The contract is paused:

If the system suffers some type of attack, the contract can be paused so that operations cannot be done and the risk of the users losing their funds with the operation can be minimized. The condition is the same as that explained in [The MoC contract is paused](#the-MoC-contract-is-paused).

##### The MoC contract is liquidated:

In the extraneous case where a coverage that barely covers the stable tokens funds is reached, the contract will liquidate all of its assets. If this state occurs, no more RDOCs will be available for minting.
To know if the contract is liquidated you can ask the **MocState** for the **state**, this will return a 0 if liquidated(it is actually an enum).

##### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert(again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.

### Redeeming RDOCs on Liquidation State: redeemAllStableToken

`function redeemAllStableToken() public`

Allows redeeming on liquidation state, user RDOCs get burned, and the user receives the equivalent RIFs according to the liquidation price which is the relation between the RDOCs total supply and the amount of RIF available to distribute.
The liquidation price can be queried with the view `getLiquidationPrice()` of the contract **MocState**.
If sending RIF fails then the system does not burn the RDOC tokens.

#### Parameters of the operation

##### Gas limit and gas price

These two values are a parameter of the transaction, this is not used in the contract and is generally managed by your wallet (you should read about them if you are developing and do not know exactly what they are), but you should take them into account when trying to redeem some RDOCs.

#### Possible failures

This operation may fail if one of the following scenarios occurs:

##### The MoC contract is not liquidated:

This operation can only be performed if the system is liquidated. If the MoC contract is in any other state then it fails and returns the following message: _Function cannot be called at this state_.

To know if the contract is liquidated you can ask the **MocState** for the **state**, this will return a 0 if liquidated(it is actually an enum).

##### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert(again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.

### How-to

In the following sections we will give some code on how this can be done through a Smart Contract or directly, with a console or with an app.
​

#### Smart Contract​

​
To create a new Smart Contract that uses the Money On Chain platform, you can use any language and IDE you want. In this tutorial, we will show you how to do it using [Solidity language](https://solidity.readthedocs.io/en/v0.5.8/), [Truffle Framework](https://www.trufflesuite.com/) and [NPM](https://www.npmjs.com/).
Truffle framework offers some template projects that you can use to develop applications that use smart contracts. You can get more information [here](https://www.trufflesuite.com/boxes).
Assuming you already have your project up and running (if you don't, please follow [this link](https://github.com/money-on-chain/main-RIF-contract/blob/master/README.md)) the only extra thing you need to do is to install our repo as a dependency in your NPM project. In order you need to do this you just need to run the following command.
​

```
npm install --save -E git+https://git@github.com/money-on-chain/main-RIF-contract.git
```

Having done that lets you use our contract as a dependency to your contract. For this let's suppose you are doing some kind of contract that when executing a certain task charges a fixed commission. Now let's suppose that the commission is sent in RIFs because it is easier for the user but actually you want some RDOCs. The good news is that you can do this instantly just by redeeming them. The code necessary to do this is actually pretty simple.
​
You just have to import the contract
​

```js
import 'money-on-chain/contracts/MoC.sol';
```

Receive the address in the constructor in order to be able to interact with it later

```js
constructor (MoC _mocContract, MoCInrate _mocInrateContract, rest of your params...) {
//....rest of your constructor....
}
​
```

```js
//Create a new redeem request
uint256 stableTokenAmount = 90;
moc.redeemStableTokenRequest(stableTokenAmount);
```

```js
//Add 10 docs to a redeem request.
moc.alterRedeemRequestAmount(true, 10);
//Sustract 5 docs to a redeem request.
moc.alterRedeemRequestAmount(true, 5);
```

```js
//Trying to redeem All Docs.
uint256 docBalance = docToken.balanceOf(userAddress);
moc.redeemFreeStableToken(docBalance);
```

You can send it immediately to you so you can start using it right away. In order to do this you should add a few more lines similar to the ones before, only that you will have to use the doc token.
​
This will leave you with a contract similar to the following

```js
import 'money-on-chain/contracts/MoC.sol';
```

Receive the address in the constructor in order to be able to interact with it later

```js
constructor (MoC _mocContract, rest of your params...) {
//....rest of your constructor....
}
​
```

You can send it immediately to you so you can start using it right away. In order to do this you should add a few more lines similar to the ones before, only that you will have to use the RIFPro token.
​
This will leave you with a contract similar to the following
​​

```js
pragma solidity 0.5.8;
import "money-on-chain/contracts/MoC.sol";
import "money-on-chain/contracts/token/StableToken.sol";
// Here you will import your own dependencies

contract YourRedeemingDocContract {
    // Address of the MoC contract
    MoC public moc;
    // Address of the RIFPro token
    StableToken public doc;
    // RDOC Amout
    uint256 stableTokenAmount;
    // rest of your variables

    constructor (MoC _moc, StableToken _doc, uint256 _stableTokenAmount) public {
        moc = _moc;
        doc = _doc;
        stableTokenAmount = _stableTokenAmount;
        // You could have more variables to initialize here
    }
​
    function createRedeemRequest() public {
        uint256 previousBalance = doc.balanceOf(msg.sender);
        moc.redeemStableTokenRequest(stableTokenAmount);
        uint256 newBalance = doc.balanceOf(msg.sender);
    }

    function addToRedeemRequest(uint256 _addValue) public {
        moc.alterRedeemRequestAmount(true, stableTokenAmount);
        uint256 newBalance = doc.balanceOf(msg.sender);
    }

    function sustractToRedeemRequest(uint256 _addValue) public {
        moc.alterRedeemRequestAmount(false, stableTokenAmount);
        uint256 newBalance = doc.balanceOf(msg.sender);
    }

    function redeemFreeStableToken(uint256 _stableTokenAmount) public {
        uint256 previousBalance = doc.balanceOf(msg.sender);
        moc.redeemFreeStableToken(_stableTokenAmount);
        uint256 newBalance = doc.balanceOf(msg.sender);
    }
    // rest of your contract
}​
```

And that is it, the only thing left to do is to add in the [truffle migrations](https://www.trufflesuite.com/docs/truffle/getting-started/running-migrations) scripts the address to MoC and RDOC when deploying YourContract and you are done.

# Getting RIF2X

RIF2X is targeted towards users looking to profit from long positions in RIF, with two times the risk and reward. Leveraged instruments borrow capital from the base bucket (50% in a X2) and pay a daily rate to it as return.

There is a relation between RDOCS and RIF2X. The more RDOCs minted, the more RIF2X can be minted, since they are used for leverage.

The RIF2X token does not implement an ERC20 interface and can not be traded freely because leveraged instruments cannot change owner. RIF2X are assigned to the user RIFX positions can be canceled any time though.

The daily rate can be obtained invoking the `dailyInrate()` view of the **MocInrate** contract.
​

## Minting RIF2X

RIF2X can only be minted in exchange for RIF.

In this tutorial the method(or function) that is of interest to us is `function mintRiskProx(bytes32 bucket, uint256 resTokensToMint) public` .

You must approve the amount of RIF token that you are willing to use on the Money on Chain platform before minting RIF2X. The approved amount is called **allowedBalance**. You can do this by invoking `function approve(address _spender, uint256 _value) public returns (bool success)` that is part of the [ERC20 standard](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md).

### Parameters of the operation

#### The bucket parameter

A bucket is a bag that stores the balances of the leveraged token holders. Currently, only the RIF2X bucket called _X2_ exists. The X2 must be passed as a hex value.

There is also a bucket named _C0_ but it should not be used to mint and redeem RIF2X.

In the following example you can see how to do it with javascript and the web3 library. For more detailed information about web3 you can read the [from outside blockchain](#from-outside-the-blockchain) section.

```js
const BUCKET_X2 = web3.utils.asciiToHex('X2', 32);
```

#### The resTokensToMint parameter

It is the amount the contract will use to actually mint RIF2X, i.e. it will not be used to pay commission, all of this funds will be transformed purely on RIF2X.
This parameter uses a precision of the type **reservePrecision** that contains 18 decimal places is defined in **MoCLibConnection** contract.

The amount sent in RIFs to the **MoC contract** will be split in four.

- The first part will be used to mint some RIF2X, the size of this part depends directly on the resTokensToMint, and it may be smaller than resTokensToMint.

- The second part will be used to compute and pay interests that can be queried with the `calcMintInterestValues(bucket, finalRifToMint)` of the **MocInrate** contract.

- The third part will be used to pay the commission, this part is a percentage of the first part. The exact percentage of it is set in the variable **commissionRate** of the **MocInrate** contract. The current value is 0.002 and can be consulted through the method `commissionRate()​` as this parameter is public(Note that this parameter when consulted through said method has also a precision of 18 decimals, i.e. a 2 \* 10^15 in that parameter means that 0.2% is being charged as a commission).

- The fourth part is always returned, so if you have doubts of how much you should send, keep in mind that if you send too much RIFs we will return everything that it is not used for commissions or interests.
  In conclusion the amount sent has to be at least the resTokensToMint plus the interests, the commission being resTokensToMint times the commission rate.

```
allowedBalance (RIF Token) >= resTokensToMint + interests + resTokensToMint * commissionRate
```

#### Gas limit and gas price

This two values are a parameter of the transaction, this is not used in the contract and it is usually managed by your wallet(you should read about them if you are developing and you don't know exactly what are they) but you should take them into account when trying to send all of your funds to mint some RIF2X.

### Possible failures

This operation may fail if one of the following scenarios occurs:

#### The MoC contract is liquidated:

In the extraneous case where a coverage that barely covers the stable tokens funds is reached, the contract will liquidate all of its assets. If this state occurs, no more RIF2X will be available for minting.
To know if the contract is liquidated you can ask the **MocState** for the **state**, this will return a 0 if liquidated(it is actually an enum).

#### The MoC contract is paused:

If the system suffers some type of attack, the contract can be paused so that operations cannot be done and the risk of the users losing their funds with the operation can be minimized. You can get more information about stoppables contracts [here](https://github.com/money-on-chain/Areopagus-Governance/blob/develop/contracts/Stopper/Stoppable.sol)
In that state, the contract doesn't allow minting any type of token.

To know if this is the case you can ask to **MoC** if it's **paused()**.

##### Settlement is not ready:

The function can only be invoked when the Settlement is finished executing. If called during execution, the transaction reverts with the error message: _Function can only be called when settlement is ready_.

##### Bucket is not available:

Currently, only the RIF2X bucket called 'X2' exists. If it is called with another bucket, the transaction reverts with the error message: _Bucket is not available_.

##### Bucket is not a base bucket:

Currently, only the RIF2X bucket called 'X2' exists. If you call the function with _C0_ bucket, the transaction reverts with the error message: _Bucket should not be a base type bucket_.

#### You allowed too few funds:

If the RIF funds you allowed doesn't cover the amount you specified on resTokensToMint.

If this is the case the transaction will revert, all your funds will be returned (except the fee paid to the network). The error message will be "amount is not enough".

#### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert(again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.

### How-to

In the following sections we will give some code on how this can be done through a Smart Contract or directly, with a console or with an app.
​

#### Smart Contract​

​
To create a new Smart Contract that uses the Money On Chain platform, you can use any language and IDE you want. In this tutorial, we will show you how to do it using [Solidity language](https://solidity.readthedocs.io/en/v0.5.8/), [Truffle Framework](https://www.trufflesuite.com/) and [NPM](https://www.npmjs.com/).
Truffle framework offers some template projects that you can use to develop applications that use smart contracts. You can get more information [here](https://www.trufflesuite.com/boxes).
Assuming you already have your project up and running (if you don't, please follow [this link](https://github.com/money-on-chain/main-RIF-contract/blob/master/README.md)) the only extra thing you need to do is to install our repo as a dependency in your NPM project. In order you need to do this you just need to run the following command.
​

```
npm install --save -E git+https://git@github.com/money-on-chain/main-RIF-contract.git
```

Having done that lets you use our contract as a dependency to your contract. For this let's suppose you are doing some kind of contract that when executing a certain task charges a fixed commission. Now let's suppose that the commission is sent in RIFs because it is easier for the user but actually you want some RIFPros. The good news is that you can do this instantly just by minting them. The code necessary to do this is actually pretty simple.
​
You just have to import the contract
​

```js
import 'money-on-chain/contracts/MoC.sol';
import 'money-on-chain/contracts/MoCInrate.sol';
```

Receive the address in the constructor in order to be able to interact with it later

```js
constructor (MoC _mocContract, MoCInrate _mocInrateContract, rest of your params...) {
//....rest of your constructor....
}
​
```

​and, finally, when you receive a commission, exchange it for some RIFPros
​

```js
bytes32 constant public BUCKET_X2 = "X2";
uint256 resTokenToMint = 10000;
if (resTokenToMint > moc.getAllowance(msg.sender)){
    resTokenToMint = moc.getAllowance(msg.sender);
}
uint256 commissionOfMoC = mocInrate.calcCommissionValue(resTokenToMint);
moc.mintRiskProx(BUCKET_X2, resTokenToMint-commissionOfMoC);
```

​
You can send it immediately to you so you can start using it right away. In order to do this you should add a few more lines similar to the ones before, only that you will have to use the RIF2X token.
​
This will leave you with a contract similar to the following
​
​

```js
pragma solidity 0.5.8;
​
import "money-on-chain/contracts/MoC.sol";
import "money-on-chain/contracts/MoCInrate.sol";
// Here you will import your own dependencies
​
contract YourMintingRIF2xContract {
    // Address of the MoC contract
    MoC public moc;
    // Address of the MocInrate contract
    MoCInrate public mocInrate;
    // Define a constant to call bucket X2
​    bytes32 constant public BUCKET_X2 = "X2";

    constructor (MoC _moc, MoCInrate _mocInrate) public {
        moc = _moc;
        mocInrate = _mocInrate;
        // You could have more variables to initialize here
    }
​
    function doTask(uint256 _reserveTokenToMint) public {
        //We compute the commision.
​        uint256 commission = mocInrate.calcCommissionValue(_reserveTokenToMint);
        //We compute the resTokensToMint.
        uint256 resTokensToMint = _reserveTokenToMint - commission;
        // Mint some new RIFPro
        moc.mintRiskProx(BUCKET_X2, _reserveTokenToMint);
        // Rest of the function to actually perform the task
    }
    // rest of your contract
}
​
​
```

​
​​

## Redeeming RIF2X

The Money On Chain's Smart Contract suite is in control of redeeming its tokens, including the RIF2X token. This means that the return of RIF2X is controlled programmatically by said suite. ​A user can "sell" their RIF2X back to the contract and have RIF deposited are sent back to the user, alongside the refunded interests (waiting in inrateBag) for the remaining time until the settlement (not yet charged).

In this tutorial the method(or function) that is of interest to us is `function redeemRiskProx(bytes32 bucket, uint256 bproxAmount) public`.

### Parameters of the operation

#### The bucket parameter

A bucket is a bag that stores the balances of the leveraged token holders. Currently, only the RIF2X bucket called _X2_ exists. The X2 must be passed as an hex value.

There is also a bucket named _C0_ but it should not be used to mint and redeem RIF2X.

In the following example you can see how to do it with javascript and the web3 library. For more detailed information about web3 you can read the [From outside the blockchain](#from-outside-the-blockchain) section.

```js
const BUCKET_X2 = web3.utils.asciiToHex('X2', 32);
```

#### The bproxAmount parameter

It is the amount that the contract will use to redeem RIF2X and will be used to calculate commissions. All of these funds will be transformed exclusively into RIF.
This parameter uses a precision of the type **reservePrecision** that contains 18 decimal places and is defined in **MoCLibConnection** contract.

The redeeming process is divided into 4 parts:
The first part transforms the amount **bproxAmount** into an RIF amount, but 2 things can happen:

- The amount entered in riskProAmount must not exceed the user's balance in RIFPros. If this occurs then the user’s balance will be used to calculate the value in RIF.

```
    userBalance = bproxBalanceOf(bucket, user);
    riskProxToRedeem = Math.min(bproxAmount, userBalance);
    rifToRedeem = bproxToBtc(riskProxToRedeem, bucket);
```

The second part computes interests to be paid to the user.

The third part will be used to pay the commission, this part is a percentage of the first part. The exact percentage is established in the variable **commissionRate** of the contract **MocInrate**. The current value is 0.002 and can be queried through the `getCommissionRate()` function since this parameter is public (note that when this parameter is queried through that method it has an accuracy of 18 decimal places, that is, a 2 \ \* 10 ^ 15 in those parameters means that 0.2% is charged as commission).

The fourth part returns the amount in RIF adding the computed interest and discounting the previously calculated commissions.

```
rifReceived = totalRif + interests - totalRif * commissionRate
```

#### Gas limit and gas price

These two values are a parameter of the transaction, this is not used in the contract and is generally managed by your wallet (you should read about them if you are developing and do not know exactly what they are), but you should take them into account when trying to redeem some RIF2X.

### Possible failures

This operation may fail if one of the following scenarios occurs:

#### The MoC contract is liquidated:

In the extraneous case where a coverage that barely covers the stable tokens funds is reached, the contract will liquidate all of its assets. If this state occurs, no more RIF2X will be available for redeeming.
To know if the contract is liquidated you can ask the **MocState** for the **state**, this will return a 0 if liquidated(it is actually an enum).

#### The MoC contract is paused:

If the system suffers some type of attack, the contract can be paused so that operations cannot be done and the risk of the users losing their funds with the operation can be minimized. You can get more information about stoppables contracts [here](https://github.com/money-on-chain/Areopagus-Governance/blob/develop/contracts/Stopper/Stoppable.sol)
In that state, the contract doesn't allow minting any type of token.

To know if this is the case you can ask to **MoC** if it's **paused()**.

##### Settlement is not ready:

The function can only be invoked when the Settlement has finished executing. If called during execution, the transaction reverts with the error message: _Function can only be called when settlement is ready_.

##### Bucket is not available:

Currently, only the RIF2X bucket called 'X2' exists. If it is called with another bucket, the transaction reverts with the error message: _Bucket is not available_.

##### Bucket is not a base bucket:

Currently, only the RIF2X bucket called 'X2' exists. If you call the function with _C0_ bucket, the transaction reverts with the error message: _Bucket should not be a base type bucket_.

#### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert(again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.

### How-to

In the following sections we will give some code on how this can be done through a Smart Contract or directly, with a console or with an app.
​

#### Smart Contract​

​
To create a new Smart Contract that uses the Money On Chain platform, you can use any language and IDE you want. In this tutorial, we will show you how to do it using [Solidity language](https://solidity.readthedocs.io/en/v0.5.8/), [Truffle Framework](https://www.trufflesuite.com/) and [NPM](https://www.npmjs.com/).
Truffle framework offers some template projects that you can use to develop applications that use smart contracts. You can get more information [here](https://www.trufflesuite.com/boxes).
Assuming you already have your project up and running (if you don't, please follow [this link](https://github.com/money-on-chain/main-RIF-contract/blob/master/README.md)) the only extra thing you need to do is to install our repo as a dependency in your NPM project. In order you need to do this you just need to run the following command.
​

```
npm install --save -E git+https://git@github.com/money-on-chain/main-RIF-contract.git
```

Having done that lets you use our contract as a dependency to your contract. For this let's suppose you are doing some kind of contract that when executing a certain task charges a fixed commission. Now let's suppose that the commission is sent in RIFs because it is easier for the user but actually you want some RIFPros. The good news is that you can do this instantly just by minting them. The code necessary to do this is actually pretty simple.
​
You just have to import the contract
​

```js
import 'money-on-chain/contracts/MoC.sol';
```

Receive the address in the constructor in order to be able to interact with it later

```js
constructor (MoC _mocContract, MoCInrate _mocInrateContract, rest of your params...) {
//....rest of your constructor....
}
​
```

```js
uint256 riskProAmount = 9000000;
moc.redeemRiskPro(riskProAmount);
```

​
You can send it immediately to you so you can start using it right away. In order to do this you should add a few more lines similar to the ones before, only that you will have to use the RIFPro token.
​
This will leave you with a contract similar to the following

```js
import 'money-on-chain/contracts/MoC.sol';
import 'money-on-chain/contracts/MoCInrate.sol';
```

Receive the address in the constructor in order to be able to interact with it later

```js
constructor (MoC _mocContract, MoCInrate _mocInrateContract, rest of your params...) {
//....rest of your constructor....
}
​
```

You can send it immediately to you so you can start using it right away. In order to do this you should add a few more lines similar to the ones before, only that you will have to use the RIFPro token.
​
This will leave you with a contract similar to the following
​​
```js
pragma solidity 0.5.8;
​
import "money-on-chain/contracts/MoC.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
// Here you will import your own dependencies

contract YourRedeemingRiskProxContract {
    // Address of the MoC contract
    MoC public moc;
    // Address of the RIF token
    IERC20 public rif;
    // rest of your variables
​    bytes32 constant public BUCKET_X2 = "X2";

    constructor (MoC _moc, IERC20 _rif) public {
        moc = _moc;
        rif = _rif;
        // You could have more variables to initialize here
    }
​
    function doTask(uint256 _riskProAmount) public {
        uint256 previeusBalance = moc.riskProxBalanceOf(BUCKET_X2, msg.sender);
        uint256 previousRifBalance = rif.balanceOf(msg.sender);
        moc.redeemRiskProx(BUCKET_X2,_riskProAmount);
        uint256 newBalance = moc.riskProxBalanceOf(BUCKET_X2, msg.sender);
        uint256 newRifBalance = rif.balanceOf(msg.sender);
    }
    // rest of your contract
}​
​
```

# From outside the blockchain

The logic of the Money on Chain platform is developed with smart contracts that run on the RSK blockchain. To interact with this kind of technology, we developed a dApp (decentralized application), which is a web or mobile application that invokes the functions of the smart contracts.

You can find tutorials about developing dApps in the following resources:

- [The Ultimate Ethereum Dapp Tutorial (How to Build a Full Stack Decentralized Application Step-By-Step)](https://www.dappuniversity.com/articles/the-ultimate-ethereum-dapp-tutorial)

- [ETHEREUM PET SHOP -- YOUR FIRST DAPP](https://www.trufflesuite.com/tutorials/pet-shop)

- [RSK Truffle Boxes](https://developers.rsk.co/tools/truffle/boxes/)

  The web3 library is one of the most popular to invoke the functions of smart contracts and there are different projects to use them with

- [javascript](https://web3js.readthedocs.io/)
- [Python](https://web3py.readthedocs.io/en/stable/)
- [Java and Android](https://docs.web3j.io/)
- [.NET](https://nethereum.readthedocs.io/en/latest/)
- [Swift](https://web3swift.io/)

We use **web3.js** in this tutorial.

An RSK smart contract is bytecode implemented on the RSK blockchain. When a smart contract is compiled, an ABI (application binary interface) is generated and it is required so that you can specify which contract function to invoke, as well as get a guarantee that the function will return the data in the format you expect.
The ABI in JSON format must be provided to web3 to build decentralized applications.

​

## Using RSK nodes

Money on Chain contracts are executed on the RSK blockchain whose public nodes are testnet (testing environment) and mainnet (production environment). You can use a public node or install a node in your own server.

### Public node: RSK Testnet

- URL: https://public-node.testnet.rsk.co
- chainID: 31
- Cryptocurrency symbol: RIF
- Explorer: https://explorer.testnet.rsk.co/

### Public node: RSK Mainnet

- URL: https://public-node.rsk.co
- chainID: 30
- Cryptocurrency symbol: RIF
- Explorer: https://explorer.rsk.co/

### Truffle config: truffle.js

If you use truffle then you can use the following settings in your **truffle.js** file

```js
const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic = 'YOUR_MNEMO_PRHASE';

module.exports = {
  compilers: {
    solc: {
      version: '0.5.8',
      evmVersion: 'byzantium',
      settings: {
        optimizer: {
          enabled: true,
          runs: 1
        }
      }
    }
  },
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    },
    rskTestnet: {
      host: 'https://public-node.testnet.rsk.co',
      provider: new HDWalletProvider(mnemonic, 'https://public-node.testnet.rsk.co'),
      network_id: '31',
      gasPrice: 60000000
    },
    rskMainnet: {
      host: 'https://public-node.rsk.co',
      provider: new HDWalletProvider(mnemonic, 'https://public-node.rsk.co'),
      network_id: '30',
      gasPrice: 60000000
    }
  }
};
```

### Installing your own node

The RSK node can be installed on different operating systems such as Linux, Windows and Mac. It is also possible to run them in environments running docker and in cloud service providers such as AWS, Azure and Google. For more information check the [official RSK documentation](https://developers.rsk.co/rsk/node/install/)

## Using web3

You can use the technology that suits you best for your project to integrate with the Money on Chain platform, but you must use web3 to invoke the functions of smart contracts. You can learn how to use it with the following tutorials:

- javascript: [Intro to Web3.js · Ethereum Blockchain Developer Crash Course](https://www.dappuniversity.com/articles/web3-js-intro)
- python: [Intro to Web3.py · Ethereum For Python Developers](https://www.dappuniversity.com/articles/web3-py-intro)
- Java an Android: [web3j Getting Started](https://docs.web3j.io/getting_started/)
- .NET: [Getting Started with Nethereum](http://docs.nethereum.com/en/latest/getting-started/)
- Swift: [Web3Swift README.md](https://github.com/zeriontech/web3swift)

## Official Money on Chain ABIS

In the Money on Chain repository you can find the [official ABIs of the platform](https://github.com/money-on-chain/web-billfold-app/tree/develop/contracts/poc). You can use them to build your own decentralized applications to invoke the functions of smart contracts.

## Events

When a transaction is mined, smart contracts can emit events and write logs to the blockchain that the frontend can then process. Click [here](https://media.consensys.net/technical-introduction-to-events-and-logs-in-ethereum-a074d65dd61e) for more information about events.

In the following example we will show you how to find events that are emitted by Money On Chain smart contract in **RSK Testnet** blockchain with **truffle**.


**Code example**

```js
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MocExchange = require('../../build/contracts/MoCExchange.json');
const truffleConfig = require('../../truffle');

/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('rskTestnet');

//Contract address on testnet
const mocExchangeAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  // Loading MoCExchange contract to get the events emitted by this
  const mocExchange = await getContract(MocExchange.abi, mocExchangeAddress);
  if (!mocExchange) {
    throw Error('Can not find MoCExchange contract.');
  }

  // In this example we are getting BPro Mint events from MoCExchange contract
  // in the interval of blocks passed by parameter
  const getEvents = () =>
    Promise.resolve(mocExchange.getPastEvents('RiskProMint', { fromBlock: 1000, toBlock: 1010 }))
      .then(events => console.log(events))
      .catch(err => console.log('Error getting past events ', err));

  await getEvents();
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
```

Check [official web3 documentation](https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html) for more details.

## Example code minting RIFPros

In the following example we will show how to invoke the mintRiskPro function of the Money on Chain contract in testnet.

First we create a new node project.

```
mkdir example-mint-riskpro
node init
```

Then we add the necessary dependencies to run the project

```
cd example-mint-riskpro
npm install --save bignumber.js
npm install --save web3
npm install --save truffle-hdwallet-provider
```
**Example**
```js
const HDWalletProvider = require('truffle-hdwallet-provider');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MocAbi = require('./contracts/moc/MoC.json');
const MoCInrateAbi = require('./contracts/moc/MoCInrate.json');
const MoCStateAbi = require('./contracts/moc/MoCState.json');

//Config params to TestNet
const endpoint = 'https://public-node.testnet.rsk.co';
//a mnemonic is 12 words instead of a single private key to sign the //transactions
const mnemonic = 'chase chair crew elbow uncle awful cover asset cradle pet loud puzzle';
const provider = new HDWalletProvider(mnemonic, endpoint);
const web3 = new Web3(provider);

//Contract addresses on testnet
const mocContractAddress = '0x2820f6d4D199B8D8838A4B26F9917754B86a....';
const mocInrateAddress = '0x76790f846FAAf44cf1B2D717d0A6c5f6f515....';
const mocStateAddress = '0x0adb40132cB0ffcEf6ED81c26A1881e21410....';
const gasPrice = 60000000;

const execute = async () => {
  /**
   * Loads an specified contract
   * @param {json ABI} abi
   * @param {localhost/testnet/mainnet} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  /**
   * Transforms BigNumbers into
   * @param {*} number
   */
  const toContract = (number) => new BigNumber(number).toFixed(0);

  // Loading moc contract
  const moc = await getContract(MocAbi.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocInrate contract. It is necessary to compute commissions
  const mocInrate = await getContract(MoCInrateAbi.abi, mocInrateAddress);
  if (!mocInrate) {
    throw Error('Can not find MoC Inrate contract.');
  }

  // Loading mocState contract. It is necessary to compute max RIFP available to mint
  const mocState = await getContract(MoCStateAbi.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  const mintRiskPro = async (rifAmount) => {
    web3.eth.getAccounts().then(console.log);
    const from = '0x088f4B1313D161D83B4D8A5EB90905C263ce0DbD';
    // Computes commision value
    const commissionValue = new BigNumber(
      await mocInrate.methods.calcCommissionValue(rifAmount).call()
    );
    // Computes totalRifAmount to call mintRiskPro
    const totalRifAmount = toContract(commissionValue.plus(rifAmount));
    console.log(`Calling RiskProx minting with account: ${from} and amount: ${rifAmount}.`);
    const tx = moc.methods
      .mintRiskPro(rifAmount)
      .send({ from, gasPrice }, function (error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      });

    return tx;
  };

  function logEnd() {
    console.log('End Example');
  }

  // Gets max RIFP available to mint
  const maxRiskProAvailable = await mocState.methods.maxMintRiskProAvalaible().call();
  console.log('Max Available RIFP: '.concat(maxRiskProAvailable.toString()));
  const rifAmount = '50';

  // Call mint
  await mintRiskPro(rifAmount, logEnd);
};

execute()
  .then(() => console.log('Completed'))
  .catch((err) => {
    console.log('Error', err);
  });
```
## Example code redeeming RIFPros with truffle

In the following example we will show how to:

- Get the maximum amount of RIFPro.
- Get user BPRO balance.
- Redeem BPROs.

We will use the TestNet network.
You can find code examples into _/examples_ dir.
First we create a new node project.

```
mkdir example-redeem-riskpro
node init
```

Then we add the necessary dependencies to run the project

```
cd example-redeem-riskpro
npm install --save web3
```
**Example**
```js
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const Moc = require('../../build/contracts/MoC.json');
const MoCState = require('../../build/contracts/MoCState.json');
const RiskProToken = require('../../build/contracts/RiskProToken.json');
const truffleConfig = require('../../truffle');

/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a gasPrice from truffle.js file
 * @param {String} network
 */
const getGasPrice = network => truffleConfig.networks[network].gasPrice || 60000000;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('rskTestnet');
const gasPrice = getGasPrice('rskTestnet');

//Contract addresses on testnet
const mocContractAddress = '<contract-address>';
const mocStateAddress = '<contract-address>';
const riskProTokenAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  // Loading moc contract
  const moc = await getContract(Moc.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute absolute max BPRO
  const mocState = await getContract(MoCState.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  // Loading BProToken contract. It is necessary to compute user balance
  const riskProToken = await getContract(RiskProToken.abi, riskProTokenAddress);
  if (!riskProToken) {
    throw Error('Can not find RiskProToken contract.');
  }

  const [from] = await web3.eth.getAccounts();

  const redeemRPro = async rproAmount => {
    const weiAmount = web3.utils.toWei(rproAmount, 'ether');
    console.log(`Calling redeem RPro with account: ${from} and amount: ${weiAmount}.`);
    moc.methods
      .redeemRiskPro(weiAmount)
      .send({ from, gasPrice }, function(error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      })
      .on('transactionHash', function(hash) {
        console.log('TxHash: '.concat(hash));
      })
      .on('receipt', function(receipt) {
        console.log(receipt);
      })
      .on('error', console.error);
  };

  const getAbsoluteMaxRpro = await mocState.methods.absoluteMaxRiskPro().call();
  const userAmount = await riskProToken.methods.balanceOf(from).call();

  console.log('=== Max amount of RPro to redeem: ', getAbsoluteMaxRpro.toString());
  console.log('=== User RPro Balance: ', userAmount.toString());

  const rproAmount = '0.00001';

  // Call redeem
  await redeemRPro(rproAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
```
## Example code minting RDOC with truffle

In the following example we will show how to:

- Get the maximum amount of RDOC available to mint.
- Mint RDOCs.

You can find code examples into _/examples_ dir.

We will use the TestNet network.
First we create a new node project.

```
mkdir example-mint-stabletoken
node init
```

Then we add the necessary dependencies to run the project

```
cd example-mint-stabletoken
npm install --save web3
```
**Example**
```js
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MocAbi = require('../../build/contracts/MoC.json');
const MoCStateAbi = require('../../build/contracts/MoCState.json');
const truffleConfig = require('../../truffle');

/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a gasPrice from truffle.js file
 * @param {String} network
 */
const getGasPrice = network => truffleConfig.networks[network].gasPrice || 60000000;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('rskTestnet');
const gasPrice = getGasPrice('rskTestnet');

//Contract addresses on testnet
const mocContractAddress = '<contract-address>';
const mocStateAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);


  // Loading moc contract
  const moc = await getContract(MocAbi.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute max RDoc available to mint
  const mocState = await getContract(MoCStateAbi.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  const mintDoc = async rifAmount => {
    const [from] = await web3.eth.getAccounts();
    const weiAmount = web3.utils.toWei(rifAmount, 'ether');
    console.log(`Calling RDoc minting, account: ${from}, amount: ${weiAmount}.`);
    moc.methods
      .mintStableToken(weiAmount)
      .send({ from, value: totalBtcAmount, gasPrice }, function(error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      })
      .on('transactionHash', function(hash) {
        console.log('TxHash: '.concat(hash));
      })
      .on('receipt', function(receipt) {
        console.log(receipt);
      })
      .on('error', console.error);
  };

  // Gets max BPRO available to mint
  const getAbsoluteMaxRDoc = await mocState.methods.absoluteMaxStableToken().call();
  const rifAmount = '0.00001';
  
  console.log('=== Max RDoc amount available to mint: ', getAbsoluteMaxRDoc.toString());
  console.log('=== RIFs that are gonna be minted:  ', rifAmount);

  // Call mint
  await mintDoc(rifAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
```
## Example code redeeming Free RDOC with truffle

You can see [here](#redeeming-rdocs) how RDOC's redeemption works.
In the following example we will show how to:

- Get the maximum amount of free RDOC available to redeem.
- Get RDOC balance of an account.
- Redeem RDOCs.

You can find code examples into _/examples_ dir.

We will use the TestNet network.
First we create a new node project.

```
mkdir example-redeem-free-stabletoken
node init
```

Then we add the necessary dependencies to run the project

```
cd example-redeem-free-stabletoken
npm install --save web3
```
**Example**
```js
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MoC = require('../../build/contracts/MoC.json');
const MocState = require('../../build/contracts/MoCState.json');
const StableToken = require('../../build/contracts/StableToken.json');
const truffleConfig = require('../../truffle');
/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a gasPrice from truffle.js file
 * @param {String} network
 */
const getGasPrice = network => truffleConfig.networks[network].gasPrice || 60000000;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('rskTestnet');
const gasPrice = getGasPrice('rskTestnet');

//Contract addresses on testnet
const mocAddress = '<contract-address>';
const mocStateAddress = '<contract-address>';
const stableTokenAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  // Loading MoC contract
  const moc = await getContract(MoC.abi, mocAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute freeDoc
  const mocState = await getContract(MocState.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  // Loading DocToken contract. It is necessary to compute user balance
  const stableToken = await getContract(StableToken.abi, stableTokenAddress);
  if (!stableToken) {
    throw Error('Can not find StableToken contract.');
  }

  const [from] = await web3.eth.getAccounts();

  const redeemFreeRDoc = async rDocAmount => {
    const weiAmount = web3.utils.toWei(rDocAmount, 'ether');

    console.log(`Calling redeem free RDoc, account: ${from}, amount: ${weiAmount}.`);
    moc.methods
      .redeemFreeStableToken(weiAmount)
      .send({ from, gasPrice }, function(error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      })
      .on('transactionHash', function(hash) {
        console.log('TxHash: '.concat(hash));
      })
      .on('receipt', function(receipt) {
        console.log(receipt);
      })
      .on('error', console.error);

  };

  const rDocAmount = '10000';
  const freeRDoc = await mocState.methods.freeStableTokeneDoc().call();
  const userRDocBalance = await stableToken.methods.balanceOf(from).call();
  const finalDocAmount = Math.min(freeRDoc, userRDocBalance);
  console.log('=== User RDOC balance: ', userRDocBalance.toString());
  console.log('=== Free RDOC: ',freeRDoc.toString());
  console.log('=== Max Available RDOC to redeem: ', finalDocAmount.toString());

  // Call redeem
  await redeemFreeRDoc(rDocAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
```
## Example redeeming DOC Request using Truffle

You can see [here](#redeeming-rdocs) how RDOC's redeemption works.
In the following example we will show how to invoke redeemStableTokenRequest using Money on Chain contract. We
will use TestNet network.

You can find code examples into _/examples_ dir.

First we create a new node project.

```
mkdir example-redeem-stabletoken
node init
```

Then we add the necessary dependencies to run the project

```
cd example-redeem-stabletoken
npm install --save web3
```
**Example**
```js
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MoC = require('../../build/contracts/MoC.json');
const truffleConfig = require('../../truffle');
/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a gasPrice from truffle.js file
 * @param {String} network
 */
const getGasPrice = network => truffleConfig.networks[network].gasPrice || 60000000;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('rskTestnet');
const gasPrice = getGasPrice('rskTestnet');

//Loading MoC address on testnet
const mocAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  // Loading MoC contract
  const moc = await getContract(MoC.abi, mocAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }


  const redeemRDocRequest = async rDocAmount => {
    const [from] = await web3.eth.getAccounts();
    const weiAmount = web3.utils.toWei(rDocAmount, 'ether');

    console.log(`Calling redeem RDoc request, account: ${from}, amount: ${weiAmount}.`);
    moc.methods
      .redeemStableTokenRequest(weiAmount)
      .send({ from, gasPrice }, function(error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      })
      .on('transactionHash', function(hash) {
        console.log('TxHash: '.concat(hash));
      })
      .on('receipt', function(receipt) {
        console.log(receipt);
      })
      .on('error', console.error);
  };

  const rDocAmount = '10000';

  // Call redeem
  await redeemRDocRequest(rDocAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
  ```
## Example redeeming all DOC using Truffle

You can see [here](#redeeming-rdocs) how RDOC's redeemption works.
In the following example we will show how to invoke redeemAllStableToken using Money on Chain contract. We
will use TestNet network.

You can find code examples into _/examples_ dir.

First we create a new node project.

```
mkdir example-redeem-all-stabletoken
node init
```

Then we add the necessary dependencies to run the project

```
cd example-redeem-all-stabletoken
npm install --save web3
```
**Example**
```js
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MoC = require('../../build/contracts/MoC.json');
const truffleConfig = require('../../truffle');
/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a gasPrice from truffle.js file
 * @param {String} network
 */
const getGasPrice = network => truffleConfig.networks[network].gasPrice || 60000000;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('rskTestnet');
const gasPrice = getGasPrice('rskTestnet');

// Loading MoC address on testnet
const mocAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  // Loading MoC contract
  const moc = await getContract(MoC.abi, mocAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }


  const redeemAllRDoc = async () => {
    const [from] = await web3.eth.getAccounts();

    console.log(`Calling redeem all RDoc.`);
    moc.methods
      .redeemAllStableToken()
      .send({ from, gasPrice }, function(error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      })
      .on('transactionHash', function(hash) {
        console.log('TxHash: '.concat(hash));
      })
      .on('receipt', function(receipt) {
        console.log(receipt);
      })
      .on('error', console.error);
  };

  // Call redeem
  await redeemAllRDoc();
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
```
## Example minting RIF2X using Truffle

In the following example we will learn how to:

- Get the maximum amount of RIF2X available to mint.
- Mint RIF2X.

You can find code examples into _/examples_ dir.

First we create a new node project.

```
mkdir example-mint-riskproxtoken
node init
```

Then we add the necessary dependencies to run the project

```
cd example-mint-riskproxtoken
npm install --save web3
```
**Example**
```js
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const Moc = require('../../build/contracts/MoC.json');
const MoCState = require('../../build/contracts/MoCState.json');
const truffleConfig = require('../../truffle');

/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a gasPrice from truffle.js file
 * @param {String} network
 */
const getGasPrice = network => truffleConfig.networks[network].gasPrice || 60000000;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('rskTestnet');
const gasPrice = getGasPrice('rskTestnet');

//Contract addresses on testnet
const mocContractAddress = '<contract-address>';
const mocStateAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);
  const strToBytes32 = bucket => web3.utils.asciiToHex(bucket, 32);
  const bucketX2 = 'X2';

  // Loading moc contract
  const moc = await getContract(Moc.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute max BPRO available to mint
  const mocState = await getContract(MoCState.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  const mintRif2x = async rifAmount => {
    const [from] = await web3.eth.getAccounts();
    const weiAmount = web3.utils.toWei(rifAmount, 'ether');
    console.log(`Calling mint RIF2X with ${rifAmount} RIFs with account: ${from}.`);
    moc.methods
      .mintRiskProx(strToBytes32(bucketX2), weiAmount)
      .send({ from, gasPrice }, function(error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      })
      .on('transactionHash', function(hash) {
        console.log('TxHash: '.concat(hash));
      })
      .on('receipt', function(receipt) {
        console.log(receipt);
      })
      .on('error', console.error);
  };

  const rifToMint = '0.00001';
  // Gets max BTC value available to mint BPROX2
  const maxRif2xToMint = await mocState.methods.maxRiskProx(strToBytes32(bucketX2)).call();
  console.log('=== Max Available RIF2X to mint: '.concat(maxRif2xToMint.toString()));

  // Call mint
  await mintRif2x(rifToMint);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
```
## Example redeeming RIF2X using Truffle

In the following script example we will learn how to:

- Get RIF2X balance of an account.
- Redeem RIF2X.

You can find code examples into _/examples_ dir.
First we create a new node project.

```
mkdir example-redeem-riskproxtoken
node init
```

Then we add the necessary dependencies to run the project

```
cd example-redeem-riskproxtoken
npm install --save web3
```
**Example**
```js
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MoC = require('../../build/contracts/MoC.json');
const MoCRiskProxManager = require('../../build/contracts/MoCRiskProxManager.json');
const truffleConfig = require('../../truffle');

/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a gasPrice from truffle.js file
 * @param {String} network
 */
const getGasPrice = network => truffleConfig.networks[network].gasPrice || 60000000;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('rskTestnet');
const gasPrice = getGasPrice('rskTestnet');

//Contract addresses on testnet
const mocContractAddress = '<contract-address>';
const mocRiskProxManagerAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);
  const strToBytes32 = bucket => web3.utils.asciiToHex(bucket, 32);
  const bucketX2 = 'X2';

  // Loading Moc contract
  const moc = await getContract(MoC.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading MoCRiskProxManager contract. It is necessary to compute user RIF2X balance
  const mocRiskProxManager = await getContract(MoCRiskProxManager.abi, mocRiskProxManagerAddress);
  if (!mocRiskProxManager) {
    throw Error('Can not find MoCRiskProxManager contract.');
  }

  const [from] = await web3.eth.getAccounts();

  const redeemRif2x = async rif2xAmount => {
    const weiAmount = web3.utils.toWei(rif2xAmount, 'ether');

    console.log(`Calling redeem RIF2X with account: ${from}, amount: ${weiAmount}.`);
    moc.methods
      .redeemRiskProx(strToBytes32(bucketX2), weiAmount)
      .send({ from, gasPrice }, function(error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      })
      .on('transactionHash', function(hash) {
        console.log('TxHash: '.concat(hash));
      })
      .on('receipt', function(receipt) {
        console.log(receipt);
      })
      .on('error', console.error);
  };

  const userBalance = await mocRiskProxManager.methods
    .riskProxBalanceOf(strToBytes32(bucketX2), from)
    .call();
  console.log('=== User RIF2X Balance: '.concat(userBalance.toString()));

  const rif2xAmount = '0.00001';

  // Call redeem
  await redeemRif2x(rif2xAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
```