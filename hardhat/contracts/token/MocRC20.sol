// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "../interfaces/IMocRC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../governance/Governed.sol";

/**
 * @title MocRC20
 * @notice Base Moc ERC20 Token: burn, mint. It can be both Pegs and Collateral Tokens.
 * @dev ERC20 like token that allows roles allowed contracts to mint and burn (destroyed) any token.
 */
contract MocRC20 is IMocRC20, AccessControlEnumerableUpgradeable, ERC20Upgradeable, UUPSUpgradeable, Governed {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * See {__MocRC20_init}.
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        address admin_,
        IGovernor governor_
    ) external virtual initializer {
        __MocRC20_init(name_, symbol_, admin_, governor_);
    }

    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` & `BURNER_ROLE` to `admin` address.
     *
     * See {ERC20_init}.
     */
    function __MocRC20_init(
        string memory name_,
        string memory symbol_,
        address admin_,
        IGovernor governor_
    ) internal onlyInitializing {
        __ERC20_init(name_, symbol_);
        __AccessControlEnumerable_init();
        __UUPSUpgradeable_init();
        __Governed_init(address(governor_));

        _setupRole(DEFAULT_ADMIN_ROLE, admin_);
        _setupRole(MINTER_ROLE, admin_);
        _setupRole(BURNER_ROLE, admin_);
    }

    /* solhint-disable-next-line no-empty-blocks */
    function _authorizeUpgrade(address newImplementation) internal override onlyAuthorizedChanger {}

    /**
     * @dev Creates `amount` new tokens for `to`.
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 amount) external virtual onlyRole(MINTER_ROLE) returns (bool) {
        _mint(to, amount);
        return true;
    }

    /**
     * @dev Burns a specific `amount` of tokens for `to`.
     * * See {ERC20-_burn}.
     * Requirements:
     *
     * - the caller must have the `BURNER_ROLE`.
     */
    function burn(address to, uint256 amount) external virtual onlyRole(BURNER_ROLE) returns (bool) {
        _burn(to, amount);
        return true;
    }

    /**
     * @inheritdoc IMocRC20
     */
    function hasFullRoles(address _account) public view virtual override returns (bool) {
        return
            hasRole(MINTER_ROLE, _account) && hasRole(BURNER_ROLE, _account) && hasRole(DEFAULT_ADMIN_ROLE, _account);
    }
}
