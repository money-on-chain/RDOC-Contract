import { expect } from "chai";
import { BigNumber } from "ethers";
import { pEth } from "./utils";

export function assertPrec(
  expected: string | number | BigNumber,
  actual: string | number | BigNumber,
  message?: string,
  tolerance = 0,
) {
  if (!BigNumber.isBigNumber(expected)) {
    expected = pEth(expected);
  }
  if (!BigNumber.isBigNumber(actual)) {
    actual = pEth(actual);
  }
  expect(expected, message).to.be.closeTo(actual, tolerance);
}
