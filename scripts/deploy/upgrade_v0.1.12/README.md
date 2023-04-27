# Upgrade version v0.1.12

This release include the upgrade of:

* MoC Token added to use in the platform to pay commissions alternative to RBTC.
* Added MoC Token price provider from exchange.
* Added MoC Vendors to platform
* Added Protected State. If Global Coverage < 1.5 no operations allowed. Except btcx mint and redeem operations.
* Disable automatic liquidation of the contract. Do not automatically liquidate if it falls under the threshold in case of abrupt BTC price fall. With a changer we can disable this protection in order to liquidate the contract.
* Refactor contracts to implement interfaces to avoid circular dependencies, only affect source contract verification.
* Update to use Soldity 0.5.17 with optimizer enabled. To reduce gas used by operations.
* Refactor contracts to reduce their size and to reduce gas used by operations. Also remove functions not used anymore. Burnout contracts
* Refactor dev documentation: https://docs.moneyonchain.com/rdoc-contract/
* New upgrade process. All contracts updated in one change.
* No force upgrade, old compatibility with third parties.
* 10 Contracts updated.

**Batch Upgrade Changer**: [0xC1f1021360E8a04ef63575203964D6fb8815108A](https://explorer.rsk.co/address/0xC1f1021360E8a04ef63575203964D6fb8815108A?__ctab=Code). 

You can verify the changer running:

```js
cd scripts/deploy/upgrade_v0.1.12
truffle exec 11_verification_changer.js --network rdocMainnet
```

return

```
Using network 'rdocMainnet'.

Configuration path:  /home/martin/Proyectos/RDOC_Contract/scripts/deploy/upgrade_v0.1.12/deployConfig-rdocMainnet.json
BatchChanger Deploy at: 0xC1f1021360E8a04ef63575203964D6fb8815108A
Length Data:  24
Length Target:  24
OK! length of arrays
OK! STEP 0. MoC.sol [0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1] Upgrade to implementation [0x0455786d997CD80ff9C3c361c7E8BE525a244D2b].
OK! STEP 1. MoCExchange.sol [0x9497d2AEcd0757Dd4fcb4d5F2131293570FaD305] Upgrade to implementation [0x7adCeff90eB56bA4A92c5e85C0374F63709a5f37].
OK! STEP 2. MoCSettlement.sol [0xb8a6beBa78c3E73f6A66DDacFaEB240ae22Ca709] Upgrade to implementation [0xf48bA91Fd2B8bC1f0Fefa14556C2E629A69A5076].
OK! STEP 3. MoCInrate.sol [0x1DaB07c4FD07d6eE1359a5198ACa2DEe64F371f3] Upgrade to implementation [0x17d04164465850609bf7F52aF869056E2973F833].
OK! STEP 4. MoCState.sol [0x541F68a796Fe5ae3A381d2Aa5a50b975632e40A6] Upgrade to implementation [0x13f424A903b8B2E20DaBd473D8a2Db8b152A6A27].
OK! STEP 5. Prepare moCSettlement.sol execute: [fixTasksPointer()]
OK! STEP 6. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(1, 1000000000000000)]
OK! STEP 7. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(2, 1000000000000000)]
OK! STEP 8. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(3, 1000000000000000)]
OK! STEP 9. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(4, 1000000000000000)]
OK! STEP 10. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(5, 1000000000000000)]
OK! STEP 11. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(6, 1000000000000000)]
OK! STEP 12. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(7, 500000000000000)]
OK! STEP 13. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(8, 500000000000000)]
OK! STEP 14. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(9, 500000000000000)]
OK! STEP 15. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(10, 500000000000000)]
OK! STEP 16. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(11, 500000000000000)]
OK! STEP 17. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(12, 500000000000000)]
OK! STEP 18. Prepare MoCInrate.sol execute: [setCommissionsAddress(0x4C42DBa2a88D4ecc97aA7F28Ced17b4e60523201)]
OK! STEP 19. Prepare moCState.sol execute: [setMoCPriceProvider(0x72835fDc4F73cb33b1E7e03bFe067AAfED2BDB9C)]
OK! STEP 20. Prepare moCState.sol execute: [setMoCToken(0x9AC7fE28967B30E3A4e6e03286d715b42B453D10)]
OK! STEP 21. Prepare moCState.sol execute: [setMoCVendors(0x581C819c48ed1a6c716A736361001B53D54A0a80)]
OK! STEP 22. Prepare moCState.sol execute: [setLiquidationEnabled(false)]
OK! STEP 23. Prepare moCState.sol execute: [setProtected(1.5)]
Executing test governor execute change
```

**Proxies**

|  Contract  |  Address |  
|:---|:---|
|  MoC  | [0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1](https://explorer.rsk.co/address/0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1) |
|  MoCConnector  | [0xA0e2554E525B34FD186C2C356C93d563541b02C0](https://explorer.rsk.co/address/0xA0e2554E525B34FD186C2C356C93d563541b02C0?__ctab=general) |
|  MoCSettlement  | [0xb8a6beBa78c3E73f6A66DDacFaEB240ae22Ca709](https://explorer.rsk.co/address/0xb8a6beBa78c3E73f6A66DDacFaEB240ae22Ca709?__ctab=general) |
|  MocState  | [0x541F68a796Fe5ae3A381d2Aa5a50b975632e40A6](https://explorer.rsk.co/address/0x541F68a796Fe5ae3A381d2Aa5a50b975632e40A6) |
|  MocExchange  | [0x9497d2AEcd0757Dd4fcb4d5F2131293570FaD305](https://explorer.rsk.co/address/0x9497d2AEcd0757Dd4fcb4d5F2131293570FaD305) |
|  MocInrate  | [0x1DaB07c4FD07d6eE1359a5198ACa2DEe64F371f3](https://explorer.rsk.co/address/0x1DaB07c4FD07d6eE1359a5198ACa2DEe64F371f3) |
|  MoCVendors  | [0x581C819c48ed1a6c716A736361001B53D54A0a80](https://explorer.rsk.co/address/0x581C819c48ed1a6c716A736361001B53D54A0a80) |
|  CommissionSplitter  | [0x4C42DBa2a88D4ecc97aA7F28Ced17b4e60523201](https://explorer.rsk.co/address/0x4C42DBa2a88D4ecc97aA7F28Ced17b4e60523201) |



**Implementations**

|  Contract  |  Address |  
|:---|:---|
|  MoCHelperLib  | [0x166bFCaAA5279E60D0aBF9Eb11884AB28aD87D83](https://explorer.rsk.co/address/0x166bFCaAA5279E60D0aBF9Eb11884AB28aD87D83) |
|  MoC  | [0x0455786d997CD80ff9C3c361c7E8BE525a244D2b](https://explorer.rsk.co/address/0x0455786d997CD80ff9C3c361c7E8BE525a244D2b?__ctab=general) |
|  MoCSettlement  | [0xf48bA91Fd2B8bC1f0Fefa14556C2E629A69A5076](https://explorer.rsk.co/address/0xf48bA91Fd2B8bC1f0Fefa14556C2E629A69A5076?__ctab=general) |
|  MocState  | [0x13f424A903b8B2E20DaBd473D8a2Db8b152A6A27](https://explorer.rsk.co/address/0x13f424A903b8B2E20DaBd473D8a2Db8b152A6A27) |
|  MocExchange  | [0x7adCeff90eB56bA4A92c5e85C0374F63709a5f37](https://explorer.rsk.co/address/0x7adCeff90eB56bA4A92c5e85C0374F63709a5f37?__ctab=Code) |
|  MocInrate  | [0x17d04164465850609bf7F52aF869056E2973F833](https://explorer.rsk.co/address/0x17d04164465850609bf7F52aF869056E2973F833) |
|  MoCVendors  | [0x25e7CE9cA7a09086a7e47D7bF0dC3B5Bfa9f503D](https://explorer.rsk.co/address/0x25e7CE9cA7a09086a7e47D7bF0dC3B5Bfa9f503D) |
|  CommissionSplitter  | [0x166bFCaAA5279E60D0aBF9Eb11884AB28aD87D83](https://explorer.rsk.co/address/0x166bFCaAA5279E60D0aBF9Eb11884AB28aD87D83) |
|  MoCPriceProvider  | [0x72835fDc4F73cb33b1E7e03bFe067AAfED2BDB9C](https://explorer.rsk.co/address/0x72835fDc4F73cb33b1E7e03bFe067AAfED2BDB9C) |
|  MoCToken  | [0x9AC7fE28967B30E3A4e6e03286d715b42B453D10](https://explorer.rsk.co/address/0x9AC7fE28967B30E3A4e6e03286d715b42B453D10) |


