// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

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
    function mint(address to, uint256 amount) external;

    /**
     * @dev Burns a specific `amount` of tokens for `to`.
     * * See {ERC20-_burn}.
     */
    function burn(address to, uint256 amount) external;

    /**
     * @dev returns true if the `_account` address has full control over this token
     * @param _account the address you want to check all roles for
     */
    function hasFullRoles(address _account) external view returns (bool);
}
