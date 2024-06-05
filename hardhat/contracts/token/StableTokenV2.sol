// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "./MocRC20.sol";
// Import to allow compilation and deploy of ERC1967Proxy
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract StableTokenV2 is MocRC20 {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
}
