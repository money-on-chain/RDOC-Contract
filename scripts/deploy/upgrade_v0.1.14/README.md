# Upgrade version v0.1.14 - Disable of mint leveraged position

This release include the upgrade of:

* MoC.sol Disable of mint Leveraged position. See: http://bit.ly/3XPiKUA

**Changer**: [Changer contract at ](https://explorer.rsk.co/address/...?__ctab=Code). 

1. Deploy new MoC.sol implementation:

```js
cd scripts/deploy/upgrade_v0.1.14
truffle exec 1_deploy_MoC.js --network rdocMainnet
```

2. Deploy Changer implementation:

```js
cd scripts/deploy/upgrade_v0.1.14
truffle exec 2_deploy_changer.js --network rdocMainnet
```

You can verify the changer running:

```js
cd scripts/deploy/upgrade_v0.1.14
truffle exec 3_verification_changer.js --network rdocMainnet
```

result

```
Using network 'rdocMainnet'.

Changer contract parameters
OK. Proxy MoC.sol contract:  
OK. Upgrade Delegator:  
OK. New Implementation:  
```

**Proxies**

|  Contract  | Address                                    |  
|:---|:-------------------------------------------|
|  MoC  | [...](https://explorer.rsk.co/address/...) |


**Implementations**

|  Contract  | Address                                                   |  
|:---|:----------------------------------------------------------|
|  MoCHelperLib  | [...](https://explorer.rsk.co/address/...)                |
|  MoC  | [...](https://explorer.rsk.co/address/...?__ctab=general) |

