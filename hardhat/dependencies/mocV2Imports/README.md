# MoC V2 Imports

Moc V2 specif contracts are defined on [rif-sc-protocol](https://github.com/money-on-chain/rif-sc-protocol) repository compiled under `/artifacts/contracts/` folder and from node_modules `moc-core` dependency (main MOC Protocol).

The version currently used, is compatible with Releases v1.0.X. Any relevant update on the given target contracts, will required them to be re-compiled and imported again.

Files required from `/artifacts/contracts/`:

- `./MocRif.sol/MocRif.json`
- `./providers/FCMaxAbsoluteOpProvider.sol/FCMaxAbsoluteOpProvider.json`
- `./providers/FCMaxOpDifferenceProvider.sol/FCMaxOpDifferenceProvider.json`

Files required from `node_modules/moc-main/export/artifacts/contracts`:

- `./vendors/MocVendors.sol/MocVendors.json`
- `./queue/MocQueue.sol/MocQueue.json`
- `./core/MocCoreExpansion.sol/MocCoreExpansion.json`
