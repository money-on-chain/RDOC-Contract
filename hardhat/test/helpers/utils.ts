import { ethers } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";
import MocRifCompiled from "../../dependencies/mocV2Imports/MocRif.json";
import MocCoreExpansionCompiled from "../../dependencies/mocV2Imports/MocCoreExpansion.json";
import MocQueueCompiled from "../../dependencies/mocV2Imports/MocQueue.json";
import MocVendorsCompiled from "../../dependencies/mocV2Imports/MocVendors.json";
import FCMaxAbsoluteOpProviderCompiled from "../../dependencies/mocV2Imports/FCMaxAbsoluteOpProvider.json";
import FCMaxOpDifferenceProviderCompiled from "../../dependencies/mocV2Imports/FCMaxOpDifferenceProvider.json";

import {
  MocRif,
  MocCoreExpansion,
  MocCoreExpansion__factory,
  MocRif__factory,
  MocQueue,
  MocQueue__factory,
  MocVendors,
  MocVendors__factory,
  FCMaxAbsoluteOpProvider,
  FCMaxAbsoluteOpProvider__factory,
  FCMaxOpDifferenceProvider,
  FCMaxOpDifferenceProvider__factory,
} from "../../typechain";

export const gasLimit = 6800000;
export type Balance = BigNumber;

export const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
export const BURNER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("BURNER_ROLE"));
export const EXECUTOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EXECUTOR_ROLE"));

export const deployUUPSProxy = async (contract: string, typechain: any) => {
  const MocImplementationFactory = await ethers.getContractFactory(contract);
  const mocImplementation = await MocImplementationFactory.deploy();
  const ProxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await ProxyFactory.deploy(mocImplementation.address, "0x");
  return typechain.connect(proxy.address, ethers.provider.getSigner());
};

export const deployMocRifV2 = async (
  stopperAddress: string,
): Promise<{
  mocRifV2: MocRif;
  mocCoreExpansion: MocCoreExpansion;
  mocQueue: MocQueue;
  mocVendorsV2: MocVendors;
  maxAbsoluteOpProvider: FCMaxAbsoluteOpProvider;
  maxOpDiffProvider: FCMaxOpDifferenceProvider;
}> => {
  const MocImplementationFactory = await ethers.getContractFactory(MocRifCompiled.abi, MocRifCompiled.bytecode);
  const mocImplementation = await MocImplementationFactory.deploy();
  const ProxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const mocProxy = await ProxyFactory.deploy(mocImplementation.address, "0x");

  const MocCoreExpansionFactory = await ethers.getContractFactory(
    MocCoreExpansionCompiled.abi,
    MocCoreExpansionCompiled.bytecode,
  );
  const mocCoreExpansion = await MocCoreExpansionFactory.deploy();

  const MocQueueFactory = await ethers.getContractFactory(MocQueueCompiled.abi, MocQueueCompiled.bytecode);
  const mocQueueImplementation = await MocQueueFactory.deploy();
  const mocQueueProxy = await ProxyFactory.deploy(mocQueueImplementation.address, "0x");

  const MocVendorsFactory = await ethers.getContractFactory(MocVendorsCompiled.abi, MocVendorsCompiled.bytecode);
  const mocVendors = await MocVendorsFactory.deploy();
  const vendorsProxy = await ProxyFactory.deploy(mocVendors.address, "0x");

  const FCMaxAbsoluteOpProvider = await ethers.getContractFactory(
    FCMaxAbsoluteOpProviderCompiled.abi,
    FCMaxAbsoluteOpProviderCompiled.bytecode,
  );
  const maxAbsoluteOpProvider = await FCMaxAbsoluteOpProvider.deploy(stopperAddress);
  const FCMaxOpDifferenceProvider = await ethers.getContractFactory(
    FCMaxOpDifferenceProviderCompiled.abi,
    FCMaxOpDifferenceProviderCompiled.bytecode,
  );
  const maxOpDiffProvider = await FCMaxOpDifferenceProvider.deploy(stopperAddress);
  return {
    mocRifV2: MocRif__factory.connect(mocProxy.address, ethers.provider.getSigner()),
    mocCoreExpansion: MocCoreExpansion__factory.connect(mocCoreExpansion.address, ethers.provider.getSigner()),
    mocQueue: MocQueue__factory.connect(mocQueueProxy.address, ethers.provider.getSigner()),
    mocVendorsV2: MocVendors__factory.connect(vendorsProxy.address, ethers.provider.getSigner()),
    maxAbsoluteOpProvider: FCMaxAbsoluteOpProvider__factory.connect(
      maxAbsoluteOpProvider.address,
      ethers.provider.getSigner(),
    ),
    maxOpDiffProvider: FCMaxOpDifferenceProvider__factory.connect(
      maxOpDiffProvider.address,
      ethers.provider.getSigner(),
    ),
  };
};

export const deployTransparentProxy = async (contract: string, proxyAdmin: string, typechain: any, libraries?: any) => {
  const MocImplementationFactory = await ethers.getContractFactory(contract, libraries);
  const mocImplementation = await MocImplementationFactory.deploy();
  const ProxyFactory = await ethers.getContractFactory("AdminUpgradeabilityProxy");
  const proxy = await ProxyFactory.deploy(mocImplementation.address, proxyAdmin, "0x");
  return typechain.connect(proxy.address, ethers.provider.getSigner());
};

export const deployContract = async (contract: string, typechain: any, args: any[], libraries?: any) => {
  const MocImplementationFactory = await ethers.getContractFactory(contract, libraries);
  const mocImplementation = await MocImplementationFactory.deploy(...args);
  if (typechain) return typechain.connect(mocImplementation.address, ethers.provider.getSigner());
  return mocImplementation.address;
};

export function pEth(eth: string | number): BigNumber {
  let ethStr: string;
  if (typeof eth === "number") ethStr = eth.toLocaleString("fullwide", { useGrouping: false }).replace(",", ".");
  else ethStr = eth;
  return ethers.utils.parseEther(ethStr);
}

export const CONSTANTS = {
  ZERO_ADDRESS: ethers.constants.AddressZero,
  DUMMY_ADDRESS: ethers.constants.AddressZero.slice(0, -1) + 1,
  MAX_UINT256: ethers.constants.MaxUint256,
  MAX_BALANCE: ethers.constants.MaxUint256.div((1e17).toString()),
  PRECISION: BigNumber.from((1e18).toString()),
  ONE: BigNumber.from((1e18).toString()),
  EXEC_FEE: 100,
};

export const baseParams = {
  reservePrice: pEth(10000), // mocPrecision
  mocPrice: pEth(10000), // mocPrecision
  smoothingFactor: pEth(0.01653), // coefficientPrecision
  c0Cobj: pEth(3), // mocPrecision
  x2Cobj: pEth(2), // mocPrecision
  liq: pEth(1.04), // mocPrecision
  utpdu: pEth(2), // mocPrecision
  maxDiscountRate: pEth(50), // mocPrecision

  settlementBlockSpan: 10,
  dayBlockSpan: 4 * 60 * 24,
  riskProxTmin: pEth(0), // mocPrecision
  riskProxTmax: pEth("0.0002611578760678"), // mocPrecision
  riskProxPower: pEth(1),
  riskProRate: pEth("0.000047945"), // mocPrecision -- weekly 0.0025 / 365 * 7
  emaBlockSpan: pEth(40),
  // commissionRate: pEth(0 * 10 ** 18), // mocPrecision
  peg: pEth(1),

  maxMintRiskPro: pEth(10000000),
  stableTmin: pEth(0),
  stableTmax: pEth("0.0002611578760678"),
  stablePower: pEth(1),
  mocProportion: pEth(0.01), // mocPrecision

  liquidationEnabled: false,
  _protected: pEth(1.5), // mocPrecision

  startStoppable: true,
};
