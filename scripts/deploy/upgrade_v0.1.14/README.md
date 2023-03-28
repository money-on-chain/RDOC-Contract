# Upgrade version v0.1.14 - Disable of mint leveraged position

This release include the upgrade of:

* MoC.sol Disable of mint Leveraged position. See: http://bit.ly/3XPiKUA

**Changer**: [Changer contract at 0x8f0Cb984392858a930583e0da8DC0980EF8f40F5](https://explorer.rsk.co/address/0x8f0Cb984392858a930583e0da8DC0980EF8f40F5?__ctab=Code). 

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
OK. Proxy MoC.sol contract:  0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1
OK. Upgrade Delegator:  0x5cE577f6Ec969CE9a282838D350206C52A6F338C
OK. New Implementation:  0xc75a3a1E829dF4A8b8944C1Ae213CE527BC63A2D
  
```

**Proxies**

|  Contract  | Address                                    |  
|:---|:-------------------------------------------|
|  MoC  | [0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1](https://explorer.rsk.co/address/0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1) |


**Implementations**

|  Contract  | Address                                                                                                                                     |  
|:---|:--------------------------------------------------------------------------------------------------------------------------------------------|
|  MoCHelperLib  | [0x78b13D2Be1D6cd19E8e9B4bAAfd46d7EfC238434](https://explorer.rsk.co/address/0x78b13D2Be1D6cd19E8e9B4bAAfd46d7EfC238434)                    |
|  MoC  | [0xc75a3a1E829dF4A8b8944C1Ae213CE527BC63A2D](https://explorer.rsk.co/address/0xc75a3a1E829dF4A8b8944C1Ae213CE527BC63A2D?__ctab=general)     |

