// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/**
 * @title IMocRC20
 * @notice Base Moc ERC20 Token Interface: burn, mint. It can be both Pegs and Collateral Tokens.
 */
interface IMocRC20 is IERC20Upgradeable {
    /**
     * @dev Creates `amount` new tokens for `to`.
     * See {ERC20-_mint}.
     */
    function mint(address to, uint256 amount) external returns (bool);

    /**
     * @dev Burns a specific `amount` of tokens for `to`.
     * * See {ERC20-_burn}.
     */
    function burn(address to, uint256 amount) external;
}
