// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

/**
  @title IChangeContract
  @notice This interface is the one used by the governance system.
  @dev If you plan to do some changes to a system governed by this project you should write a contract
  that does those changes, like a recipe. This contract MUST not have ANY kind of public or external function
  that modifies the state of this ChangeContract, otherwise you could run into front-running issues when the governance
  system is fully in place.
 */
interface IChangeContract {
    /**
    @notice Override this function with a recipe of the changes to be done when this ChangeContract
    is executed
   */
    function execute() external;
}
