# Official RIF On Chain ABIs

In the RIF On Chain repository you can find the [official ABIs of the platform](https://github.com/money-on-chain/RDOC-Contract/tree/master/abis). You can use them to build your own decentralized applications to invoke the functions of smart contracts.

We can also compile the contracts to generate the ABIS that will be saved in the _./build/contracts_
dir. You can do this with the following commands:

```
git clone https://github.com/money-on-chain/RDOC-Contract.git
cd RDOC-Contract
npm install
npm run truffle-compile
```

Then we can check the abis

```
cd build/contracts/
ls -la
```

```
drwxrwxr-x 2 user user    4096 abr 24 18:15 .
drwxrwxr-x 3 user user    4096 abr 24 18:15 ..
-rw-rw-r-- 1 user user   58622 abr 24 18:15 AdminUpgradeabilityProxy.json
-rw-rw-r-- 1 user user  172799 abr 24 18:15 BaseAdminUpgradeabilityProxy.json
-rw-rw-r-- 1 user user   62097 abr 24 18:15 BaseUpgradeabilityProxy.json
...
```
