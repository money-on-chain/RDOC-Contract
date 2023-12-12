// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "../interfaces/IGovernor.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
  @title Governed
  @notice Base contract to be inherited by governed contracts
  @dev This contract is not usable on its own since it does not have any _productive useful_ behavior
  The only purpose of this contract is to define some useful modifiers and functions to be used on the
  governance aspect of the child contract
  */
abstract contract Governed is Initializable {
    /**
    @notice The address of the contract which governs this one
   */
    IGovernor public governor;

    error NotAuthorizedChanger();

    /**
    @notice Modifier that protects the function
    @dev You should use this modifier in any function that should be called through
    the governance system
   */
    modifier onlyAuthorizedChanger() {
        checkIfAuthorizedChanger();
        _;
    }

    /**
    @notice Initialize the contract with the basic settings
    @dev This initialize replaces the constructor but it is not called automatically.
    It is necessary because of the upgradeability of the contracts
    @param governorAddress_ Governor address
   */
    function __Governed_init(address governorAddress_) internal onlyInitializing {
        __Governed_init_unchained(governorAddress_);
    }

    function __Governed_init_unchained(address governorAddress_) internal onlyInitializing {
        governor = IGovernor(governorAddress_);
    }

    /**
    @notice Change the contract's governor. Should be called through the old governance system
    @param newGovernor_ New governor address
   */
    function changeGovernor(IGovernor newGovernor_) external onlyAuthorizedChanger {
        governor = newGovernor_;
    }

    /**
    @notice Checks if the msg sender is an authorized changer, reverts otherwise
   */
    function checkIfAuthorizedChanger() internal view {
        if (!governor.isAuthorizedChanger(msg.sender)) revert NotAuthorizedChanger();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
