// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "./IChangeContract.sol";

/**
  @title IGovernor
  @notice Governor interface. This functions should be overwritten to
  enable the communication with the rest of the system
  @dev This interface **MUST** be compatible with the corresponding Governance instance
  used on Production, from https://github.com/money-on-chain/Areopagus-Governance
  */
interface IGovernor {
    /**
    @notice Function to be called to make the changes described in changeContract
    @dev This function should be protected somehow to only execute changes that
    benefit the system. This decision process is independent of this architecture
    therefore is independent of this interface too
    @param changeContract_ Address of the contract that will execute the changes
   */
    function executeChange(IChangeContract changeContract_) external;

    /**
    @notice Returns whether this `changer_` is authorized to execute changes.
    @param changer_ Address of the contract that will execute the changes
   */
    function isAuthorizedChanger(address changer_) external view returns (bool);
}
