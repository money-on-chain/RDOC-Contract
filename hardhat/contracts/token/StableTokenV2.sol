// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "./MocRC20.sol";

contract StableTokenV2 is MocRC20 {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
}
