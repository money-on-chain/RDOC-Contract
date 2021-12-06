# Change current governor to new gobernanza

Deploy the batch changer

```js
cd scripts/deploy/changer_change_governor
export MNEMONIC=YOUR_PK
truffle exec 1_batch_changer.js --network rdocMainnet
```

Verification

```js
cd scripts/deploy/changer_change_governor
truffle exec 2_verification_changer.js --network rdocMainnet
```

return

```
Using network 'rdocMainnet'.

Configuration path:  /home/martin/Proyectos/RDOC_Contract/scripts/deploy/changer_change_governor/deployConfig-rdocMainnet.json
BatchChanger Deploy at: 0xFb511b75e8A633Bc08fbDB477eD825309f06Ba76
Length Data:  7
Length Target:  7
OK! length of arrays
OK! STEP 0. MoC.sol : [ChangeIGovernor(0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08)]
OK! STEP 1. MoCBProxManager.sol : [ChangeIGovernor(0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08)]
OK! STEP 2. MoCSettlement.sol : [ChangeIGovernor(0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08)]
OK! STEP 3. MoCInrate.sol : [ChangeIGovernor(0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08)]
OK! STEP 4. MoCState.sol : [ChangeIGovernor(0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08)]
OK! STEP 5. MoCVendors.sol : [ChangeIGovernor(0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08)]
OK! STEP 6. CommissionSplitter.sol : [ChangeIGovernor(0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08)]

```
