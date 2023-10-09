import { Address } from "hardhat-deploy/types";
import {
  MoC,
  MoC__factory,
  StopperV2,
  StopperV2__factory,
  FluxCapacitorChanger,
  FluxCapacitorChanger__factory,
  MoCExchange__factory,
  MoCExchange,
} from "../../../typechain";
import { deployContract, pEth } from "../../helpers/utils";

export const deployChanger = async (
  mocHelperLibAddress: Address,
  upgradeDelegator: Address,
  mocProxy: Address,
  maxAbsoluteOperation: number,
  maxOperationalDifference: number,
  decayBlockSpan: number,
): Promise<{
  moc: MoC;
  stopper: StopperV2;
  changer: FluxCapacitorChanger;
}> => {
  // deploy MoC
  const moc: MoC = await deployContract("MoC", MoC__factory, []);
  // deploy MoCExchange
  const mocExchange: MoCExchange = await deployContract("MoCExchange", MoCExchange__factory, [], {
    libraries: { MoCHelperLib: mocHelperLibAddress },
  });
  // deploy Stopper
  const stopper: StopperV2 = await deployContract("StopperV2", StopperV2__factory, []);
  const changer: FluxCapacitorChanger = await deployContract("FluxCapacitorChanger", FluxCapacitorChanger__factory, [
    upgradeDelegator,
    mocProxy,
    moc.address,
    mocExchange.address,
    stopper.address,
    pEth(maxAbsoluteOperation),
    pEth(maxOperationalDifference),
    decayBlockSpan,
  ]);
  return {
    moc,
    stopper,
    changer,
  };
};
