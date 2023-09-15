/*
Copyright MOC Investments Corp. 2020. All rights reserved.

You acknowledge and agree that MOC Investments Corp. (“MOC”) (or MOC’s licensors) own all legal right, title and interest in and to the work, software, application, source code, documentation and any other documents in this repository (collectively, the “Program”), including any intellectual property rights which subsist in the Program (whether those rights happen to be registered or not, and wherever in the world those rights may exist), whether in source code or any other form.

Subject to the limited license below, you may not (and you may not permit anyone else to) distribute, publish, copy, modify, merge, combine with another program, create derivative works of, reverse engineer, decompile or otherwise attempt to extract the source code of, the Program or any part thereof, except that you may contribute to this repository.

You are granted a non-exclusive, non-transferable, non-sublicensable license to distribute, publish, copy, modify, merge, combine with another program or create derivative works of the Program (such resulting program, collectively, the “Resulting Program”) solely for Non-Commercial Use as long as you:
 1. give prominent notice (“Notice”) with each copy of the Resulting Program that the Program is used in the Resulting Program and that the Program is the copyright of MOC Investments Corp.; and
 2. subject the Resulting Program and any distribution, publication, copy, modification, merger therewith, combination with another program or derivative works thereof to the same Notice requirement and Non-Commercial Use restriction set forth herein.

“Non-Commercial Use” means each use as described in clauses (1)-(3) below, as reasonably determined by MOC Investments Corp. in its sole discretion:
 1. personal use for research, personal study, private entertainment, hobby projects or amateur pursuits, in each case without any anticipated commercial application;
 2. use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization or government institution; or
 3. the number of monthly active users of the Resulting Program across all versions thereof and platforms globally do not exceed 100 at any time.

You will not use any trade mark, service mark, trade name, logo of MOC Investments Corp. or any other company or organization in a way that is likely or intended to cause confusion about the owner or authorized user of such marks, names or logos.

If you have any questions, comments or interest in pursuing any other use cases, please reach out to us at moc.license@moneyonchain.com.

*/

pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;






/**
 * @title Proxy
 * @dev Implements delegation of calls to other contracts, with proper
 * forwarding of return values and bubbling of failures.
 * It defines a fallback function that delegates all calls to the address
 * returned by the abstract _implementation() internal function.
 */
contract Proxy {
  /**
   * @dev Fallback function.
   * Implemented entirely in `_fallback`.
   */
  function () payable external {
    _fallback();
  }

  /**
   * @return The Address of the implementation.
   */
  function _implementation() internal view returns (address);

  /**
   * @dev Delegates execution to an implementation contract.
   * This is a low level function that doesn't return to its internal call site.
   * It will return to the external caller whatever the implementation returns.
   * @param implementation Address to delegate.
   */
  function _delegate(address implementation) internal {
    assembly {
      // Copy msg.data. We take full control of memory in this inline assembly
      // block because it will not return to Solidity code. We overwrite the
      // Solidity scratch pad at memory position 0.
      calldatacopy(0, 0, calldatasize)

      // Call the implementation.
      // out and outsize are 0 because we don't know the size yet.
      let result := delegatecall(gas, implementation, 0, calldatasize, 0, 0)

      // Copy the returned data.
      returndatacopy(0, 0, returndatasize)

      switch result
      // delegatecall returns 0 on error.
      case 0 { revert(0, returndatasize) }
      default { return(0, returndatasize) }
    }
  }

  /**
   * @dev Function that is run as the first thing in the fallback function.
   * Can be redefined in derived contracts to add functionality.
   * Redefinitions must call super._willFallback().
   */
  function _willFallback() internal {
  }

  /**
   * @dev fallback implementation.
   * Extracted to enable manual triggering.
   */
  function _fallback() internal {
    _willFallback();
    _delegate(_implementation());
  }
}


/**
 * Utility library of inline functions on addresses
 *
 * Source https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-solidity/v2.1.3/contracts/utils/Address.sol
 * This contract is copied here and renamed from the original to avoid clashes in the compiled artifacts
 * when the user imports a zos-lib contract (that transitively causes this contract to be compiled and added to the
 * build/artifacts folder) as well as the vanilla Address implementation from an openzeppelin version.
 */
library ZOSLibAddress {
    /**
     * Returns whether the target address is a contract
     * @dev This function will return false if invoked during the constructor of a contract,
     * as the code is not actually created until after the constructor finishes.
     * @param account address of the account to check
     * @return whether the target address is a contract
     */
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        // XXX Currently there is no better way to check if there is a contract in an address
        // than to check the size of the code at that address.
        // See https://ethereum.stackexchange.com/a/14016/36603
        // for more details about how this works.
        // TODO Check this again before the Serenity release, because all addresses will be
        // contracts then.
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}

/**
 * @title BaseUpgradeabilityProxy
 * @dev This contract implements a proxy that allows to change the
 * implementation address to which it will delegate.
 * Such a change is called an implementation upgrade.
 */
contract BaseUpgradeabilityProxy is Proxy {
  /**
   * @dev Emitted when the implementation is upgraded.
   * @param implementation Address of the new implementation.
   */
  event Upgraded(address indexed implementation);

  /**
   * @dev Storage slot with the address of the current implementation.
   * This is the keccak-256 hash of "org.zeppelinos.proxy.implementation", and is
   * validated in the constructor.
   */
  bytes32 internal constant IMPLEMENTATION_SLOT = 0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3;

  /**
   * @dev Returns the current implementation.
   * @return Address of the current implementation
   */
  function _implementation() internal view returns (address impl) {
    bytes32 slot = IMPLEMENTATION_SLOT;
    assembly {
      impl := sload(slot)
    }
  }

  /**
   * @dev Upgrades the proxy to a new implementation.
   * @param newImplementation Address of the new implementation.
   */
  function _upgradeTo(address newImplementation) internal {
    _setImplementation(newImplementation);
    emit Upgraded(newImplementation);
  }

  /**
   * @dev Sets the implementation address of the proxy.
   * @param newImplementation Address of the new implementation.
   */
  function _setImplementation(address newImplementation) internal {
    require(ZOSLibAddress.isContract(newImplementation), "Cannot set a proxy implementation to a non-contract address");

    bytes32 slot = IMPLEMENTATION_SLOT;

    assembly {
      sstore(slot, newImplementation)
    }
  }
}


/**
 * @title UpgradeabilityProxy
 * @dev Extends BaseUpgradeabilityProxy with a constructor for initializing
 * implementation and init data.
 */
contract UpgradeabilityProxy is BaseUpgradeabilityProxy {
  /**
   * @dev Contract constructor.
   * @param _logic Address of the initial implementation.
   * @param _data Data to send as msg.data to the implementation to initialize the proxied contract.
   * It should include the signature and the parameters of the function to be called, as described in
   * https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding.
   * This parameter is optional, if no data is given the initialization call to proxied contract will be skipped.
   */
  constructor(address _logic, bytes memory _data) public payable {
    assert(IMPLEMENTATION_SLOT == keccak256("org.zeppelinos.proxy.implementation"));
    _setImplementation(_logic);
    if(_data.length > 0) {
      (bool success,) = _logic.delegatecall(_data);
      require(success);
    }
  }  
}


/**
 * @title BaseAdminUpgradeabilityProxy
 * @dev This contract combines an upgradeability proxy with an authorization
 * mechanism for administrative tasks.
 * All external functions in this contract must be guarded by the
 * `ifAdmin` modifier. See ethereum/solidity#3864 for a Solidity
 * feature proposal that would enable this to be done automatically.
 */
contract BaseAdminUpgradeabilityProxy is BaseUpgradeabilityProxy {
  /**
   * @dev Emitted when the administration has been transferred.
   * @param previousAdmin Address of the previous admin.
   * @param newAdmin Address of the new admin.
   */
  event AdminChanged(address previousAdmin, address newAdmin);

  /**
   * @dev Storage slot with the admin of the contract.
   * This is the keccak-256 hash of "org.zeppelinos.proxy.admin", and is
   * validated in the constructor.
   */
  bytes32 internal constant ADMIN_SLOT = 0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b;

  /**
   * @dev Modifier to check whether the `msg.sender` is the admin.
   * If it is, it will run the function. Otherwise, it will delegate the call
   * to the implementation.
   */
  modifier ifAdmin() {
    if (msg.sender == _admin()) {
      _;
    } else {
      _fallback();
    }
  }

  /**
   * @return The address of the proxy admin.
   */
  function admin() external ifAdmin returns (address) {
    return _admin();
  }

  /**
   * @return The address of the implementation.
   */
  function implementation() external ifAdmin returns (address) {
    return _implementation();
  }

  /**
   * @dev Changes the admin of the proxy.
   * Only the current admin can call this function.
   * @param newAdmin Address to transfer proxy administration to.
   */
  function changeAdmin(address newAdmin) external ifAdmin {
    require(newAdmin != address(0), "Cannot change the admin of a proxy to the zero address");
    emit AdminChanged(_admin(), newAdmin);
    _setAdmin(newAdmin);
  }

  /**
   * @dev Upgrade the backing implementation of the proxy.
   * Only the admin can call this function.
   * @param newImplementation Address of the new implementation.
   */
  function upgradeTo(address newImplementation) external ifAdmin {
    _upgradeTo(newImplementation);
  }

  /**
   * @dev Upgrade the backing implementation of the proxy and call a function
   * on the new implementation.
   * This is useful to initialize the proxied contract.
   * @param newImplementation Address of the new implementation.
   * @param data Data to send as msg.data in the low level call.
   * It should include the signature and the parameters of the function to be called, as described in
   * https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding.
   */
  function upgradeToAndCall(address newImplementation, bytes calldata data) payable external ifAdmin {
    _upgradeTo(newImplementation);
    (bool success,) = newImplementation.delegatecall(data);
    require(success);
  }

  /**
   * @return The admin slot.
   */
  function _admin() internal view returns (address adm) {
    bytes32 slot = ADMIN_SLOT;
    assembly {
      adm := sload(slot)
    }
  }

  /**
   * @dev Sets the address of the proxy admin.
   * @param newAdmin Address of the new proxy admin.
   */
  function _setAdmin(address newAdmin) internal {
    bytes32 slot = ADMIN_SLOT;

    assembly {
      sstore(slot, newAdmin)
    }
  }

  /**
   * @dev Only fall back when the sender is not the admin.
   */
  function _willFallback() internal {
    require(msg.sender != _admin(), "Cannot call fallback function from the proxy admin");
    super._willFallback();
  }
}


/**
 * @title AdminUpgradeabilityProxy
 * @dev Extends from BaseAdminUpgradeabilityProxy with a constructor for 
 * initializing the implementation, admin, and init data.
 */
contract AdminUpgradeabilityProxy is BaseAdminUpgradeabilityProxy, UpgradeabilityProxy {
  /**
   * Contract constructor.
   * @param _logic address of the initial implementation.
   * @param _admin Address of the proxy administrator.
   * @param _data Data to send as msg.data to the implementation to initialize the proxied contract.
   * It should include the signature and the parameters of the function to be called, as described in
   * https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding.
   * This parameter is optional, if no data is given the initialization call to proxied contract will be skipped.
   */
  constructor(address _logic, address _admin, bytes memory _data) UpgradeabilityProxy(_logic, _data) public payable {
    assert(ADMIN_SLOT == keccak256("org.zeppelinos.proxy.admin"));
    _setAdmin(_admin);
  }
}


/**
  @title ChangeContract
  @notice This interface is the one used by the governance system.
  @dev If you plan to do some changes to a system governed by this project you should write a contract
  that does those changes, like a recipe. This contract MUST not have ANY kind of public or external function
  that modifies the state of this ChangeContract, otherwise you could run into front-running issues when the governance
  system is fully in place.
 */
interface ChangeContract {

  /**
    @notice Override this function with a recipe of the changes to be done when this ChangeContract
    is executed
   */
  function execute() external;
}




/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 *
 * Source https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-solidity/v2.1.3/contracts/ownership/Ownable.sol
 * This contract is copied here and renamed from the original to avoid clashes in the compiled artifacts
 * when the user imports a zos-lib contract (that transitively causes this contract to be compiled and added to the
 * build/artifacts folder) as well as the vanilla Ownable implementation from an openzeppelin version.
 */
contract ZOSLibOwnable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor () internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @return the address of the owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/**
 * @title ProxyAdmin
 * @dev This contract is the admin of a proxy, and is in charge
 * of upgrading it as well as transferring it to another admin.
 */
contract ProxyAdmin is ZOSLibOwnable {
  
  /**
   * @dev Returns the current implementation of a proxy.
   * This is needed because only the proxy admin can query it.
   * @return The address of the current implementation of the proxy.
   */
  function getProxyImplementation(AdminUpgradeabilityProxy proxy) public view returns (address) {
    // We need to manually run the static call since the getter cannot be flagged as view
    // bytes4(keccak256("implementation()")) == 0x5c60da1b
    (bool success, bytes memory returndata) = address(proxy).staticcall(hex"5c60da1b");
    require(success);
    return abi.decode(returndata, (address));
  }

  /**
   * @dev Returns the admin of a proxy. Only the admin can query it.
   * @return The address of the current admin of the proxy.
   */
  function getProxyAdmin(AdminUpgradeabilityProxy proxy) public view returns (address) {
    // We need to manually run the static call since the getter cannot be flagged as view
    // bytes4(keccak256("admin()")) == 0xf851a440
    (bool success, bytes memory returndata) = address(proxy).staticcall(hex"f851a440");
    require(success);
    return abi.decode(returndata, (address));
  }

  /**
   * @dev Changes the admin of a proxy.
   * @param proxy Proxy to change admin.
   * @param newAdmin Address to transfer proxy administration to.
   */
  function changeProxyAdmin(AdminUpgradeabilityProxy proxy, address newAdmin) public onlyOwner {
    proxy.changeAdmin(newAdmin);
  }

  /**
   * @dev Upgrades a proxy to the newest implementation of a contract.
   * @param proxy Proxy to be upgraded.
   * @param implementation the address of the Implementation.
   */
  function upgrade(AdminUpgradeabilityProxy proxy, address implementation) public onlyOwner {
    proxy.upgradeTo(implementation);
  }

  /**
   * @dev Upgrades a proxy to the newest implementation of a contract and forwards a function call to it.
   * This is useful to initialize the proxied contract.
   * @param proxy Proxy to be upgraded.
   * @param implementation Address of the Implementation.
   * @param data Data to send as msg.data in the low level call.
   * It should include the signature and the parameters of the function to be called, as described in
   * https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding.
   */
  function upgradeAndCall(AdminUpgradeabilityProxy proxy, address implementation, bytes memory data) payable public onlyOwner {
    proxy.upgradeToAndCall.value(msg.value)(implementation, data);
  }
}




/**
  @title Governor
  @notice Governor interface. This functions should be overwritten to
  enable the comunnication with the rest of the system
  */
interface IGovernor{

  /**
    @notice Function to be called to make the changes in changeContract
    @dev This function should be protected somehow to only execute changes that
    benefit the system. This decision process is independent of this architechture
    therefore is independent of this interface too
    @param changeContract Address of the contract that will execute the changes
   */
  function executeChange(ChangeContract changeContract) external;

  /**
    @notice Function to be called to make the changes in changeContract
    @param _changer Address of the contract that will execute the changes
   */
  function isAuthorizedChanger(address _changer) external view returns (bool);
}



/**
 * @title Initializable
 *
 * @dev Helper contract to support initializer functions. To use it, replace
 * the constructor with a function that has the `initializer` modifier.
 * WARNING: Unlike constructors, initializer functions must be manually
 * invoked. This applies both to deploying an Initializable contract, as well
 * as extending an Initializable contract via inheritance.
 * WARNING: When used with inheritance, manual care must be taken to not invoke
 * a parent initializer twice, or ensure that all initializers are idempotent,
 * because this is not dealt with automatically as with constructors.
 */
contract Initializable {

  /**
   * @dev Indicates that the contract has been initialized.
   */
  bool private initialized;

  /**
   * @dev Indicates that the contract is in the process of being initialized.
   */
  bool private initializing;

  /**
   * @dev Modifier to use in the initializer function of a contract.
   */
  modifier initializer() {
    require(initializing || isConstructor() || !initialized, "Contract instance has already been initialized");

    bool isTopLevelCall = !initializing;
    if (isTopLevelCall) {
      initializing = true;
      initialized = true;
    }

    _;

    if (isTopLevelCall) {
      initializing = false;
    }
  }

  /// @dev Returns true if and only if the function is running in the constructor
  function isConstructor() private view returns (bool) {
    // extcodesize checks the size of the code stored in an address, and
    // address returns the current address. Since the code is still not
    // deployed when running a constructor, any checks on its code size will
    // yield zero, making it an effective way to detect if a contract is
    // under construction or not.
    uint256 cs;
    assembly { cs := extcodesize(address) }
    return cs == 0;
  }

  // Reserved storage space to allow for layout changes in the future.
  uint256[50] private ______gap;
}


/**
  @title Governed
  @notice Base contract to be inherited by governed contracts
  @dev This contract is not usable on its own since it does not have any _productive useful_ behaviour
  The only purpose of this contract is to define some useful modifiers and functions to be used on the
  governance aspect of the child contract
  */
contract Governed is Initializable {

  /**
    @notice The address of the contract which governs this one
   */
  IGovernor public governor;

  string constant private NOT_AUTHORIZED_CHANGER = "not_authorized_changer";

  /**
    @notice Modifier that protects the function
    @dev You should use this modifier in any function that should be called through
    the governance system
   */
  modifier onlyAuthorizedChanger() {
    require(governor.isAuthorizedChanger(msg.sender), NOT_AUTHORIZED_CHANGER);
    _;
  }

  /**
    @notice Initialize the contract with the basic settings
    @dev This initialize replaces the constructor but it is not called automatically.
    It is necessary because of the upgradeability of the contracts
    @param _governor Governor address
   */
  function initialize(IGovernor _governor) public initializer {
    governor = _governor;
  }

  /**
    @notice Change the contract's governor. Should be called through the old governance system
    @param newIGovernor New governor address
   */
  function changeIGovernor(IGovernor newIGovernor) public onlyAuthorizedChanger {
    governor = newIGovernor;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


/**
  @title UpgradeDelegator
  @notice Dispatches to the proxyAdmin any call made through the governance system
  @dev Adapter between our governance system and the zeppelinOS proxyAdmin. This is
  needed to be able to upgrade governance through the same system

 */
contract UpgradeDelegator is Governed {
  ProxyAdmin public proxyAdmin;

  /**
    @notice Initialize the contract with the basic settings
    @dev This initialize replaces the constructor but it is not called automatically.
    It is necessary because of the upgradeability of the contracts
    @param _governor Governor address of this system
    @param _proxyAdmin ProxyAdmin that we will forward the call to
   */
  function initialize(IGovernor _governor, ProxyAdmin _proxyAdmin) public initializer {
    Governed.initialize(_governor);
    proxyAdmin = _proxyAdmin;
  }

  /**
   * @dev Returns the current implementation of a proxy.
   * This is needed because only the proxy admin can query it.
   * @return The address of the current implementation of the proxy.
   */
  function getProxyImplementation(AdminUpgradeabilityProxy proxy) public view returns (address) {
    return proxyAdmin.getProxyImplementation(proxy);
  }

  /**
   * @dev Returns the admin of a proxy. Only the admin can query it.
   * @return The address of the current admin of the proxy.
   */
  function getProxyAdmin(AdminUpgradeabilityProxy proxy) public view returns (address) {
    return proxyAdmin.getProxyAdmin(proxy);
  }

  /**
   * @dev Changes the admin of a proxy.
   * @param proxy Proxy to change admin.
   * @param newAdmin Address to transfer proxy administration to.
   */
  function changeProxyAdmin(AdminUpgradeabilityProxy proxy, address newAdmin) public onlyAuthorizedChanger {
    proxyAdmin.changeProxyAdmin(proxy, newAdmin);
  }

  /**
   * @dev Upgrades a proxy to the newest implementation of a contract.
   * @param proxy Proxy to be upgraded.
   * @param implementation the address of the Implementation.
   */
  function upgrade(AdminUpgradeabilityProxy proxy, address implementation) public onlyAuthorizedChanger {
    proxyAdmin.upgrade(proxy, implementation);
  }

  /**
   * @dev Upgrades a proxy to the newest implementation of a contract and forwards a function call to it.
   * This is useful to initialize the proxied contract.
   * @param proxy Proxy to be upgraded.
   * @param implementation Address of the Implementation.
   * @param data Data to send as msg.data in the low level call.
   * It should include the signature and the parameters of the function to be called, as described in
   * https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding.
   */
  function upgradeAndCall(AdminUpgradeabilityProxy proxy, address implementation, bytes memory data) public payable onlyAuthorizedChanger {
    proxyAdmin.upgradeAndCall.value(msg.value)(proxy, implementation, data);
  }
}



/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}




library MoCHelperLib {

  struct MocLibConfig {
    uint256 reservePrecision;
    uint256 dayPrecision;
    uint256 mocPrecision;
  }

  using SafeMath for uint256;

  uint256 constant UINT256_MAX = ~uint256(0);

  /**
    @dev Returns max uint256 value constant.
    @return max uint256 value constant
  */
  function getMaxInt(MocLibConfig storage /*config*/) public pure returns(uint256) {
    return UINT256_MAX;
  }

  /**
    @dev Calculates average interest using integral function: T =  Rate = a * (x ** b) + c
    @param tMax maxInterestRate [using mocPrecision]
    @param power factor [using noPrecision]
    @param tMin minInterestRate C0 stableToken amount [using mocPrecision]
    @param abRat1 initial abundance ratio [using mocPrecision]
    @param abRat2 final abundance ratio [using mocPrecision]
    @return average interest rate [using mocPrecision]
  */
  function inrateAvg(MocLibConfig storage config, uint256 tMax, uint256 power, uint256 tMin, uint256 abRat1, uint256 abRat2)
  public view returns(uint256) {
    require(tMax > tMin, "Max inrate should be bigger than Min inrate");
    uint256 abRat1Comp = config.mocPrecision.sub(abRat1);
    uint256 abRat2Comp = config.mocPrecision.sub(abRat2);

    if (abRat1 == abRat2) {
      return potential(config, tMax, power, tMin, abRat1Comp);
    }
    else if (abRat2 < abRat1) {
      return avgInt(config, tMax, power, tMin, abRat1Comp, abRat2Comp);
    }
    else {
      return avgInt(config, tMax, power, tMin, abRat2Comp, abRat1Comp);
    }
  }

  /**
    @dev Calculates spot interest rate that RiskProx owners should pay to RiskPro owners: Rate = tMax * (abRatio ** power) + tMin
    @param tMin min interest rate [using mocPrecision]
    @param power power to use in the formula [using NoPrecision]
    @param tMax max interest rate [using mocPrecision]
    @param abRatio bucket C0  abundance Ratio [using mocPrecision]

   */
  function spotInrate(
    MocLibConfig storage config, uint256 tMax, uint256 power, uint256 tMin, uint256 abRatio
  ) public view returns(uint256) {
    uint256 abRatioComp = config.mocPrecision.sub(abRatio);

    return potential(config, tMax, power, tMin, abRatioComp);
  }

  /**
    @dev Calculates potential interests function with given parameters: Rate = a * (x ** b) + c
    @param a maxInterestRate [using mocPrecision]
    @param b factor [using NoPrecision]
    @param c minInterestRate C0 stableToken amount [using mocPrecision]
    @param value global stableToken amount [using mocPrecision]
  */
  function potential(MocLibConfig storage config, uint256 a, uint256 b, uint256 c, uint256 value)
  public view returns(uint256) {
    // value ** b
    // [MOC] ** [] = [MOC]
    uint256 aux1 = pow(value, b, config.mocPrecision);
    // (a * aux1) + c
    // [MOC] [MOC] / [MOC] + [MOC] = [MOC]
    return a.mul(aux1).div(config.mocPrecision).add(c);
  }

    /**
    @dev Calculates average of the integral function:
     T = (
              (c * xf + ((a * (xf ** (b + 1))) / (b + 1))) -
              (c * xi + ((a * (xi ** (b + 1))) / (b + 1)))
             ) / (xf - xi)
    @param a maxInterestRate [using mocPrecision]
    @param b factor [using NoPrecision]
    @param c minInterestRate C0 stableToken amount [using mocPrecision]
    @param value1 value to put in the function [using mocPrecision]
    @param value2 value to put in the function [using mocPrecision]
    @return average interest rate [using mocPrecision]
   */
  function avgInt(MocLibConfig storage config, uint256 a, uint256 b, uint256 c, uint256 value1, uint256 value2)
  public view returns(uint256) {
    // value2 - value1
    // [MOC]
    uint256 diff = value2.sub(value1);
    // ((c * (1 - value1) + ((a * ((1 - value1) ** (b + 1))) / (b + 1)))
    uint256 intV1 = integral(config, a, b, c, value1);
    // ((c * (1 - value2) + ((a * ((1 - value2) ** (b + 1))) / (b + 1)))
    uint256 intV2 = integral(config,  a, b, c, value2);
    // (secOp - first) / diff
    // ([MOC][MOC] - [MOC][MOC]) / [MOC] = [MOC]
    return intV2.sub(intV1).div(diff);
  }

  /**
    @dev Calculates integral of the exponential function: T = c * (value) + (a * value ** (b + 1)) / (b + 1))
    @param a maxInterestRate [using mocPrecision]
    @param b factor [using NoPrecision]
    @param c minInterestRate C0 stableToken amount [using mocPrecision]
    @param value value to put in the function [using mocPrecision]
    @return integration result [using mocPrecision]
  */
  function integral(MocLibConfig storage config, uint256 a, uint256 b, uint256 c, uint256 value)
  public view returns(uint256) {
    // b + 1
    // [NONE]
    uint256 b2 = b.add(1);
    // c * value
    // [MOC][MOC]
    uint256 firstOp = c.mul(value);
    // [MOC]
    uint256 pow = pow(value, b2, config.mocPrecision);
    // (a * value ** b2) / b2)
    // [MOC][MOC]
    uint256 secOp = a.mul(pow).div(b2);
    // (firstOp + secOp)
    // [MOC][MOC] + [MOC][MOC] = [MOC][MOC]
    return firstOp.add(secOp);
  }

  /**
  * @dev Relation between stableTokens in bucket 0 and StableToken total supply
  * @param stableToken0 stableToken count in bucket 0 [using mocPrecision]
  * @param stableTokent total stableToken supply [using mocPrecision]
  * @return abundance ratio [using mocPrecision]
  */
  function abundanceRatio(MocLibConfig storage config, uint256 stableToken0, uint256 stableTokent)
  public view returns(uint256) {
    if (stableTokent == 0) {
      return config.mocPrecision;
    }
    // [DOC] [MOC] / [DOC] = [MOC]
    return stableToken0.mul(config.mocPrecision).div(stableTokent);
  }

  /**
    @dev Returns the Ratio to apply to RiskPro Price in discount situations: SpotDiscountRate = TPD * (utpdu - cob) / (uptdu -liq)
    @param riskProLiqDiscountRate Discount rate applied at Liquidation level coverage [using mocPrecision]
    @param liq Liquidation coverage threshold [using mocPrecision]
    @param utpdu Discount coverage threshold [using mocPrecision]
    @param cov Actual global Coverage threshold [using mocPrecision]
    @return Spot discount rate [using mocPrecision]
  */
  function riskProSpotDiscountRate(
    MocLibConfig storage libConfig, uint256 riskProLiqDiscountRate,
    uint256 liq, uint256 utpdu, uint256 cov
  ) public view returns(uint256) {
    require(riskProLiqDiscountRate < libConfig.mocPrecision, "Discount rate should be lower than 1");

    if (cov >= utpdu) {
      return 0;
    }

    // utpdu - liq
    // [MOC] - [MOC] = [MOC]
    uint256 utpduLiqDiff = utpdu.sub(liq);

    // utpdu - cov
    // [MOC] - [MOC] = [MOC]
    uint256 utpduCovDiff = utpdu.sub(cov);

    // TPD * utpduCovDiff / utpduLiqDiff
    // [MOC] * [MOC] / [MOC] = [MOC]
    return riskProLiqDiscountRate.mul(utpduCovDiff).div(utpduLiqDiff);
  }

  /**
    @dev Max amount of RiskPro to available with discount: MaxRiskProWithDiscount = (uTPDU * nStableToken * PEG - (nReserve * B)) / (TPusd * TPD)
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param nStableToken StableToken amount [using mocPrecision]
    @param utpdu Discount coverage threshold [using mocPrecision]
    @param peg peg value
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param riskProUsdPrice riskProUsdPrice [using mocPrecision]
    @param spotDiscount spot discount [using mocPrecision]
    @return Total RiskPro amount [using mocPrecision]
  */
  function maxRiskProWithDiscount(
    MocLibConfig storage libConfig, uint256 nReserve, uint256 nStableToken, uint256 utpdu,
    uint256 peg, uint256 reservePrice, uint256 riskProUsdPrice, uint256 spotDiscount
  ) public view returns(uint256)  {
    require(spotDiscount < libConfig.mocPrecision, "Discount Rate should be lower than 1");

    if (spotDiscount == 0) {
      return 0;
    }

    // nReserve * B
    // [RES] * [MOC] / [RES] = [MOC]
    uint256 nbUsdValue = nReserve.mul(reservePrice).div(libConfig.reservePrecision);

    // (TPusd * (1 - TPD))
    // [MOC] * [MOC] / [MOC] = [MOC]
    uint256 riskProDiscountPrice = riskProUsdPrice.mul(libConfig.mocPrecision.sub(spotDiscount))
      .div(libConfig.mocPrecision);

    return maxRiskProWithDiscountAux(libConfig, nbUsdValue, nStableToken, utpdu, peg, riskProDiscountPrice);
  }

  /**
    @dev Max amount of RiskPro to available with discount: MaxRiskProWithDiscount = (uTPDU * nStableToken * PEG - (nReserve * B)) / (TPusd * TPD)
    @param nbUsdValue Total amount of ReserveTokens in USD [using mocPrecision]
    @param nStableToken StableToken amount [using mocPrecision]
    @param utpdu Discount coverage threshold [using mocPrecision]
    @param riskProDiscountPrice riskProUsdPrice with discount applied [using mocPrecision]
    @param peg peg value
    @return Total RiskPro amount [using reservePrecision]
  */
  function maxRiskProWithDiscountAux(
    MocLibConfig storage libConfig, uint256 nbUsdValue, uint256 nStableToken,
    uint256 utpdu, uint256 peg, uint256 riskProDiscountPrice
  ) internal view returns(uint256) {

    // uTPDU * nStableToken * PEG
    // [MOC] * [MOC] / [MOC] = [MOC]
    uint256 coverageUSDAmount = utpdu.mul(nStableToken).mul(peg).div(libConfig.mocPrecision);

    // This case only occurs with Coverage below 1
    if (coverageUSDAmount <= nbUsdValue) {
      return 0;
    }

    // ([MOC] - [MOC]) * [RES] / [MOC] = [RES]
    return coverageUSDAmount.sub(nbUsdValue).mul(libConfig.reservePrecision).div(riskProDiscountPrice);
  }

  /**
    @dev Calculates Locked ReserveTokens
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param nStableToken StableTokens amount [using mocPrecision]
    @param peg peg value
    @return Locked ReserveTokens [using reservePrecision]
  */
  function lockedReserveTokens(MocLibConfig storage libConfig, uint256 reservePrice, uint256 nStableToken, uint256 peg)
    public view returns (uint256)
  {
    return nStableToken.mul(peg).mul(libConfig.reservePrecision).div(reservePrice);
  }

  /**
    @dev Calculates price at liquidation event as a relation between the stableToken total supply
    and the amount of ReserveTokens available to distribute
    @param resTokenAmount ReserveTokens to distribute [using reservePrecision]
    @param nStableToken StableTokens amount [using mocPrecision]
    @return Price at liquidation event [using mocPrecision]
  */
  function liquidationPrice(MocLibConfig storage libConfig, uint256 resTokenAmount, uint256 nStableToken)
  public view returns(uint256) {
    // [MOC] * [RES] / [RES]
    return nStableToken.mul(libConfig.reservePrecision).div(resTokenAmount);
  }

  /**
    @dev Calculates RiskPro ReserveTokens: (nReserve-LB) / nTP
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param lb Locked ReserveTokens amount [using reservePrecision]
    @param nTP RiskPro amount [using mocPrecision]
    @return RiskPro ReserveTokens price [using reservePrecision]
  */
  function riskProTecPrice(MocLibConfig storage libConfig, uint256 nReserve, uint256 lb, uint256 nTP)
  public view returns (uint256) {
    // Liquidation happens before this condition turns true
    if (nReserve < lb) {
      return 0;
    }

    if (nTP == 0) {
      return libConfig.mocPrecision;
    }
    // ([RES] - [RES]) * [MOC] / [MOC]
    return nReserve.sub(lb).mul(libConfig.mocPrecision).div(nTP);
  }

  /**
    @dev Calculates RiskPro ReserveToken price: RiskProxInRiskPro = riskProxTecPrice / riskProPrice
    @param riskProxTecPrice RiskProx ReserveTokens price [using reservePrecision]
    @param riskProPrice Trog ReserveTokens price [using reservePrecision]
    @return RiskProx price in RiskPro [using mocPrecision]
  */
  function riskProxRiskProPrice(
    MocLibConfig storage libConfig, uint256 riskProxTecPrice, uint256 riskProPrice
  ) public view returns (uint256) {
    // [RES] * [MOC] / [RES] = [MOC]
    return riskProxTecPrice.mul(libConfig.mocPrecision).div(riskProPrice);
  }

  /**
    @dev Returns a new value with the discountRate applied: (price)* (1 - discountRate)
    @param price Price [using SomePrecision]
    @param discountRate Discount rate to apply [using mocPrecision]
    @return Price with discount applied [using SomePrecision]
  */
  function applyDiscountRate(MocLibConfig storage libConfig, uint256 price, uint256 discountRate)
    public view returns(uint256) {

    uint256 discountCoeff = libConfig.mocPrecision.sub(discountRate);

    return price.mul(discountCoeff).div(libConfig.mocPrecision);
  }

  /**
    @dev Returns the amount of interest to pay: = price * interestRate
    @param value Cost to apply interest [using SomePrecision]
    @param interestRate Interest rate to apply [using mocPrecision]
    @return Interest cost based on the value and interestRate [using SomePrecision]
  */
  function getInterestCost(MocLibConfig storage libConfig, uint256 value, uint256 interestRate)
    public view returns(uint256) {
    // [ORIGIN] * [MOC] / [MOC] = [ORIGIN]
    return value.mul(interestRate).div(libConfig.mocPrecision);
  }

  /**
    @dev Calculates Coverage: nReserve / LB
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param lB Locked ReserveTokens amount [using reservePrecision]
    @return Coverage [using mocPrecision]
  */
  function coverage(MocLibConfig storage libConfig, uint256 nReserve, uint256 lB) public view
    returns(uint256) {
    if (lB == 0) {
      return UINT256_MAX;
    }

    return nReserve.mul(libConfig.mocPrecision).div(lB);
  }

 /**
    @dev Calculates Leverage from Coverage: Leverage = C / (C - 1)
    @param cov Coverage [using mocPrecision]
    @return Leverage [using mocPrecision]
  */
  function leverageFromCoverage(MocLibConfig storage libConfig, uint256 cov)
  public view returns(uint256) {
    if (cov == UINT256_MAX) {
      return libConfig.mocPrecision;
    }

    if (cov <= libConfig.mocPrecision) {
      return UINT256_MAX;
    }

    return cov.mul(libConfig.mocPrecision).div(cov.sub(libConfig.mocPrecision));
  }

 /**
    @dev Calculates Leverage: Leverage = nReserve / (nReserve - lB)
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param lB Locked ReserveTokens amount [using reservePrecision]
    @return Leverage [using mocPrecision]
  */
  function leverage(MocLibConfig storage libConfig, uint256 nReserve,uint256 lB)
  public view returns(uint256) {
    if (lB == 0) {
      return libConfig.mocPrecision;
    }

    if (nReserve <= lB) {
      return UINT256_MAX;
    }

    return nReserve.mul(libConfig.mocPrecision).div(nReserve.sub(lB));
  }

  /**
    @dev Price in ReserveTokens of the amount of StableTokens
    @param amount Total ReserveTokens amount [using reservePrecision]
    @param reservePrice ReserveTokens price [using mocPrecision]
    @return Total value [using reservePrecision]
  */
  function stableTokensResTokensValue(
    MocLibConfig storage libConfig, uint256 amount, uint256 peg, uint256 reservePrice
  ) public view returns (uint256) {
    require(reservePrice > 0, "Price should be more than zero");
    require(libConfig.reservePrecision > 0, "Precision should be more than zero");
    //Total = amount / satoshi price
    //Total = amount / (reservePrice / precision)
    // [RES] * [MOC] / [MOC]
    uint256 stableTokenResTokenTotal = amount.mul(libConfig.mocPrecision).mul(peg).div(reservePrice);

    return stableTokenResTokenTotal;
  }

  /**
    @dev Price in ReserveTokens of the amount of RiskPros
    @param riskProAmount amount of RiskPro [using mocPrecision]
    @param riskProResTokenPrice RiskPro price in ReserveTokens [using reservePrecision]
    @return Total value [using reservePrecision]
  */
  function riskProResTokensValuet(MocLibConfig storage libConfig, uint256 riskProAmount, uint256 riskProResTokenPrice)
    public view returns (uint256) {
    require(libConfig.reservePrecision > 0, "Precision should be more than zero");

    // [MOC] * [RES] / [MOC] =  [RES]
    uint256 riskProResTokenTotal = riskProAmount.mul(riskProResTokenPrice).div(libConfig.mocPrecision);

    return riskProResTokenTotal;
  }

  /**
    @dev Max amount of Docs to issue: MaxStableToken = ((nReserve*B)-(Cobj*B/Bcons*nStableToken*PEG))/(PEG*(Cobj*B/BCons-1))
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param cobj Target Coverage [using mocPrecision]
    @param nStableToken StableToken amount [using mocPrecision]
    @param peg peg value
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param bCons ReserveTokens conservative price [using mocPrecision]
    @return Total StableTokens amount [using mocPrecision]
  */
  function maxStableToken(
    MocLibConfig storage libConfig, uint256 nReserve,
    uint256 cobj, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 bCons
  ) public view returns(uint256) {
    require(libConfig.reservePrecision > 0, "Invalid Precision");
    require(libConfig.mocPrecision > 0, "Invalid Precision");

    // If cobj is less than 1, just return zero
    if (cobj < libConfig.mocPrecision)
      return 0;

    // Cobj * B / BCons
    // [MOC] * [MOC] / [MOC] = [MOC]
    uint256 adjCobj = cobj.mul(reservePrice).div(bCons);

    return maxStableTokenAux(libConfig, nReserve, adjCobj, nStableToken, peg, reservePrice);
  }

  function maxStableTokenAux(
    MocLibConfig storage libConfig, uint256 nReserve, uint256 adjCobj, uint256 nStableToken, uint256 peg, uint256 reservePrice
  ) internal view returns(uint256) {
    // (nReserve*B)
    // [RES] [MOC] [MOC] / [RES] = [MOC] [MOC]
    uint256 firstOperand = nReserve.mul(reservePrice).mul(libConfig.mocPrecision).div(libConfig.reservePrecision);
    // (adjCobj*nStableToken*PEG)
    // [MOC] [MOC]
    uint256 secOperand = adjCobj.mul(nStableToken).mul(peg);
    // (PEG*(adjCobj-1)
    // [MOC]
    uint256 denom = adjCobj.sub(libConfig.mocPrecision).mul(peg);

    if (firstOperand <= secOperand)
      return 0;

    // ([MOC][MOC] - [MOC][MOC]) / [MOC] = [MOC]
    return (firstOperand.sub(secOperand)).div(denom);
  }

  /**
    @dev Max amount of RiskPro to redeem: MaxRiskPro = ((nReserve*B)-(Cobj*nStableToken*PEG))/TPusd
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param cobj Target Coverage [using mocPrecision]
    @param nStableToken Target Coverage [using mocPrecision]
    @param peg peg value
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param bCons ReserveTokens conservative price [using mocPrecision]
    @param riskProUsdPrice riskProUsdPrice [using mocPrecision]
    @return Total RiskPro amount [using mocPrecision]
  */
  function maxRiskPro(
    MocLibConfig storage libConfig, uint256 nReserve, uint256 cobj,
    uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 bCons, uint256 riskProUsdPrice
  ) public view returns(uint256) {
    require(libConfig.reservePrecision > 0, "Invalid Precision");
    require(libConfig.mocPrecision > 0, "Invalid Precision");

    // Cobj * reservePrice / BCons
    // [MOC] * [MOC] / [MOC] = [MOC]
    uint256 adjCobj = cobj.mul(reservePrice).div(bCons);
    // (nReserve * reservePrice)
    // [RES] * [MOC] * [MOC] / [RES] = [MOC] [MOC]
    uint256 firstOperand = nReserve.mul(reservePrice)
      .mul(libConfig.mocPrecision)
      .div(libConfig.reservePrecision);
    // (adjCobj * nStableToken * PEG)
    // [MOC] * [MOC]
    uint256 secOperand = adjCobj.mul(nStableToken).mul(peg);

    if (firstOperand <= secOperand)
      return 0;

    // ([MOC][MOC] - [MOC][MOC]) / [MOC] = [MOC]
    return (firstOperand.sub(secOperand)).div(riskProUsdPrice);
  }

  /**
    @dev Calculates the total ReserveTokens price of the amount of RiskPros
    @param amount Amount of RiskPro [using mocPrecision]
    @param riskProPrice RiskPro ReserveTokens Price [using reservePrecision]
    @return RiskPro total value in ReserveTokens [using reservePrecision]
  */
  function totalRiskProInResTokens(
    MocLibConfig storage libConfig, uint256 amount, uint256 riskProPrice
  ) public view returns(uint256) {
    // [RES] * [MOC] / [MOC] = [RES]
    return riskProPrice.mul(amount).div(libConfig.mocPrecision);
  }

  /**
    @dev Calculates the equivalent in StableTokens of the resTokensAmount
    @param resTokensAmount ReserveTokens  amount [using reservePrecision]
    @param reservePrice ReserveTokens price [using mocPrecision]
    @return Equivalent StableToken amount [using mocPrecision]
  */
  function maxStableTokensWithResTokens(
    MocLibConfig storage libConfig, uint256 resTokensAmount, uint256 reservePrice
  ) public view returns(uint256) {
    // [RES] * [MOC] / [RES] = [MOC]
    return resTokensAmount.mul(reservePrice).div(libConfig.reservePrecision);
  }

  /**
    @dev Calculates the equivalent in RiskPro of the resTokensAmount
    @param resTokensAmount ReserveTokens amount [using reservePrecision]
    @param riskProPrice RiskPro ReserveTokens price [using reservePrecision]
    @return Equivalent RiskPro amount [using mocPrecision]
  */
  function maxRiskProWithResTokens(
    MocLibConfig storage libConfig, uint256 resTokensAmount, uint256 riskProPrice
  ) public view returns(uint256) {
    if (riskProPrice == 0) {
      return 0;
    }

    // [RES] * [MOC] / [RES]
    return resTokensAmount.mul(libConfig.mocPrecision).div(riskProPrice);
  }

  /**
    @dev Calculates the ResToken amount to move from C0 bucket to
    an L bucket when a RiskProx minting occurs: toMove = resTokensAmount * (lev - 1)
    @param resTokensAmount Total ReserveTokens amount [using reservePrecision]
    @param lev L bucket leverage [using mocPrecision]
    @return resTokens to move [using reservePrecision]
  */
  function bucketTransferAmount(
    MocLibConfig storage libConfig, uint256 resTokensAmount, uint256 lev
  ) public view returns(uint256) {
    require(lev > libConfig.mocPrecision, "Leverage should be more than 1");

    if (lev == UINT256_MAX || resTokensAmount == 0) {
      return 0;
    }

    // (lev-1)
    uint256 levSubOne = lev.sub(libConfig.mocPrecision);

    // Intentionally avaoid SafeMath
    // [RES] * [MOC]
    uint256 transferAmount = resTokensAmount * levSubOne;
    if (transferAmount / resTokensAmount != levSubOne)
      return 0;

    // [RES] * [MOC] / [MOC] = [RES]
    return transferAmount.div(libConfig.mocPrecision);
  }

   /**
    @dev Max amount of ReserveTokens allowed to be used to mint riskProx: MaxriskProx = nStableToken/ (PEG*B*(lev-1))
    @param nStableToken number of StableToken [using mocPrecision]
    @param peg peg value
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param lev leverage [using mocPrecision]
    @return Max riskProx ReserveTokens value [using reservePrecision]
  */
  function maxRiskProxResTokenValue(
    MocLibConfig storage libConfig, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 lev
  ) public view returns(uint256)  {
    require(libConfig.reservePrecision > 0, "Invalid Precision");
    require(libConfig.mocPrecision > 0, "Invalid Precision");

    if (lev <= libConfig.mocPrecision) {
      return 0;
    }
    // (lev-1)
    // [MOC]
    uint256 levSubOne = lev.sub(libConfig.mocPrecision);

    // PEG * ResTokenPrice
    // [MOC]
    uint256 pegTimesPrice = peg.mul(reservePrice);

    // This intentionally avoid using safeMath to handle overflow case
    // PEG * ResTokenPrice * (lev - 1)
    // [MOC] * [MOC]
    uint256 dividend = pegTimesPrice * levSubOne;

    if (dividend / pegTimesPrice != levSubOne)
      return 0; // INFINIT dividend means 0

    // nStableToken adjusted with precisions
    // [MOC] [RES]
    uint256 divider = nStableToken.mul(libConfig.reservePrecision);

    // [MOC] [RES] [MOC] / [MOC] [MOC]
    return divider.mul(libConfig.mocPrecision).div(dividend);
  }

  /**
    @dev Calculates the equivalent in MoC of the reserve token
    @param resTokensAmount Total ReserveTokens amount
    @param reservePrice ReserveTokens price
    @param mocPrice MoC price
    @return Equivalent MoC amount
  */
  function maxMoCWithReserveToken(
    MocLibConfig storage /*libConfig*/, uint256 resTokensAmount, uint256 reservePrice, uint256 mocPrice
  ) public pure returns(uint256) {
    return reservePrice.mul(resTokensAmount).div(mocPrice);
  }

  /**
    @dev Calculates the equivalent in reserve token of the MoC amount
    @param amount MoC amount
    @param reservePrice ReserveTokens price
    @param mocPrice MoC price
    @return Equivalent ReserveToken amount
  */
  function mocReserveTokenValue(
    MocLibConfig storage /*libConfig*/, uint256 amount, uint256 reservePrice, uint256 mocPrice
  ) public pure returns(uint256) {
    require(reservePrice > 0,"ReserveToken price should be more than zero");
    require(mocPrice > 0,"MoC price should be more than zero");

    uint256 mocReserveTokenTotal = amount.mul(mocPrice).div(reservePrice);

    return mocReserveTokenTotal;
  }

  /**
    @dev Rounding product adapted from DSMath but with custom precision
    @param x Multiplicand
    @param y Multiplier
    @return Product
  */
  function mulr(uint x, uint y, uint256 precision) internal pure returns (uint z) {
    return x.mul(y).add(precision.div(2)).div(precision);
  }

  /**
    @dev Potentiation by squaring adapted from DSMath but with custom precision
    @param x Base
    @param n Exponent
    @return power
  */
  function pow(uint256 x, uint256 n, uint256 precision) internal pure returns (uint z) {
    uint256 x2 = x;
    z = n % 2 != 0 ? x : precision;

    for (n /= 2; n != 0; n /= 2) {
      x2 = mulr(x2, x2, precision);

      if (n % 2 != 0) {
        z = mulr(z, x2, precision);
      }
    }
  }
}


/**
  @dev Interface with MocHelperLib
 */
contract MoCLibConnection {
  using MoCHelperLib for MoCHelperLib.MocLibConfig;
  MoCHelperLib.MocLibConfig internal mocLibConfig;

  /*
  * Precision getters
  */
  function getMocPrecision() public view returns(uint256) {
    return mocLibConfig.mocPrecision;
  }

  function getReservePrecision() public view returns(uint256) {
    return mocLibConfig.reservePrecision;
  }

  function getDayPrecision() public view returns(uint256) {
    return mocLibConfig.dayPrecision;
  }

  function initializePrecisions() internal {
    mocLibConfig = MoCHelperLib.MocLibConfig({
      reservePrecision: 10 ** 18,
      mocPrecision: 10 ** 18,
      dayPrecision: 1
    });
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}




/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see `ERC20Detailed`.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a `Transfer` event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through `transferFrom`. This is
     * zero by default.
     *
     * This value changes when `approve` or `transferFrom` are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * > Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an `Approval` event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a `Transfer` event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to `approve`. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


/**
 * @dev Optional functions from the ERC20 standard.
 */
contract ERC20Detailed is IERC20 {
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    /**
     * @dev Sets the values for `name`, `symbol`, and `decimals`. All three of
     * these values are immutable: they can only be set once during
     * construction.
     */
    constructor (string memory name, string memory symbol, uint8 decimals) public {
        _name = name;
        _symbol = symbol;
        _decimals = decimals;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei.
     *
     * > Note that this information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * `IERC20.balanceOf` and `IERC20.transfer`.
     */
    function decimals() public view returns (uint8) {
        return _decimals;
    }
}




/**
 * @dev Implementation of the `IERC20` interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using `_mint`.
 * For a generic mechanism see `ERC20Mintable`.
 *
 * *For a detailed writeup see our guide [How to implement supply
 * mechanisms](https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226).*
 *
 * We have followed general OpenZeppelin guidelines: functions revert instead
 * of returning `false` on failure. This behavior is nonetheless conventional
 * and does not conflict with the expectations of ERC20 applications.
 *
 * Additionally, an `Approval` event is emitted on calls to `transferFrom`.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard `decreaseAllowance` and `increaseAllowance`
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See `IERC20.approve`.
 */
contract ERC20 is IERC20 {
    using SafeMath for uint256;

    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowances;

    uint256 private _totalSupply;

    /**
     * @dev See `IERC20.totalSupply`.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See `IERC20.balanceOf`.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See `IERC20.transfer`.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount) public returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    /**
     * @dev See `IERC20.allowance`.
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See `IERC20.approve`.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    /**
     * @dev See `IERC20.transferFrom`.
     *
     * Emits an `Approval` event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of `ERC20`;
     *
     * Requirements:
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `value`.
     * - the caller must have allowance for `sender`'s tokens of at least
     * `amount`.
     */
    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, _allowances[sender][msg.sender].sub(amount));
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to `approve` that can be used as a mitigation for
     * problems described in `IERC20.approve`.
     *
     * Emits an `Approval` event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].add(addedValue));
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to `approve` that can be used as a mitigation for
     * problems described in `IERC20.approve`.
     *
     * Emits an `Approval` event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].sub(subtractedValue));
        return true;
    }

    /**
     * @dev Moves tokens `amount` from `sender` to `recipient`.
     *
     * This is internal function is equivalent to `transfer`, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a `Transfer` event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a `Transfer` event with `from` set to the zero address.
     *
     * Requirements
     *
     * - `to` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

     /**
     * @dev Destoys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a `Transfer` event with `to` set to the zero address.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 value) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        _totalSupply = _totalSupply.sub(value);
        _balances[account] = _balances[account].sub(value);
        emit Transfer(account, address(0), value);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner`s tokens.
     *
     * This is internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an `Approval` event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    /**
     * @dev Destoys `amount` tokens from `account`.`amount` is then deducted
     * from the caller's allowance.
     *
     * See `_burn` and `_approve`.
     */
    function _burnFrom(address account, uint256 amount) internal {
        _burn(account, amount);
        _approve(account, msg.sender, _allowances[account][msg.sender].sub(amount));
    }
}




/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev Give an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0), "Roles: account is the zero address");
        return role.bearer[account];
    }
}


contract PauserRole {
    using Roles for Roles.Role;

    event PauserAdded(address indexed account);
    event PauserRemoved(address indexed account);

    Roles.Role private _pausers;

    constructor () internal {
        _addPauser(msg.sender);
    }

    modifier onlyPauser() {
        require(isPauser(msg.sender), "PauserRole: caller does not have the Pauser role");
        _;
    }

    function isPauser(address account) public view returns (bool) {
        return _pausers.has(account);
    }

    function addPauser(address account) public onlyPauser {
        _addPauser(account);
    }

    function renouncePauser() public {
        _removePauser(msg.sender);
    }

    function _addPauser(address account) internal {
        _pausers.add(account);
        emit PauserAdded(account);
    }

    function _removePauser(address account) internal {
        _pausers.remove(account);
        emit PauserRemoved(account);
    }
}


/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
contract Pausable is PauserRole {
    /**
     * @dev Emitted when the pause is triggered by a pauser (`account`).
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by a pauser (`account`).
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state. Assigns the Pauser role
     * to the deployer.
     */
    constructor () internal {
        _paused = false;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    /**
     * @dev Called by a pauser to pause, triggers stopped state.
     */
    function pause() public onlyPauser whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Called by a pauser to unpause, returns to normal state.
     */
    function unpause() public onlyPauser whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }
}


/**
 * @title Pausable token
 * @dev ERC20 modified with pausable transfers.
 */
contract ERC20Pausable is ERC20, Pausable {
    function transfer(address to, uint256 value) public whenNotPaused returns (bool) {
        return super.transfer(to, value);
    }

    function transferFrom(address from, address to, uint256 value) public whenNotPaused returns (bool) {
        return super.transferFrom(from, to, value);
    }

    function approve(address spender, uint256 value) public whenNotPaused returns (bool) {
        return super.approve(spender, value);
    }

    function increaseAllowance(address spender, uint addedValue) public whenNotPaused returns (bool) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint subtractedValue) public whenNotPaused returns (bool) {
        return super.decreaseAllowance(spender, subtractedValue);
    }
}





contract MinterRole {
    using Roles for Roles.Role;

    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);

    Roles.Role private _minters;

    constructor () internal {
        _addMinter(msg.sender);
    }

    modifier onlyMinter() {
        require(isMinter(msg.sender), "MinterRole: caller does not have the Minter role");
        _;
    }

    function isMinter(address account) public view returns (bool) {
        return _minters.has(account);
    }

    function addMinter(address account) public onlyMinter {
        _addMinter(account);
    }

    function renounceMinter() public {
        _removeMinter(msg.sender);
    }

    function _addMinter(address account) internal {
        _minters.add(account);
        emit MinterAdded(account);
    }

    function _removeMinter(address account) internal {
        _minters.remove(account);
        emit MinterRemoved(account);
    }
}


/**
 * @dev Extension of `ERC20` that adds a set of accounts with the `MinterRole`,
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract ERC20Mintable is ERC20, MinterRole {
    /**
     * @dev See `ERC20._mint`.
     *
     * Requirements:
     *
     * - the caller must have the `MinterRole`.
     */
    function mint(address account, uint256 amount) public onlyMinter returns (bool) {
        _mint(account, amount);
        return true;
    }
}


/**
 * @title Owner Burnable Token
 * @dev Token that allows the owner to irreversibly burned (destroyed) any token.
 */
contract OwnerBurnableToken is Ownable, ERC20Mintable {
  /**
   * @dev Burns a specific amount of tokens for the address.
   * @param who who's tokens are gona be burned
   * @param value The amount of token to be burned.
   */
  function burn(address who, uint256 value) public onlyOwner {
    _burn(who, value);
  }
}


contract RiskProToken is ERC20Detailed, ERC20Pausable, OwnerBurnableToken {

  string private _name = "RIFPro";
  string private _symbol = "RIFP";
  uint8 private _decimals = 18;

  /**
    @dev Constructor
  */
  constructor() Ownable() ERC20Detailed(_name, _symbol, _decimals) public {
  }

  /**
    @dev Fallback function
  */
  function() external {
  }
}







/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCWhitelist {
  mapping(address => bool) whitelist;

  /**
   * @dev Check if an account is whitelisted
   * @return Bool
   */
  function isWhitelisted(address account)
    public
    view
    returns (bool)
  {
    require(account != address(0), "Account must not be 0x0");
    return whitelist[account];
  }

  /**
   * @dev Add account to whitelist
   */
  function add(address account) internal {
    require(account != address(0), "Account must not be 0x0");
    require(!isWhitelisted(account), "Account not allowed to add accounts into white list");
    whitelist[account] = true;
  }

  /**
   * @dev Remove account from whitelist
   */
  function remove(address account) internal {
    require(account != address(0), "Account must not be 0x0");
    require(isWhitelisted(account), "Account is not allowed to remove address from the white list");

    whitelist[account] = false;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCConnector is MoCWhitelist, Initializable {
  // References
  address payable public moc;
  address public stableToken;
  address public riskProToken;
  address public riskProxManager;
  address public mocState;
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address public DEPRECATED_mocConverter;
  address public mocSettlement;
  address public mocExchange;
  address public mocInrate;
  /** DEPRECATED mocBurnout **/
  address public mocBurnout;
  address public reserveToken;

  bool internal initialized;

  /**
    @dev Initializes the contract
    @param mocAddress MoC contract address
    @param stableTokenAddress Stable token contract address
    @param riskProAddress RiskPro token contract address
    @param riskProxAddress RiskProxManager contract address
    @param stateAddress MoCState contract address
    @param settlementAddress MoCSettlement contract address
    @param exchangeAddress MoCExchange contract address
    @param inrateAddress MoCInrate contract address
    @param burnoutBookAddress (DEPRECATED) MoCBurnout contract address. DO NOT USE.
    @param reserveTokenAddress Reserve token contract address
  */
  function initialize(
    address payable mocAddress,
    address stableTokenAddress,
    address riskProAddress,
    address riskProxAddress,
    address stateAddress,
    address settlementAddress,
    address exchangeAddress,
    address inrateAddress,
    address burnoutBookAddress,
    address reserveTokenAddress
  ) public initializer {
    moc = mocAddress;
    stableToken = stableTokenAddress;
    riskProToken = riskProAddress;
    riskProxManager = riskProxAddress;
    mocState = stateAddress;
    mocSettlement = settlementAddress;
    mocExchange = exchangeAddress;
    mocInrate = inrateAddress;
    mocBurnout = burnoutBookAddress;
    reserveToken = reserveTokenAddress;

    // Add to Whitelist
    add(mocAddress);
    add(stableTokenAddress);
    add(riskProAddress);
    add(riskProxAddress);
    add(stateAddress);
    add(settlementAddress);
    add(exchangeAddress);
    add(inrateAddress);
    add(burnoutBookAddress);
    add(reserveTokenAddress);
  }

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  // DEPRECATED. 
  // This function was used atomically in upgrade v0115 to migrate stableTokenV1 to stableTokenV2
  // After that, it is removed in this contract version to cannot be called more than once.
  //
  // event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  //
  // /**
  //   @dev Migrates to a new stable token contract
  //   @param newStableTokenAddress_ new stable token contract address
  // */
  // function migrateStableToken(address newStableTokenAddress_) public {
  //   emit StableTokenMigrated(stableToken, newStableTokenAddress_);  
  //   stableToken = newStableTokenAddress_;
  // }
  
  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


/**
 * @dev Defines special constants to use along all the MoC System
 */
contract MoCConstants {
  bytes32 constant public BUCKET_X2 = "X2";
  bytes32 constant public BUCKET_C0 = "C0";
}

/**
  @dev General usefull modifiers and functions
 */
contract MoCBase is MoCConstants, Initializable {
  // Contracts
  MoCConnector public connector;

  bool internal initialized;

  function initializeBase(address connectorAddress) internal initializer {
    connector = MoCConnector(connectorAddress);
  }

  modifier onlyWhitelisted(address account) {
    require(connector.isWhitelisted(account), "Address is not whitelisted");
    _;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}



/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library Math {
    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow, so we distribute
        return (a / 2) + (b / 2) + ((a % 2 + b % 2) / 2);
    }
}


contract MoCBucketContainer is MoCBase, Governed {
  using SafeMath for uint256;
  using Math for uint256;

  struct RiskProxBalance {
    uint256 value;
    uint256 index; // Index start in 1, zero is reserved for NULL
  }

  struct MoCBucket {
    bytes32 name;
    bool isBase;
    uint256 nStable;
    uint256 nRiskPro;
    uint256 nReserve;
    uint256 cobj;
    // Should only be used in X buckets
    mapping(address => RiskProxBalance) riskProxBalances;
    address payable[] activeBalances;
    uint256 activeBalancesLength;
    // Should only be used in Base buckets (C0)
    uint256 inrateBag;
    bool available;
  }

  event BucketMovement(
    bytes32 from,
    bytes32 to,
    uint256 reserves,
    uint256 stableTokens
  );

  event BucketCreation(
    bytes32 name,
    uint256 cobj
  );

  event BucketStateUpdate(
    bytes32 name,
    uint256 nReserve,
    uint256 nStable,
    uint256 nRiskProx,
    uint256 inrateBag
  );

  mapping(bytes32 => MoCBucket) internal mocBuckets;

  /**
   GETTERS
   */
  function getBucketNReserve(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].nReserve;
  }

  function getBucketNRiskPro(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].nRiskPro;
  }

  function getBucketNStableToken(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].nStable;
  }

  function getBucketCobj(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].cobj;
  }

  function getInrateBag(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].inrateBag;
  }

  /**
   * @dev Sets the objective coverage (cobj) on an specficied bucket.
   * @param  _bucket - name of the bucket
   * @param  _cobj - new value of cobj
   */
  function setBucketCobj(bytes32 _bucket, uint256 _cobj) public onlyAuthorizedChanger() {
    mocBuckets[_bucket].cobj = _cobj;
  }

  /**
    @dev returns true if the bucket is a base bucket
    @param bucket Name of the bucket
  **/
  function isBucketBase(bytes32 bucket) public view returns (bool) {
    return mocBuckets[bucket].isBase;
  }

  /**
    @dev returns true if the bucket have stableTokens in it
    @param bucket Name of the bucket
  **/
  function isBucketEmpty(bytes32 bucket) public view returns (bool) {
    return mocBuckets[bucket].nStable == 0;
  }

  /**
    @dev Returns all the address that currently have riskProx position for this bucket
    @param bucket bucket of the active address
  */
  function getActiveAddresses(bytes32 bucket) public view returns (address payable[] memory) {
    return mocBuckets[bucket].activeBalances;
  }

  /**
    @dev Returns the number of addresses that currently have riskProx position for this bucket
    @param bucket bucket of the active address
  */
  function getActiveAddressesCount(bytes32 bucket) public view returns (uint256 count) {
    return mocBuckets[bucket].activeBalancesLength;
  }

  /**
    @dev Add values to all variables of the bucket
    @param bucketName Name of the bucket
    @param reserveTokens ReserveToken amount [using reservePrecision]
    @param stableToken StableToken amount [using mocPrecision]
    @param riskProx RiskProx amount [using mocPrecision]
  */
  function addValuesToBucket(bytes32 bucketName, uint256 reserveTokens, uint256 stableToken, uint256 riskProx)
  public onlyWhitelisted(msg.sender) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    bucket.nReserve = bucket.nReserve.add(reserveTokens);
    bucket.nStable = bucket.nStable.add(stableToken);
    bucket.nRiskPro = bucket.nRiskPro.add(riskProx);
  }

  /**
    @dev Substract values to all variables of the bucket
    @param bucketName Name of the bucket
    @param reserve ReserveToken amount [using reservePrecision]
    @param stableToken StableToken amount [using mocPrecision]
    @param riskProx RiskProx amount [using mocPrecision]
  */
  function substractValuesFromBucket(bytes32 bucketName, uint256 reserve, uint256 stableToken, uint256 riskProx)
  public onlyWhitelisted(msg.sender) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    bucket.nReserve = bucket.nReserve.sub(reserve);
    bucket.nStable = bucket.nStable.sub(stableToken);
    bucket.nRiskPro = bucket.nRiskPro.sub(riskProx);
  }

  /**
    @dev Moves ReserveTokens from inrateBag to main ReserveTokens bucket bag
    @param bucketName Name of the bucket to operate
    @param amount value to move from inrateBag to main bag [using reservePrecision]
   */
  function deliverInrate(bytes32 bucketName, uint256 amount) public
   onlyWhitelisted(msg.sender) onlyBaseBucket(bucketName) bucketStateUpdate(bucketName) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    uint256 toMove = Math.min(bucket.inrateBag, amount);

    bucket.inrateBag = bucket.inrateBag.sub(toMove);
    bucket.nReserve = bucket.nReserve.add(toMove);
  }

  /**
    @dev Removes Interests rate from Inrate bag
    @param bucketName Name of the bucket to operate
    @param amount value to move from inrateBag to main bag [using reservePrecision]
    @return Retrieved value
   */
  function recoverInrate(bytes32 bucketName, uint256 amount) public
  onlyWhitelisted(msg.sender) onlyBaseBucket(bucketName) bucketStateUpdate(bucketName) returns(uint256) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    uint256 toRetrieve = Math.min(bucket.inrateBag, amount);

    bucket.inrateBag = bucket.inrateBag.sub(toRetrieve);

    return toRetrieve;
  }

  /**
    @dev Moves ReserveTokens from origin bucket to destination bucket inrateBag
    @param bucketName name of the bucket to from which takes
    @param reserveAmount value to add to main bag [using reservePrecision]
  */
  function payInrate(bytes32 bucketName, uint256 reserveAmount) public
  onlyWhitelisted(msg.sender) onlyBaseBucket(bucketName) {
    MoCBucket storage bucket = mocBuckets[bucketName];
    bucket.inrateBag = bucket.inrateBag.add(reserveAmount);
  }

  /**
    @dev Move ReserveTokens and StableTokens from one bucket to another
    @param from Name of bucket from where the ReserveTokens will be removed
    @param to Name of bucket from where the ReserveTokens will be added
    @param reserve ReserveTokens amount [using reservePrecision]
    @param stableTokens StableTokens amount [using mocPrecision]
  **/
  function moveResTokensAndStableTokens(bytes32 from, bytes32 to, uint256 reserve, uint256 stableTokens) public
  onlyWhitelisted(msg.sender) bucketStateUpdate(from) bucketStateUpdate(to) {
    MoCBucket storage bucketFrom = mocBuckets[from];
    MoCBucket storage bucketTo = mocBuckets[to];

    bucketFrom.nReserve = bucketFrom.nReserve.sub(reserve);
    bucketTo.nReserve = bucketTo.nReserve.add(reserve);

    bucketFrom.nStable = bucketFrom.nStable.sub(stableTokens);
    bucketTo.nStable = bucketTo.nStable.add(stableTokens);

    emit BucketMovement(from, to, reserve, stableTokens);
  }

  /**
    @dev Clears completely the origin bucket, removing all StableTokens, ReserveTokens and riskProxs
    @param toLiquidate Bucket to be cleared out
    @param destination Bucket that will receive the StableTokens and ReserveTokens
   */
  function liquidateBucket(bytes32 toLiquidate, bytes32 destination) public onlyWhitelisted(msg.sender) {
    require(!isBucketBase(toLiquidate), "Cannot liquidate a base bucket");

    clearBucketBalances(toLiquidate);
    emptyBucket(toLiquidate, destination);
  }

  /**
    @dev Clears StableTokens and ReserveTokens from bucket origin and sends them to destination bucket
    @param origin Bucket to clear out
    @param destination Destination bucket
  **/
  function emptyBucket(bytes32 origin, bytes32 destination) public onlyWhitelisted(msg.sender) {
    moveResTokensAndStableTokens(origin, destination, mocBuckets[origin].nReserve, mocBuckets[origin].nStable);
  }

  /**
   * @dev checks if a bucket exists
   * @param bucket name of the bucket
   */
  function isAvailableBucket(bytes32 bucket) public view returns (bool) {
    return mocBuckets[bucket].available;
  }

  /**
    @dev Put all bucket RiskProx balances in zero
    @param bucketName Bucket to clear out
   */
  function clearBucketBalances(bytes32 bucketName) public onlyWhitelisted(msg.sender) {
    MoCBucket storage bucket = mocBuckets[bucketName];
    bucket.nRiskPro = 0;
    bucket.activeBalancesLength = 0;
  }

  /**
    @dev Creates bucket
    @param name Name of the bucket
    @param cobj Target Coverage of the bucket
    @param isBase Indicates if it is a base bucket (true) or not (false)
  */
  function createBucket(bytes32 name, uint256 cobj, bool isBase) internal {
    mocBuckets[name].name = name;
    mocBuckets[name].nStable = 0;
    mocBuckets[name].nRiskPro = 0;
    mocBuckets[name].nReserve = 0;
    mocBuckets[name].cobj = cobj;
    mocBuckets[name].isBase = isBase;
    mocBuckets[name].available = true;
    emit BucketCreation(name, cobj);
  }

  modifier onlyBaseBucket(bytes32 bucket) {
    require(isBucketBase(bucket), "Bucket should be a base type bucket");
    _;
  }

  modifier bucketStateUpdate(bytes32 bucket) {
    _;
    emit BucketStateUpdate(
      bucket,
      mocBuckets[bucket].nReserve,
      mocBuckets[bucket].nStable,
      mocBuckets[bucket].nRiskPro,
      mocBuckets[bucket].inrateBag
    );
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}



contract MoCRiskProxManager is MoCBucketContainer {
  using SafeMath for uint256;
  uint256 constant MIN_ALLOWED_BALANCE = 0;

  function initialize(address connectorAddress, address _governor, uint256 _c0Cobj, uint256 _x2Cobj) public initializer {
    initializeBase(connectorAddress);
    initializeValues(_governor);
    createBucket(BUCKET_C0, _c0Cobj, true);
    createBucket(BUCKET_X2, _x2Cobj, false);
  }

  /**
    @dev returns user balance
    @param bucket RiskProx corresponding bucket to get balance from
    @param userAddress user address to get balance from
    @return total balance for the userAddress
  */
  function riskProxBalanceOf(bytes32 bucket, address userAddress) public view returns (uint256) {
    RiskProxBalance memory userBalance = mocBuckets[bucket].riskProxBalances[userAddress];
    if (!hasValidBalance(bucket, userAddress, userBalance.index)) return 0;
    return userBalance.value;
  }

  /**
    @dev verifies that this user has assigned balance for the given bucket
    @param bucket corresponding Leveraged bucket to get balance from
    @param userAddress user address to verify balance for
    @param index index, starting from 1, where the address of the user is being kept
    @return true if the user has assigned balance
  */
  function hasValidBalance(bytes32 bucket, address userAddress, uint256 index) public view returns (bool) {
    return (index != 0) && (index <= getActiveAddressesCount(bucket)) && (mocBuckets[bucket].activeBalances[index - 1] == userAddress);
  }

  /**
    @dev  Assigns the amount of RiskProx
    @param bucket bucket from which the RiskProx will be removed
    @param account user address to redeem for
    @param riskProxAmount riskProx amount to redeem [using mocPresicion]
    @param totalCost ReserveToken value of riskProxAmount [using reservePrecision]
  */
  function assignRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 totalCost)
    public
    onlyWhitelisted(msg.sender)
  {
    uint256 currentBalance = riskProxBalanceOf(bucket, account);

    setRiskProxBalanceOf(bucket, account, currentBalance.add(riskProxAmount));
    addValuesToBucket(bucket, totalCost, 0, riskProxAmount);
  }

  /**
    @dev  Removes the amount of RiskProx and substract ReserveTokens from bucket
    @param bucket bucket from which the RiskProx will be removed
    @param userAddress user address to redeem for
    @param riskProxAmount riskProx amount to redeem [using mocPresicion]
    @param totalCost reserveToken value of riskProxAmount [using reservePrecision]
  */
  function removeRiskProx(bytes32 bucket, address payable userAddress, uint256 riskProxAmount, uint256 totalCost)
    public
    onlyWhitelisted(msg.sender)
  {
    uint256 currentBalance = riskProxBalanceOf(bucket, userAddress);

    setRiskProxBalanceOf(bucket, userAddress, currentBalance.sub(riskProxAmount));
    substractValuesFromBucket(bucket, totalCost, 0, riskProxAmount);
  }

  /**
    @dev Sets the amount of RiskProx
    @param bucket bucket from which the RiskProx will be setted
    @param userAddress user address to redeem for
    @param value riskProx amount to redeem [using mocPresicion]
  */
  function setRiskProxBalanceOf(bytes32 bucket, address payable userAddress, uint256 value) public onlyWhitelisted(msg.sender) {
    mocBuckets[bucket].riskProxBalances[userAddress].value = value;

    uint256 index = mocBuckets[bucket].riskProxBalances[userAddress].index;
    if (!hasValidBalance(bucket, userAddress, index)) index = 0;

    bool hasBalance = value > MIN_ALLOWED_BALANCE;
    // The address is not in the array
    if (index == 0) {
      if (hasBalance) {
        if (mocBuckets[bucket].activeBalances.length == mocBuckets[bucket].activeBalancesLength) {
          mocBuckets[bucket].activeBalances.length += 1;
        }
        uint256 currentIndex = mocBuckets[bucket].activeBalancesLength++;
        mocBuckets[bucket].activeBalances[currentIndex] = userAddress;
        mocBuckets[bucket].riskProxBalances[userAddress].index = mocBuckets[bucket].activeBalancesLength;
      }
    } else {
      if (!hasBalance) {
        // We need to delete this address from the tracker
        uint256 lastActiveIndex = mocBuckets[bucket].activeBalancesLength;
        address payable keyToMove = mocBuckets[bucket].activeBalances[lastActiveIndex - 1];
        mocBuckets[bucket].activeBalances[index - 1] = keyToMove;
        // Alternative index and array decreases lenght to prevent gas limit
        mocBuckets[bucket].activeBalancesLength--;
        // Update moved key index
        mocBuckets[bucket].riskProxBalances[keyToMove].index = index;
        // Disable empty account index (0 == NULL)
        mocBuckets[bucket].riskProxBalances[userAddress].index = 0;
      }
    }
  }

  /**
   * @dev intializes values of the contract
   */
  function initializeValues(address _governor) internal {
    governor = IGovernor(_governor);
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


interface IMoCState {

     /******STATE MACHINE*********/
    enum States {
        // State 0
        Liquidated,
        // State 1
        RiskProDiscount,
        // State 2
        BelowCobj,
        // State 3
        AboveCobj
    }


    function addToReserves(uint256 reserveAmount) external;

    function substractFromReserves(uint256 reserveAmount) external;

    function coverage(bytes32 bucket) external view returns(uint256);

    function getReservesRemainder() external view returns(uint256);

    function liq() external view returns(uint256);

    function state() external view returns(States);

    function peg() external view returns(uint256);

    function dayBlockSpan() external view returns(uint256);

    function getReserveTokenPrice() external view returns(uint256);

    function getMoCPrice() external view returns(uint256);

    function getProtected() external view returns(uint256);

    function globalCoverage() external view returns(uint256);

    function getMoCVendors() external view returns(address);

    function getMoCToken() external view returns(address);

    function nextState() external;

    function maxRiskProWithDiscount() external view returns(uint256);

    function absoluteMaxRiskPro() external view returns(uint256);

    function absoluteMaxStableToken() external view returns(uint256);

    function freeStableToken() external view returns(uint256);

    function riskProTecPrice() external view returns(uint256);

    function riskProSpotDiscountRate() external view returns(uint256);

    function riskProDiscountPrice() external view returns(uint256);

    function bucketRiskProTecPrice(bytes32 bucket) external view returns(uint256);

    function currentAbundanceRatio() external view returns(uint256);

    function abundanceRatio(uint256 stableToken0) external view returns(uint256);

    function daysToSettlement() external view returns(uint256);

    function leverage(bytes32 bucket) external view returns(uint256);

    function getBucketNReserve(bytes32 bucket) external view returns(uint256);

    function getLiquidationPrice() external view returns(uint256);

    function maxRiskProxResTokenValue(bytes32 bucket) external view returns(uint256);

    function bucketRiskProTecPriceHelper(bytes32 bucket) external view returns(uint256);

    function stableTokensToResToken(uint256 stableTokenAmount) external view returns (uint256);

    function resTokenToStableToken(uint256 resTokensAmount) external view returns (uint256);

    function riskProxToResToken(uint256 riskProxAmount, bytes32 bucket) external view returns (uint256);

    function resTokenToRiskProx(uint256 resTokensAmount, bytes32 bucket) external view returns (uint256);
}

interface IMoCSettlement {
    function getRedeemRequestAt(uint256 _index) external view returns (address payable, uint256);

    function redeemQueueSize() external view returns (uint256);

    function stableTokenAmountToRedeem(address _who) external view returns (uint256);

    function addRedeemRequest(uint256 amount, address payable redeemer) external;

    function alterRedeemRequestAmount(bool isAddition, uint256 delta, address redeemer) external;

    function isSettlementEnabled() external view returns (bool);

    function runSettlement(uint256 steps) external returns (uint256);

    function isSettlementReady() external view returns (bool);

    function nextSettlementBlock() external view returns (uint256);
}

interface IMoCExchange {
    function getMoCTokenBalance(address owner, address spender) external view
    returns (uint256 mocBalance, uint256 mocAllowance);

    function mintRiskPro(address account, uint256 reserveAmount, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemRiskPro(address account, uint256 riskProAmount, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function mintStableToken(address account, uint256 reserveToMint, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemRiskProx(address payable account, bytes32 bucket, uint256 riskProxAmount, address vendorAccount)
    external returns (uint256, uint256, uint256, uint256, uint256);

    function mintRiskProx(address payable account, bytes32 bucket, uint256 reserveToMint, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemFreeStableToken(address account, uint256 stableTokenAmount, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemAllStableToken(address origin, address payable destination) external
    returns (uint256);

    function forceRedeemRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice)
    external returns (bool);

    function redeemStableTokenWithPrice(address payable userAddress, uint256 amount, uint256 reservePrice) external
    returns (bool, uint256);

    function setMaxAbsoluteOperation(uint256 maxAbsoluteOperation_) external;

    function setMaxOperationalDifference(uint256 maxOperationalDifference_) external;

    function setDecayBlockSpan(uint256 decayBlockSpan_) external;
}


contract MoCReserve {
  event CallRevert();
  event DepositFailed(address indexed origin, uint256 amount);
  event WithdrawFailed(address indexed destination, uint256 amount);

  using SafeMath for uint256;
  using Math for uint256;
  // Contracts
  IERC20 public reserveToken;

  modifier enoughAllowance(uint256 amount, address account) {
    require(amount <= getAllowance(account), "Not enough allowance to make the operation");
    _;
  }

  /**
    @dev Returns the amount of token reserve an account
    is allowed to use for deposit.

    @param account User account to check allowance.
    @return The minimum value between MoC allowance for that account and the account's balance.
   */
  function getAllowance(address account) public view returns(uint256) {
    uint256 balance = reserveToken.balanceOf(account);
    uint256 mocAllowed = reserveToken.allowance(account, address(this));

    return Math.min(balance, mocAllowed);
  }

  /**
    @dev Deposit reserve tokens into MoC address takeing it from origin address.
    Allowance of the amount should be made it before this.
    @param amount Amount of reserve tokens to transfer.
    @param origin Account from which to take the funds.
   */
  function deposit(uint256 amount, address origin) internal
  enoughAllowance(amount, origin) returns(bool) {
    bool result = safeTransferFrom(origin, amount);

    if (!result) {
      emit DepositFailed(origin, amount);
    }

    return result;
  }

  /**
    @dev Deposit reserve tokens into MoC address takeing it from origin address.
    Allowance of the amount should be made it before this.
    @param amount Amount of reserve tokens to extract.
    @param destination Account to which the funds will be sent.
    @return true if transfer is successfull and false if not.
   */
  function withdraw(uint256 amount, address destination) internal returns(bool) {
    bool result = safeTransfer(destination, amount);

    if (!result) {
      emit WithdrawFailed(destination, amount);
    }

    return result;
  }

  function setReserveToken(address token) internal {
    reserveToken = IERC20(token);
  }

  /**
    @dev Calls RRC20 transfer function and returns a boolean result even
    if transaction reverts.

    @param to Destination account of the funds.
    @param amount Funds to move.
   */
  function safeTransfer(address to, uint256 amount) internal returns(bool) {
    return safeCall(
      abi.encodePacked( // This encodes the function to call and the parameters to pass to that function
        reserveToken.transfer.selector, // This is the function identifier of the function we want to call
        abi.encode(to, amount) // This encodes the parameter we want to pass to the function
      )
    );
  }

  /**
    @dev Calls RRC20 transferFrom function and returns a boolean result even
    if transaction reverts

    @param origin Destination account of the funds.
    @param amount Funds to move.
   */
  function safeTransferFrom(address origin, uint256 amount) internal returns(bool) {
    return safeCall(
      abi.encodePacked( // This encodes the function to call and the parameters to pass to that function
        reserveToken.transferFrom.selector, // This is the function identifier of the function we want to call
        abi.encode(origin, address(this), amount) // This encodes the parameter we want to pass to the function
      )
    );
  }

  /**
    @dev Wraps an RRC20 transfer with a low level call to handle revert secenario
    * Emits CallRevert if call fails for revert

    @param callData Packed encoded data to use as call parameter.
   */
  function safeCall(bytes memory callData) internal returns(bool) {
  // This creates a low level call to the token
    // solium-disable-next-line security/no-low-level-calls
    (bool success, bytes memory returnData) = address(reserveToken).call(
     callData
    );
    if (success) {
      // return result of call function
      return abi.decode(returnData, (bool));
    } else {
      emit CallRevert();
      return false;
    }
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}




/**
  @title Stoppable
  @notice Allow a contract to be paused through the stopper subsystem. This contracts
  is able to disable the stoppability feature through governance.
  @dev This contract was heavily based on the _Pausable_ contract of openzeppelin-eth but
  it was modified in order to being able to turn on and off its stopability
 */
contract Stoppable is Governed {

  event Paused(address account);
  event Unpaused(address account);

  bool public stoppable;
  bool private _paused;
  address public stopper;
  string private constant UNSTOPPABLE = "unstoppable";
  string private constant CONTRACT_IS_ACTIVE = "contract_is_active";
  string private constant CONTRACT_IS_PAUSED = "contract_is_paused";
  string private constant NOT_STOPPER = "not_stopper";


  /**
    @notice Modifier to make a function callable only when the contract is enable
    to be paused
  */
  modifier whenStoppable() {
    require(stoppable, UNSTOPPABLE);
    _;
  }

  /**
    @notice Modifier to make a function callable only when the contract is not paused
  */
  modifier whenNotPaused() {
    require(!_paused, CONTRACT_IS_PAUSED);
    _;
  }

  /**
    @notice Modifier to make a function callable only when the contract is paused
    */
  modifier whenPaused() {
    require(_paused, CONTRACT_IS_ACTIVE);
    _;
  }

  /**
    @notice  Modifier to make a function callable only by the pauser
   */
  modifier onlyPauser() {
    require(stopper == msg.sender, NOT_STOPPER);
    _;
  }

  /**
    @notice Initialize the contract with the basic settings
    @dev This initialize replaces the constructor but it is not called automatically.
    It is necessary because of the upgradeability of the contracts. Either this function or the next can be used
    @param _stopper The address that is authorized to stop this contract
    @param _governor The address that will define when a change contract is authorized to do this unstoppable/stoppable again
   */
  function initialize(address _stopper, IGovernor _governor) public initializer {
    initialize(_stopper, _governor, true);
  }

  /**
    @notice Initialize the contract with the basic settings
    @dev This initialize replaces the constructor but it is not called automatically.
    It is necessary because of the upgradeability of the contracts. Either this function or the previous can be used
    @param _stopper The address that is authorized to stop this contract
    @param _governor The address that will define when a change contract is authorized to do this unstoppable/stoppable again
    @param _stoppable Define if the contract starts being unstoppable or not
   */
  function initialize(address _stopper, IGovernor _governor, bool _stoppable) public initializer {
    stoppable = _stoppable;
    stopper = _stopper;
    Governed.initialize(_governor);
  }

  /**
    @notice Returns true if paused
   */
  function paused() public view returns (bool) {
    return _paused;
  }
  /**
    @notice Called by the owner to pause, triggers stopped state
    @dev Should only be called by the pauser and when it is stoppable
   */
  function pause() public whenStoppable onlyPauser whenNotPaused {
    _paused = true;
    emit Paused(msg.sender);
  }

  /**
    @notice Called by the owner to unpause, returns to normal state
   */
  function unpause() public onlyPauser whenPaused {
    _paused = false;
    emit Unpaused(msg.sender);
  }


  /**
    @notice Switches OFF the stoppability of the contract; if the contract was paused
    it will no longer be so
    @dev Should be called through governance
   */
  function makeUnstoppable() public onlyAuthorizedChanger {
    stoppable = false;
  }


  /**
    @notice Switches ON the stoppability of the contract; if the contract was paused
    before making it unstoppable it will be paused again after calling this function
    @dev Should be called through governance
   */
  function makeStoppable() public onlyAuthorizedChanger {
    stoppable = true;
  }

  /**
    @notice Changes the address which is enable to stop this contract
    @param newStopper Address of the newStopper
    @dev Should be called through governance
   */
  function setStopper(address newStopper) public onlyAuthorizedChanger {
    stopper = newStopper;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


interface IMoCVendors {
    function resetTotalPaidInMoC() external;

    function getIsActive(address account) external view
    returns (bool);

    function getTotalPaidInMoC(address account) external view
    returns (uint256);

    function getStaking(address account) external view
    returns (uint256);

    function getMarkup(address account) external view
    returns (uint256);

    function updatePaidMarkup(address account, uint256 mocAmount, uint256 resTokenAmount) external
    returns (bool);
}

interface IMoCInrate {
    // Transaction types
    // solium-disable mixedcase
    function MINT_RISKPRO_FEES_RESERVE() external view returns(uint8);
    function REDEEM_RISKPRO_FEES_RESERVE() external view returns(uint8);
    function MINT_STABLETOKEN_FEES_RESERVE() external view returns(uint8);
    function REDEEM_STABLETOKEN_FEES_RESERVE() external view returns(uint8);
    function MINT_RISKPROX_FEES_RESERVE() external view returns(uint8);
    function REDEEM_RISKPROX_FEES_RESERVE() external view returns(uint8);
    function MINT_RISKPRO_FEES_MOC() external view returns(uint8);
    function REDEEM_RISKPRO_FEES_MOC() external view returns(uint8);
    function MINT_STABLETOKEN_FEES_MOC() external view returns(uint8);
    function REDEEM_STABLETOKEN_FEES_MOC() external view returns(uint8);
    function MINT_RISKPROX_FEES_MOC() external view returns(uint8);
    function REDEEM_RISKPROX_FEES_MOC() external view returns(uint8);
    // solium-enable mixedcase

    function dailyInratePayment() external returns(uint256);

    function payRiskProHoldersInterestPayment() external returns(uint256);

    function calculateRiskProHoldersInterest() external view returns(uint256, uint256);

    function getRiskProInterestAddress() external view returns(address payable);

    function getRiskProRate() external view returns(uint256);

    function getRiskProInterestBlockSpan() external view returns(uint256);

    function isDailyEnabled() external view returns(bool);

    function isRiskProInterestEnabled() external view returns(bool);

    function commissionsAddress() external view returns(address payable);

    function calcCommissionValue(uint256 reserveAmount, uint8 txType) external view returns(uint256);

    function calculateVendorMarkup(address vendorAccount, uint256 amount) external view returns (uint256 markup);

    function calcStableTokenRedInterestValues(uint256 stableTokenAmount, uint256 reserveAmount) external view returns(uint256);

    function calcMintInterestValues(bytes32 bucket, uint256 reserveAmount) external view returns(uint256);

    function calcFinalRedeemInterestValue(bytes32 bucket, uint256 reserveToRedeem) external view returns(uint256);

    function setRiskProInterestBlockSpan(uint256 newBitProBlockSpan) external;
}

interface IMoC {

    function sendToAddress(address receiver, uint256 tokenAmount) external returns(bool);

    function addReserves(uint256 tokenAmount) external;
}


contract MoCEvents {
  event BucketLiquidation(bytes32 bucket);
  event ContractLiquidated(address mocAddress);
}


contract MoC is MoCEvents, MoCReserve, MoCLibConnection, MoCBase, Stoppable, IMoC {
  using SafeMath for uint256;

  /// @dev Contracts.
  address internal stableToken;
  RiskProToken internal riskProToken;
  MoCRiskProxManager internal riskProxManager;
  IMoCState internal mocState;
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address internal DEPRECATED_mocConverter;
  IMoCSettlement internal settlement;
  IMoCExchange internal mocExchange;
  IMoCInrate internal mocInrate;
  /// @dev 'MoCBurnout' is deprecated. DO NOT use this variable.
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address public DEPRECATED_mocBurnout;

  /// @dev Indicates if ReserveTokens remainder was sent and RiskProToken was paused
  bool internal liquidationExecuted;

  /**
    @dev Initializes the contract
    @param connectorAddress MoCConnector contract address
    @param governorAddress Governor contract address
    @param stopperAddress Stopper contract address
    @param startStoppable Indicates if the contract starts being unstoppable or not
    @param maxGasPrice_ gas price limit to mint and redeem operations
  */
  function initialize(address connectorAddress, address governorAddress, address stopperAddress, bool startStoppable, uint256 maxGasPrice_)
    public
    initializer
  {
    initializePrecisions();
    initializeBase(connectorAddress);
    //initializeContracts
    stableToken = connector.stableToken();
    riskProToken = RiskProToken(connector.riskProToken());
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    mocState = IMoCState(connector.mocState());
    settlement = IMoCSettlement(connector.mocSettlement());
    mocExchange = IMoCExchange(connector.mocExchange());
    mocInrate = IMoCInrate(connector.mocInrate());
    setReserveToken(connector.reserveToken());
    //initializeGovernanceContracts
    Stoppable.initialize(stopperAddress, IGovernor(governorAddress), startStoppable);
    maxGasPrice = maxGasPrice_;
  }

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  // DEPRECATED. 
  // This function was used atomically in upgrade v0115 to migrate stableTokenV1 to stableTokenV2
  // After that, it is removed in this contract version to cannot be called more than once.
  //
  // event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  //
  // /**
  //   @dev Migrates to a new stable token contract
  //   @param newStableTokenAddress_ new stable token contract address
  // */
  // function migrateStableToken(address newStableTokenAddress_) public {
  //   emit StableTokenMigrated(stableToken, newStableTokenAddress_);  
  //   stableToken = newStableTokenAddress_;
  // }

  /****************************INTERFACE*******************************************/

  /**
    @dev Gets the RiskProx balance of an address
    @param bucket Name of the bucket
    @param account Address
    @return RiskProx balance of the address
  */
  function riskProxBalanceOf(bytes32 bucket, address account) public view returns (uint256) {
    return riskProxManager.riskProxBalanceOf(bucket, account);
  }

  /**
    @dev Gets the RedeemRequest at the queue index position
    @param index queue position to get
    @return redeemer's address and amount he submitted
  */
  function getRedeemRequestAt(uint256 index) public view returns (address, uint256) {
    return settlement.getRedeemRequestAt(index);
  }

  /**
    @dev Returns current redeem queue size
    @return redeem queue size
   */
  function redeemQueueSize() public view returns (uint256) {
    return settlement.redeemQueueSize();
  }

  /**
    @dev Returns the total amount of StableTokens in the redeem queue for redeemer
    @param redeemer address for which ^ is computed
    @return total amount of Docs in the redeem queue for redeemer
   */
  function stableTokenAmountToRedeem(address redeemer) public view returns (uint256) {
    return settlement.stableTokenAmountToRedeem(redeemer);
  }

  /**
   * @dev Creates or updates the amount of a StableToken redeem Request from the msg.sender
   * @param stableTokenAmount Amount of StableTokens to redeem on settlement [using mocPrecision]
   */
  function redeemStableTokenRequest(uint256 stableTokenAmount) public whenNotPaused() whenSettlementReady() {
    settlement.addRedeemRequest(stableTokenAmount, msg.sender);
  }

  /**
    @dev Alters the redeem amount position for the redeemer
    @param isAddition true if adding amount to redeem, false to substract.
    @param delta the amount to add/substract to current position
  */
  function alterRedeemRequestAmount(bool isAddition, uint256 delta) public whenNotPaused() whenSettlementReady() {
    settlement.alterRedeemRequestAmount(isAddition, delta, msg.sender);
  }

  /**
    @dev Adding tokens to the token reserve and C0 Bucket without minting any token.
    Could revert.
    @param tokenAmount Amount to deposit.
   */
  function addReserves(uint256 tokenAmount) public {
    safeDepositInReserve(msg.sender, tokenAmount);
    riskProxManager.addValuesToBucket(BUCKET_C0, tokenAmount, 0, 0);
  }

  /**
    @dev Mints RiskPro and pays the comissions of the operation (retrocompatible function).
    @dev Retrocompatible function.
    @param resTokensToMint Amount in ReserveToken to mint
   */
  function mintRiskPro(uint256 resTokensToMint) public {
    mintRiskProVendors(resTokensToMint, address(0));
  }

  /**
    @dev Mints RiskPro and pays the comissions of the operation.
    @param resTokensToMint Amount Reserve Tokens to spend in minting
    @param vendorAccount Vendor address
   */
  function mintRiskProVendors(uint256 resTokensToMint, address vendorAccount)
    public
    whenNotPaused()
    transitionState()
    notInProtectionMode()
    isValidGasPrice()
  {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (
      uint256 totalResTokensSpent,
      uint256 reserveTokenCommission,
      uint256 mocCommission,
      uint256 reserveTokenMarkup,
      uint256 mocMarkup
    ) = mocExchange.mintRiskPro(msg.sender, resTokensToMint, vendorAccount);

    transferCommissions(msg.sender, totalResTokensSpent, reserveTokenCommission, mocCommission, vendorAccount, reserveTokenMarkup, mocMarkup);
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
    @dev Redeems RiskPro Tokens and pays the comissions of the operation (retrocompatible function).
    @param riskProAmount Amout in RiskPro
  */
  function redeemRiskPro(uint256 riskProAmount) public {
    redeemRiskProVendors(riskProAmount, address(0));
  }

  /**
    @dev Redeems RiskPro Tokens and pays the comissions of the operation in ReserveTokens
    @param riskProAmount Amout in RiskPro
    @param vendorAccount Vendor address
  */
  function redeemRiskProVendors(uint256 riskProAmount, address vendorAccount)
    public
    whenNotPaused()
    transitionState()
    atLeastState(IMoCState.States.AboveCobj)
    isValidGasPrice()
  {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (uint256 resTokensAmount, uint256 reserveTokenCommission, uint256 mocCommission, uint256 reserveTokenMarkup, uint256 mocMarkup) = mocExchange
      .redeemRiskPro(msg.sender, riskProAmount, vendorAccount);

    redeemWithCommission(msg.sender, reserveTokenCommission, mocCommission, vendorAccount, reserveTokenMarkup, mocMarkup, resTokensAmount);
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
    @dev StableToken Doc tokens and pays the commisions of the operation (retrocompatible function).
    @dev Retrocompatible function.
    @param resTokensToMint Amount in ReserveToken to mint
  */
  function mintStableToken(uint256 resTokensToMint) public {
    mintStableTokenVendors(resTokensToMint, address(0));
  }

  /**
    @dev Mint StableToken tokens and pays the commisions of the operation
    @param resTokensToMint Amount in ReserveTokens to mint
    @param vendorAccount Vendor address
  */
  function mintStableTokenVendors(uint256 resTokensToMint, address vendorAccount)
    public
    whenNotPaused()
    transitionState()
    atLeastState(IMoCState.States.AboveCobj)
    isValidGasPrice()
  {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (
      uint256 totalResTokensSpent,
      uint256 reserveTokenCommission,
      uint256 mocCommission,
      uint256 reserveTokenMarkup,
      uint256 mocMarkup
    ) = mocExchange.mintStableToken(msg.sender, resTokensToMint, vendorAccount);

    transferCommissions(msg.sender, totalResTokensSpent, reserveTokenCommission, mocCommission, vendorAccount, reserveTokenMarkup, mocMarkup);
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
    @dev Redeems RiskProx Tokens and pays the comissions of the operation in ReserveToken (retrocompatible function).
    @dev Retrocompatible function.
    @param bucket Bucket to reedem, for example X2
    @param riskProxAmount Amount in RiskProx
  */
  function redeemRiskProx(bytes32 bucket, uint256 riskProxAmount) public {
    redeemRiskProxVendors(bucket, riskProxAmount, address(0));
  }

  /**
    @dev Redeems RiskProx Tokens and pays the comissions of the operation in ReserveTokens
    @param bucket Bucket to reedem, for example X2
    @param riskProxAmount Amount in RiskProx
    @param vendorAccount Vendor address
  */
  function redeemRiskProxVendors(bytes32 bucket, uint256 riskProxAmount, address vendorAccount)
    public
  /* Remove modifiers to save some contract size */
  // whenNotPaused() whenSettlementReady() availableBucket(bucket) notBaseBucket(bucket)
  // transitionState() bucketStateTransition(bucket)
  {
    /** UPDATE V0114: 07/02/2023 - Removal of leveraged positions. Please take a look at http://bit.ly/3XPiKUA **/
    revert("Redeem Leveraged position is disabled. See: http://bit.ly/3XPiKUA");
  }

  /**
    @dev BUCKET riskProx riskProx (retrocompatible function).
    @dev Retrocompatible function.
    @param bucket Name of the bucket used
    @param resTokensToMint amount to mint on ReserveToken
  */
  function mintRiskProx(bytes32 bucket, uint256 resTokensToMint) public {
    mintRiskProxVendors(bucket, resTokensToMint, address(0));
  }

  /**
    @dev BUCKET riskProx minting
    @param bucket Name of the bucket used
    @param resTokensToMint amount to mint on ReserveToken
    @param vendorAccount Vendor address
  */
  function mintRiskProxVendors(bytes32 bucket, uint256 resTokensToMint, address vendorAccount)
    public
  /* Remove modifiers to save some contract size */
  // whenNotPaused() whenSettlementReady() availableBucket(bucket) notBaseBucket(bucket)
  // transitionState() bucketStateTransition(bucket)
  {
    /** UPDATE V0114: 07/02/2023 - Removal of leveraged positions. Please take a look at http://bit.ly/3XPiKUA **/
    revert("Mint Leveraged position is disabled. See: http://bit.ly/3XPiKUA");
  }

  /**
    @dev Redeems the requested amount for the msg.sender, or the max amount of free stableTokens possible (retrocompatible function).
    @dev Retrocompatible function.
    @param stableTokenAmount Amount of StableTokens to redeem.
  */
  function redeemFreeStableToken(uint256 stableTokenAmount) public {
    redeemFreeStableTokenVendors(stableTokenAmount, address(0));
  }

  /**
    @dev Redeems the requested amount for the msg.sender, or the max amount of free stableTokens possible.
    @param stableTokenAmount Amount of StableTokens to redeem.
    @param vendorAccount Vendor address
  */
  function redeemFreeStableTokenVendors(uint256 stableTokenAmount, address vendorAccount)
    public
    whenNotPaused()
    transitionState()
    notInProtectionMode()
    isValidGasPrice()
  {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (uint256 resTokensAmount, uint256 reserveTokenCommission, uint256 mocCommission, uint256 reserveTokenMarkup, uint256 mocMarkup) = mocExchange
      .redeemFreeStableToken(msg.sender, stableTokenAmount, vendorAccount);

    redeemWithCommission(msg.sender, reserveTokenCommission, mocCommission, vendorAccount, reserveTokenMarkup, mocMarkup, resTokensAmount);
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
   * @dev Allow redeem on liquidation state, user StableTokens get burned and he receives
   * the equivalent ReserveTokens if can be covered, or the maximum available
   **/
  function redeemAllStableToken() public atState(IMoCState.States.Liquidated) {
    mocExchange.redeemAllStableToken(msg.sender, msg.sender);
  }

  /**
    @dev Moves the daily amount of interest rate to C0 bucket
  */
  function dailyInratePayment() public whenNotPaused() {
    mocInrate.dailyInratePayment();
  }

  /**
    @dev Pays the RiskPro interest and transfers it to the address mocInrate.riskProInterestAddress
    RiskPro interests = Nb (bucket 0) * riskProRate.
  */
  function payRiskProHoldersInterestPayment() public whenNotPaused() {
    uint256 toPay = mocInrate.payRiskProHoldersInterestPayment();
    if (withdraw(toPay, mocInrate.getRiskProInterestAddress())) {
      mocState.substractFromReserves(toPay);
      riskProxManager.substractValuesFromBucket(BUCKET_C0, toPay, 0, 0);
    }
  }

  /**
    @dev Calculates RiskPro holders holder interest by taking the total amount of RBCs available on Bucket 0.
    RiskPro interests = Nb (bucket 0) * riskProRate.
  */
  function calculateRiskProHoldersInterest() public view returns (uint256, uint256) {
    return mocInrate.calculateRiskProHoldersInterest();
  }

  /**
    @dev Gets the target address to transfer RiskPro Holders rate
    @return Target address to transfer RiskPro Holders interest
  */
  function getRiskProInterestAddress() public view returns (address) {
    return mocInrate.getRiskProInterestAddress();
  }

  /**
    @dev Gets the rate for RiskPro Holders
    @return RiskPro Rate
  */
  function getRiskProRate() public view returns (uint256) {
    return mocInrate.getRiskProRate();
  }

  /**
    @dev Gets the blockspan of RiskPro that represents the frecuency of RiskPro holders interest payment
    @return returns power of bitProInterestBlockSpan
  */
  function getRiskProInterestBlockSpan() public view returns (uint256) {
    return mocInrate.getRiskProInterestBlockSpan();
  }

  function isDailyEnabled() public view returns (bool) {
    return mocInrate.isDailyEnabled();
  }

  function isRiskProInterestEnabled() public view returns (bool) {
    return mocInrate.isRiskProInterestEnabled();
  }

  /**
    @dev Indicates if settlement is enabled
    @return Returns true if blockSpan number of blocks has passed since last execution; otherwise false
  */
  function isSettlementEnabled() public view returns (bool) {
    return settlement.isSettlementEnabled();
  }

  /**
    @dev Checks if bucket liquidation is reached.
    @param bucket Name of bucket.
    @return true if bucket liquidation is reached, false otherwise
  */
  function isBucketLiquidationReached(bytes32 bucket) public view returns (bool) {
    if (mocState.coverage(bucket) <= mocState.liq()) {
      return true;
    }
    return false;
  }

  function evalBucketLiquidation(bytes32 bucket) public availableBucket(bucket) notBaseBucket(bucket) whenSettlementReady() {
    if (isBucketLiquidationReached(bucket)) {
      riskProxManager.liquidateBucket(bucket, BUCKET_C0);

      emit BucketLiquidation(bucket);
    }
  }

  /**
    @dev Evaluates if liquidation state has been reached and runs liq if that's the case
  */
  function evalLiquidation() public transitionState() {
    // DO NOTHING. Everything is handled in transitionState() modifier.
  }

  /**
    @dev Runs all settlement process
    @param steps Number of steps
  */
  function runSettlement(uint256 steps) public whenNotPaused() transitionState() {
    // Transfer accums commissions to commissions address
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), settlement.runSettlement(steps));
  }

  /**
    @dev Public function to extract and send tokens from the reserve. Will return false if transfer reverts or fails.
    @param receiver Account to which the tokens will be send
    @param tokenAmount Amount of tokens to send
    @return False if RRC20 transfer fails or revert and true if succeeds
  **/
  function sendToAddress(address receiver, uint256 tokenAmount) public onlyWhitelisted(msg.sender) returns (bool) {
    if (tokenAmount == 0) {
      return true;
    }
    if (withdraw(tokenAmount, receiver)) {
      mocState.substractFromReserves(tokenAmount);
      return true;
    }
    return false;
  }

  function liquidate() internal {
    if (!liquidationExecuted) {
      //pauseRiskProToken
      if (!riskProToken.paused()) {
        riskProToken.pause();
      }
      //sendReservesRemainder
      safeWithdrawFromReserve(mocInrate.commissionsAddress(), mocState.getReservesRemainder());
      liquidationExecuted = true;

      emit ContractLiquidated(connector.moc());
    }
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Internal functions **/

  /**
    @dev Transfer mint operation fees (commissions + vendor markup)
    @param sender address of msg.sender
    @param totalResTokensSpent amount in ReserveToken spent
    @param reserveTokenCommission commission amount in ReserveToken
    @param mocCommission commission amount in MoC
    @param vendorAccount address of vendor
    @param reserveTokenMarkup vendor markup in ReserveToken
    @param mocMarkup vendor markup in MoC
  */
  // solium-disable-next-line security/no-assign-params
  function transferCommissions(
    address sender,
    uint256 totalResTokensSpent,
    uint256 reserveTokenCommission,
    uint256 mocCommission,
    address vendorAccount,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup
  ) internal {
    // Need to update general State
    mocState.addToReserves(totalResTokensSpent);
    require(
      deposit(totalResTokensSpent.add(reserveTokenCommission).add(reserveTokenMarkup), sender),
      "Token deposit failed on RRC20 Reserve token transfer"
    );

    transferMocCommission(sender, mocCommission, vendorAccount, mocMarkup);

    transferReserveTokenCommission(vendorAccount, reserveTokenCommission, reserveTokenMarkup);
  }

  /**
    @dev Transfer operation fees in MoC (commissions + vendor markup)
    @param sender address of msg.sender
    @param mocCommission commission amount in MoC
    @param vendorAccount address of vendor
    @param mocMarkup vendor markup in MoC
  */
  // solium-disable-next-line security/no-assign-params
  function transferMocCommission(address sender, uint256 mocCommission, address vendorAccount, uint256 mocMarkup) internal {
    uint256 totalMoCFee = mocCommission.add(mocMarkup);
    // If commission and markup are paid in MoC
    if (totalMoCFee > 0) {
      IMoCVendors mocVendors = IMoCVendors(mocState.getMoCVendors());
      // Transfer MoC from sender to this contract
      IERC20 mocToken = IERC20(mocState.getMoCToken());

      // Transfer vendor markup in MoC
      if (mocVendors.updatePaidMarkup(vendorAccount, mocMarkup, 0)) {
        // Transfer MoC to vendor address
        mocToken.transferFrom(sender, vendorAccount, mocMarkup);
        // Transfer MoC to commissions address
        mocToken.transferFrom(sender, mocInrate.commissionsAddress(), mocCommission);
      } else {
        // Transfer MoC to commissions address
        mocToken.transferFrom(sender, mocInrate.commissionsAddress(), totalMoCFee);
      }
    }
  }

  /**
    @dev Transfer redeem operation fees (commissions + vendor markup)
    @param sender address of msg.sender
    @param reserveTokenCommission commission amount in ReserveToken
    @param mocCommission commission amount in MoC
    @param vendorAccount address of vendor
    @param reserveTokenMarkup vendor markup in ReserveToken
    @param mocMarkup vendor markup in MoC
  */
  function redeemWithCommission(
    address sender,
    uint256 reserveTokenCommission,
    uint256 mocCommission,
    address vendorAccount,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    uint256 reserveTokenAmount
  ) internal {
    safeWithdraw(sender, reserveTokenAmount);
    mocState.substractFromReserves(reserveTokenAmount.add(reserveTokenCommission).add(reserveTokenMarkup));

    transferMocCommission(sender, mocCommission, vendorAccount, mocMarkup);

    transferReserveTokenCommission(vendorAccount, reserveTokenCommission, reserveTokenMarkup);
  }

  /**
    @dev Transfer operation fees in ReserveToken (commissions + vendor markup)
    @param vendorAccount address of vendor
    @param reserveTokenCommission commission amount in ReserveToken
    @param reserveTokenMarkup vendor markup in ReserveToken
  */
  function transferReserveTokenCommission(address vendorAccount, uint256 reserveTokenCommission, uint256 reserveTokenMarkup) internal {
    uint256 totalResTokenFee = reserveTokenCommission.add(reserveTokenMarkup);
    //(uint256 reserveTokenMarkupInMoC, , ) = mocExchange.convertToMoCPrice(reserveTokenMarkup);

    if (totalResTokenFee > 0) {
      IMoCVendors mocVendors = IMoCVendors(mocState.getMoCVendors());
      // Transfer vendor markup in MoC
      if (mocVendors.updatePaidMarkup(vendorAccount, 0, reserveTokenMarkup)) {
        // Transfer ReserveToken to vendor address
        safeWithdraw(vendorAccount, reserveTokenMarkup);
        // Transfer ReserveToken to commissions address
        safeWithdraw(mocInrate.commissionsAddress(), reserveTokenCommission);
      } else {
        // Transfer ReserveToken to commissions address
        safeWithdraw(mocInrate.commissionsAddress(), totalResTokenFee);
      }
    }
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
    @dev Extracts tokens from the reserve and update mocState but reverts if token transfer fails
    @param receiver Account to which the tokens will be send
    @param tokenAmount Amount to extract from reserve
   */
  function safeWithdrawFromReserve(address receiver, uint256 tokenAmount) internal {
    safeWithdraw(receiver, tokenAmount);
    mocState.substractFromReserves(tokenAmount);
  }

  /**
    @dev Extracts tokens from the reserve
    @param receiver Account from which the tokens will be taken
    @param tokenAmount Amount to deposit
   */
  function safeWithdraw(address receiver, uint256 tokenAmount) internal {
    require(withdraw(tokenAmount, receiver), "Token withdrawal failed on RRC20 Reserve token transfer");
  }

  /**
    @dev Extracts tokens from the reserve and update mocState
    @param receiver Account from which the tokens will be taken
    @param tokenAmount Amount to deposit
   */
  function safeDepositInReserve(address receiver, uint256 tokenAmount) private {
    require(deposit(tokenAmount, receiver), "Token deposit failed on RRC20 Reserve token transfer");
    mocState.addToReserves(tokenAmount);
  }

  /***** STATE MODIFIERS *****/
  modifier whenSettlementReady() {
    require(settlement.isSettlementReady(), "Function can only be called when settlement is ready");
    _;
  }

  modifier atState(IMoCState.States _state) {
    require(mocState.state() == _state, "Function cannot be called at this state.");
    _;
  }

  modifier atLeastState(IMoCState.States _state) {
    require(mocState.state() >= _state, "Function cannot be called at this state.");
    _;
  }

  modifier atMostState(IMoCState.States _state) {
    require(mocState.state() <= _state, "Function cannot be called at this state.");
    _;
  }

  modifier notInProtectionMode() {
    require(mocState.globalCoverage() > mocState.getProtected(), "Function cannot be called at protection mode.");
    _;
  }

  modifier bucketStateTransition(bytes32 bucket) {
    evalBucketLiquidation(bucket);
    _;
  }

  modifier availableBucket(bytes32 bucket) {
    require(riskProxManager.isAvailableBucket(bucket), "Bucket is not available");
    _;
  }

  modifier notBaseBucket(bytes32 bucket) {
    require(!riskProxManager.isBucketBase(bucket), "Bucket should not be a base type bucket");
    _;
  }

  modifier transitionState() {
    mocState.nextState();
    if (mocState.state() == IMoCState.States.Liquidated) {
      liquidate();
    } else _;
  }

  /**
   * @notice validate that the given gas price is less or equal to the gas price limit
   */
  modifier isValidGasPrice() {
    require(tx.gasprice <= maxGasPrice, "gas price is above the max allowed");
    _;
  }

  /**
   * @notice only executed by the pauser or an authorized changer
   *  The pauser is a multisig that could be used in some cases to speed up a
   *  change if it is necessary
   */
  modifier onlyAuthorizedChangerOrPauser() {
    require(stopper == msg.sender || governor.isAuthorizedChanger(msg.sender), "not authorized changer or stopper");
    _;
  }

  /**
   * @notice update the gas price limit
   * @param maxGasPrice_ new gas price limit
   */
  function setMaxGasPrice(uint256 maxGasPrice_) external onlyAuthorizedChangerOrPauser() {
    maxGasPrice = maxGasPrice_;
  }

  uint256 public maxGasPrice;

  ////////////////////
  // Flux Capacitor //
  ////////////////////

  /**
   * @notice update the max absolute operation allowed
   * @param maxAbsoluteOperation_ new max absolute operation allowed
   */
  function setMaxAbsoluteOperation(uint256 maxAbsoluteOperation_) external onlyAuthorizedChangerOrPauser() {
    mocExchange.setMaxAbsoluteOperation(maxAbsoluteOperation_);
  }

  /**
   * @notice update the max operational difference allowed
   * @param maxOperationalDifference_ new max operational difference allowed
   */
  function setMaxOperationalDifference(uint256 maxOperationalDifference_) external onlyAuthorizedChangerOrPauser() {
    mocExchange.setMaxOperationalDifference(maxOperationalDifference_);
  }

  /**
   * @notice update the decay block span
   * @param decayBlockSpan_ new decay block span
   */
  function setDecayBlockSpan(uint256 decayBlockSpan_) external onlyAuthorizedChangerOrPauser() {
    mocExchange.setDecayBlockSpan(decayBlockSpan_);
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[49] private __gap;
}


contract MoC_v0116_2 is MoC {

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  
  /**
    @dev Migrates to a new stable token contract
    @param newStableTokenAddress_ new stable token contract address
  */
  function migrateStableToken(address newStableTokenAddress_) public {
    emit StableTokenMigrated(stableToken, newStableTokenAddress_);
    stableToken = newStableTokenAddress_;
  }
}



/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCConnector_v0116_2 is MoCConnector {

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  
  /**
    @dev Migrates to a new stable token contract
    @param newStableTokenAddress_ new stable token contract address
  */
  function migrateStableToken(address newStableTokenAddress_) public {
    emit StableTokenMigrated(stableToken, newStableTokenAddress_);
    // remove stableToken from the whitelist
    remove(stableToken);
    stableToken = newStableTokenAddress_;
  }
}





/** 
 * UPDATE V0116_2: 09/2023: StableToken replace by ../hardhat/contracts/StableTokenV2.sol
 * @notice DEPRECATED: Stable token is no longer RDOC but USDRIF
 */
contract StableToken is ERC20Detailed, OwnerBurnableToken {

  // DEPRECATED
  string private _name = "RIF Dollar on Chain";
  // DEPRECATED
  string private _symbol = "RDOC";
  uint8 private _decimals = 18;

  /**
    @dev Constructor
  */
  constructor() Ownable() ERC20Detailed(_name, _symbol, _decimals) public {

  }

  /**
    @dev Fallback function
  */
  function() external {
  }
}



contract MoCToken is ERC20Detailed, OwnerBurnableToken {

  string private _name = "MoC";
  string private _symbol = "MOC";
  uint8 private _decimals = 18;

  /**
    @dev Constructor
  */
  constructor() Ownable() ERC20Detailed(_name, _symbol, _decimals) public {

  }

  /**
    @dev Fallback function
  */
  function() external {
  }
}


contract MoCExchangeEvents {
  event RiskProMint(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
  event RiskProWithDiscountMint(uint256 riskProTecPrice, uint256 riskProDiscountPrice, uint256 amount);
  event RiskProRedeem(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
  event StableTokenMint(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
  event StableTokenRedeem(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
  event FreeStableTokenRedeem(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 interests,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );

  event RiskProxMint(
    bytes32 bucket,
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 interests,
    uint256 leverage,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );

  event RiskProxRedeem(
    bytes32 bucket,
    address indexed account,
    uint256 commission,
    uint256 amount,
    uint256 reserveTotal,
    uint256 interests,
    uint256 leverage,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
}


contract MoCExchange is MoCExchangeEvents, MoCBase, MoCLibConnection {
  using Math for uint256;
  using SafeMath for uint256;

  // Contracts
  IMoCState internal mocState;
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address internal DEPRECATED_mocConverter;
  MoCRiskProxManager internal riskProxManager;
  RiskProToken internal riskProToken;
  StableToken internal stableToken;
  IMoCInrate internal mocInrate;
  IMoC internal moc;

  /**
    @dev Initializes the contract
    @param connectorAddress MoCConnector contract address
  */
  function initialize(address connectorAddress) public initializer {
    initializePrecisions();
    initializeBase(connectorAddress);
    initializeContracts();
  }

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  // DEPRECATED. 
  // This function was used atomically in upgrade v0115 to migrate stableTokenV1 to stableTokenV2
  // After that, it is removed in this contract version to cannot be called more than once.
  //
  // event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  //
  // /**
  //   @dev Migrates to a new stable token contract
  //     Mints the new tokens to bridge contract in the same amount of the total supply of the old ones,
  //     so that they can later be exchanged.
  //     This contract must have minter and burner roles set on it
  //   @param newStableTokenAddress_ new stable token contract address
  //   @param bridgeAddress_ contract that will receive the new tokens and be able to distribute them
  // */
  // function migrateStableToken(address newStableTokenAddress_, address bridgeAddress_) public {
  //   uint256 totalSupply = stableToken.totalSupply();
  //   emit StableTokenMigrated(address(stableToken), newStableTokenAddress_);
  //   stableToken = StableToken(newStableTokenAddress_);
  //   stableToken.mint(bridgeAddress_, totalSupply);
  // }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Public functions **/

  /**
   @dev Converts MoC commission from ReserveToken to MoC price
   @param owner address of token owner
   @param spender address of token spender
   @return MoC balance of owner and MoC allowance of spender
  */
  function getMoCTokenBalance(address owner, address spender) public view returns (uint256 mocBalance, uint256 mocAllowance) {
    mocBalance = 0;
    mocAllowance = 0;

    MoCToken mocToken = MoCToken(mocState.getMoCToken());

    if (address(mocToken) != address(0)) {
      // Get balance and allowance from sender
      mocBalance = mocToken.balanceOf(owner);
      mocAllowance = mocToken.allowance(owner, spender);
    }

    return (mocBalance, mocAllowance);
  }

  /**
   @dev Calculates commissions in MoC and ReserveToken
   @param params Params defined in CommissionParamsStruct
   @return Commissions calculated in MoC price and ReserveToken price; and ReserveToken and MoC prices
  */
  function calculateCommissionsWithPrices(CommissionParamsStruct memory params) public view returns (CommissionReturnStruct memory ret) {
    ret.reserveTokenPrice = mocState.getReserveTokenPrice();
    ret.mocPrice = mocState.getMoCPrice();
    require(ret.reserveTokenPrice > 0, "Reserve Token price zero");
    require(ret.mocPrice > 0, "MoC price zero");
    // Calculate vendor markup
    uint256 reserveTokenMarkup = mocInrate.calculateVendorMarkup(params.vendorAccount, params.amount);

    // Get balance and allowance from sender
    (uint256 mocBalance, uint256 mocAllowance) = getMoCTokenBalance(params.account, address(moc));
    if (mocAllowance == 0 || mocBalance == 0) {
      // Check commission rate in Reserve Token according to transaction type
      ret.reserveTokenCommission = mocInrate.calcCommissionValue(params.amount, params.txTypeFeesReserveToken);
      ret.reserveTokenMarkup = reserveTokenMarkup;
      // Implicitly mocCommission = 0 and mocMarkup = 0.
      return ret;
    }

    // Check commission rate in MoC according to transaction type
    uint256 mocCommissionInReserveToken = mocInrate.calcCommissionValue(params.amount, params.txTypeFeesMOC);

    // Calculate amount in MoC
    ret.mocCommission = ret.reserveTokenPrice.mul(mocCommissionInReserveToken).div(ret.mocPrice);
    // Implicitly reserveTokenCommission = 0

    // Calculate vendor markup
    ret.mocMarkup = ret.reserveTokenPrice.mul(reserveTokenMarkup).div(ret.mocPrice);
    // Implicitly reserveTokenMarkup = 0

    uint256 totalMoCFee = ret.mocCommission.add(ret.mocMarkup);

    // Check if there is enough balance of MoC
    if ((!(mocBalance >= totalMoCFee && mocAllowance >= totalMoCFee)) || (mocCommissionInReserveToken == 0)) {
      // Insufficient funds
      ret.mocCommission = 0;
      ret.mocMarkup = 0;

      // Check commission rate in ReserveToken according to transaction type
      ret.reserveTokenCommission = mocInrate.calcCommissionValue(params.amount, params.txTypeFeesReserveToken);
      ret.reserveTokenMarkup = reserveTokenMarkup;
    }

    return ret;
  }

  /**
   * @dev Reserve token equivalent for the amount of riskPro given applying the spotDiscountRate
   * @param riskProAmount amount of RiskPro [using mocPrecision]
   * @param riskProTecPrice price of RiskPro without discounts [using mocPrecision]
   * @param riskProDiscountRate RiskPro discounts [using mocPrecision]
   * @return Reserve token amount
   */
  function riskProDiscToResToken(uint256 riskProAmount, uint256 riskProTecPrice, uint256 riskProDiscountRate) internal view returns (uint256) {
    uint256 totalResTokenValue = mocLibConfig.totalRiskProInResTokens(riskProAmount, riskProTecPrice);
    return mocLibConfig.applyDiscountRate(totalResTokenValue, riskProDiscountRate);
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
   @dev Mint RiskPros and give it to the msg.sender
   @param account Address of minter
   @param reserveTokenAmount Amount in ReserveToken to mint
   @param vendorAccount Vendor address
  */
  function mintRiskPro(address account, uint256 reserveTokenAmount, address vendorAccount)
    external
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    RiskProMintStruct memory details;

    details.riskProRegularPrice = mocState.riskProTecPrice();
    details.finalRiskProAmount = 0;
    details.reserveTokenValue = 0;

    if (mocState.state() == IMoCState.States.RiskProDiscount) {
      details.discountPrice = mocState.riskProDiscountPrice();
      details.riskProDiscountAmount = mocLibConfig.maxRiskProWithResTokens(reserveTokenAmount, details.discountPrice);

      details.finalRiskProAmount = Math.min(details.riskProDiscountAmount, mocState.maxRiskProWithDiscount());
      details.reserveTokenValue = details.finalRiskProAmount == details.riskProDiscountAmount
        ? reserveTokenAmount
        : riskProDiscToResToken(details.finalRiskProAmount, details.riskProRegularPrice, mocState.riskProSpotDiscountRate());

      emit RiskProWithDiscountMint(details.riskProRegularPrice, details.discountPrice, details.finalRiskProAmount);
    }

    if (reserveTokenAmount != details.reserveTokenValue) {
      details.regularRiskProAmount = mocLibConfig.maxRiskProWithResTokens(
        reserveTokenAmount.sub(details.reserveTokenValue),
        details.riskProRegularPrice
      );
      details.finalRiskProAmount = details.finalRiskProAmount.add(details.regularRiskProAmount);
    }

    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    CommissionParamsStruct memory params;
    params.account = account;
    params.amount = reserveTokenAmount;
    params.txTypeFeesMOC = mocInrate.MINT_RISKPRO_FEES_MOC();
    params.txTypeFeesReserveToken = mocInrate.MINT_RISKPRO_FEES_RESERVE();
    params.vendorAccount = vendorAccount;

    (details.commission) = calculateCommissionsWithPrices(params);

    mintRiskProInternal(account, reserveTokenAmount, details, vendorAccount);

    return (
      reserveTokenAmount,
      details.commission.reserveTokenCommission,
      details.commission.mocCommission,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup
    );
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
   @dev Sender burns his RiskProS and redeems the equivalent ReserveTokens
   @param account Address of the redeeemer
   @param riskProAmount Amount of RiskPros to be redeemed
   @param vendorAccount Vendor address
   @return resTokens to transfer to the redeemer and commission spent, using [using reservePrecision]
  */
  function redeemRiskPro(address account, uint256 riskProAmount, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    RiskProRedeemStruct memory details;

    uint256 userBalance = riskProToken.balanceOf(account);
    uint256 userAmount = Math.min(riskProAmount, userBalance);

    details.riskProFinalAmount = Math.min(userAmount, mocState.absoluteMaxRiskPro());
    uint256 totalReserveToken = mocLibConfig.totalRiskProInResTokens(details.riskProFinalAmount, mocState.riskProTecPrice());

    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    CommissionParamsStruct memory params;
    params.account = account;
    params.amount = totalReserveToken;
    params.txTypeFeesMOC = mocInrate.REDEEM_RISKPRO_FEES_MOC();
    params.txTypeFeesReserveToken = mocInrate.REDEEM_RISKPRO_FEES_RESERVE();
    params.vendorAccount = vendorAccount;

    (details.commission) = calculateCommissionsWithPrices(params);
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

    // Mint token
    riskProToken.burn(account, details.riskProFinalAmount);

    // Update Buckets
    riskProxManager.substractValuesFromBucket(BUCKET_C0, totalReserveToken, 0, details.riskProFinalAmount);

    details.reserveTokenTotalWithoutCommission = totalReserveToken.sub(details.commission.reserveTokenCommission).sub(
      details.commission.reserveTokenMarkup
    );

    redeemRiskProInternal(account, details, vendorAccount);

    return (
      details.reserveTokenTotalWithoutCommission,
      details.commission.reserveTokenCommission,
      details.commission.mocCommission,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup
    );
  }

  /**
   @dev Redeems the requested amount for the account, or the max amount of free stableTokens possible.
   @param account Address of the redeeemer
   @param stableTokenAmount Amount of StableTokens to redeem [using mocPrecision]
   @param vendorAccount Vendor address
   @return resTokens to transfer to the redeemer and commission spent, using [using reservePrecision]
  */
  function redeemFreeStableToken(address account, uint256 stableTokenAmount, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    if (stableTokenAmount <= 0) {
      return (0, 0, 0, 0, 0);
    } else {
      FreeStableTokenRedeemStruct memory details;
      details.finalStableTokenAmount = Math.min(stableTokenAmount, Math.min(mocState.freeStableToken(), stableToken.balanceOf(account)));
      uint256 stableTokensReserveTokenValue = mocState.stableTokensToResToken(details.finalStableTokenAmount);

      details.reserveTokenInterestAmount = mocInrate.calcStableTokenRedInterestValues(
        details.finalStableTokenAmount,
        stableTokensReserveTokenValue
      );
      details.finalReserveTokenAmount = stableTokensReserveTokenValue.sub(details.reserveTokenInterestAmount);

      /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
      CommissionParamsStruct memory params;
      params.account = account;
      params.amount = details.finalReserveTokenAmount;
      params.txTypeFeesMOC = mocInrate.REDEEM_STABLETOKEN_FEES_MOC();
      params.txTypeFeesReserveToken = mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE();
      params.vendorAccount = vendorAccount;

      (details.commission) = calculateCommissionsWithPrices(params);

      uint256 reserveTokenToRedeem = details.finalReserveTokenAmount.sub(details.commission.reserveTokenCommission).sub(
        details.commission.reserveTokenMarkup
      );
      // reverts if not allowed by accumulators
      _updateAccumulatorsOnRedeem(reserveTokenToRedeem);

      /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

      doStableTokenRedeem(account, details.finalStableTokenAmount, stableTokensReserveTokenValue);
      riskProxManager.payInrate(BUCKET_C0, details.reserveTokenInterestAmount);

      redeemFreeStableTokenInternal(account, details, vendorAccount);

      return (
        reserveTokenToRedeem,
        details.commission.reserveTokenCommission,
        details.commission.mocCommission,
        details.commission.reserveTokenMarkup,
        details.commission.mocMarkup
      );
    }
  }

  /**
   @dev Mint Max amount of StableTokens and give it to the msg.sender
   @param account minter user address
   @param resTokensToMint resTokens amount the user intents to convert to StableToken [using rbtPresicion]
   @param vendorAccount Vendor address
   @return the actual amount of resTokens used and the resTokens commission for them [using rbtPresicion]
  */
  function mintStableToken(address account, uint256 resTokensToMint, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    StableTokenMintStruct memory details;

    // StableTokens to issue with tx value amount
    if (resTokensToMint > 0) {
      uint256 resTokenPrice = mocState.getReserveTokenPrice();
      details.stableTokens = mocLibConfig.maxStableTokensWithResTokens(resTokensToMint, resTokenPrice); //reserve token to stable token
      details.stableTokenAmount = Math.min(details.stableTokens, mocState.absoluteMaxStableToken());
      details.totalCost = details.stableTokenAmount == details.stableTokens
        ? resTokensToMint
        : mocLibConfig.stableTokensResTokensValue(details.stableTokenAmount, mocState.peg(), resTokenPrice);

      // reverts if not allowed by accumulators
      _updateAccumulatorsOnMint(details.totalCost);
      // Mint Token
      stableToken.mint(account, details.stableTokenAmount);

      // Update Buckets
      riskProxManager.addValuesToBucket(BUCKET_C0, details.totalCost, details.stableTokenAmount, 0);

      /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
      CommissionParamsStruct memory params;
      params.account = account;
      params.amount = details.totalCost;
      params.txTypeFeesMOC = mocInrate.MINT_STABLETOKEN_FEES_MOC();
      params.txTypeFeesReserveToken = mocInrate.MINT_STABLETOKEN_FEES_RESERVE();
      params.vendorAccount = vendorAccount;

      (details.commission) = calculateCommissionsWithPrices(params);

      mintStableTokenInternal(account, details, vendorAccount);

      /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

      return (
        details.totalCost,
        details.commission.reserveTokenCommission,
        details.commission.mocCommission,
        details.commission.reserveTokenMarkup,
        details.commission.mocMarkup
      );
    }

    return (0, 0, 0, 0, 0);
  }

  /**
   @dev User StableTokens get burned and he receives the equivalent ReserveTokens in return
   @param userAddress Address of the user asking to redeem
   @param amount Verified amount of StableTokens to be redeemed [using mocPrecision]
   @param reservePrice resToken price [using mocPrecision]
   @return true and commission spent if resTokens send was completed, false if fails.
  */
  function redeemStableTokenWithPrice(address userAddress, uint256 amount, uint256 reservePrice)
    public
    onlyWhitelisted(msg.sender)
    returns (bool, uint256)
  {
    StableTokenRedeemStruct memory details;

    details.totalReserveToken = mocLibConfig.stableTokensResTokensValue(amount, mocState.peg(), reservePrice); // stable token to reserve token

    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    // Check commission rate in Reserve according to transaction type
    details.commission.reserveTokenCommission = mocInrate.calcCommissionValue(
      details.totalReserveToken,
      mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE()
    );
    details.commission.reserveTokenMarkup = 0;
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

    details.reserveTokenToRedeem = details.totalReserveToken.sub(details.commission.reserveTokenCommission).sub(
      details.commission.reserveTokenMarkup
    );

    // reverts if not allowed by accumulators
    _updateAccumulatorsOnRedeem(details.reserveTokenToRedeem);

    bool result = moc.sendToAddress(userAddress, details.reserveTokenToRedeem);

    details.reserveTotal = details.totalReserveToken.sub(details.commission.reserveTokenCommission).sub(details.commission.reserveTokenMarkup);
    details.commission.reserveTokenPrice = mocState.getReserveTokenPrice();
    details.commission.mocCommission = 0;
    details.commission.mocPrice = 0;
    details.commission.mocMarkup = 0;

    // If sends fail, then no redemption is executed
    if (result) {
      doStableTokenRedeem(userAddress, amount, details.totalReserveToken);
      redeemStableTokenWithPriceInternal(userAddress, amount, details, address(0));
    }

    return (result, details.commission.reserveTokenCommission);
  }

  /**
   @dev Allow redeem on liquidation state, user StableTokens get burned and he receives
   the equivalent ReserveTokens according to liquidationPrice
   @param origin address owner of the StableTokens
   @param destination address to send the ReserveTokens
   @return The amount of ReserveTokens in sent for the redemption or 0 if send does not succed
  */
  function redeemAllStableToken(address origin, address destination) public onlyWhitelisted(msg.sender) returns (uint256) {
    uint256 userStableTokenBalance = stableToken.balanceOf(origin);
    if (userStableTokenBalance == 0) return 0;

    uint256 liqPrice = mocState.getLiquidationPrice();
    // [USD * ReserveTokens / USD]
    // stable tokens to reserve tokens
    uint256 totalResTokens = mocLibConfig.stableTokensResTokensValue(userStableTokenBalance, mocState.peg(), liqPrice);
    // If send fails we don't burn the tokens
    if (moc.sendToAddress(destination, totalResTokens)) {
      stableToken.burn(origin, userStableTokenBalance);
      emit StableTokenRedeem(origin, userStableTokenBalance, totalResTokens, 0, liqPrice, 0, 0, 0, 0, address(0));

      return totalResTokens;
    } else {
      return 0;
    }
  }

  /**
   @dev BUCKET RiskProx minting. Mints RiskProx for the specified bucket
   @param account owner of the new minted RiskProx
   @param bucket bucket name
   @param resTokensToMint resToken amount to mint [using reservePrecision]
   @param vendorAccount Vendor address
   @return total ReserveTokens Spent (resTokensToMint more interest) and commission spent [using reservePrecision]
  */
  function mintRiskProx(address payable account, bytes32 bucket, uint256 resTokensToMint, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    /** UPDATE V0114: 07/02/2023 - Removal of leveraged positions. Please take a look at http://bit.ly/3XPiKUA **/
    revert("Mint Leveraged position is disabled. See: http://bit.ly/3XPiKUA");
  }

  /**
   @dev Sender burns his RiskProx, redeems the equivalent amount of RiskPros, return
   the "borrowed" StableTokens and recover pending interests
   @param account user address to redeem riskProx from
   @param bucket Bucket where the RiskProxs are hold
   @param riskProxAmount Amount of RiskProxs to be redeemed [using reservePrecision]
   @param vendorAccount Vendor address
   @return the actual amount of resTokens to redeem and the resTokens commission for them [using reservePresicion]
  */
  function redeemRiskProx(address payable account, bytes32 bucket, uint256 riskProxAmount, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    /** UPDATE V0114: 07/02/2023 - Removal of leveraged positions. Please take a look at http://bit.ly/3XPiKUA **/
    revert("Redeem Leveraged position is disabled. See: http://bit.ly/3XPiKUA");
  }

  /**
    @dev Burns user RiskProx and sends the equivalent amount of ReserveTokens
    to the account without caring if transaction succeeds
    @param bucket Bucket where the RiskProxs are hold
    @param account user address to redeem riskProx from
    @param riskProxAmount Amount of RiskProx to redeem [using mocPrecision]
    @param riskProxPrice Price of one RiskProx in ReserveTokens [using reservePrecision]
    @return result of the ReserveTokens sending transaction
  */
  function forceRedeemRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice)
    public
    onlyWhitelisted(msg.sender)
    returns (bool)
  {
    // Do burning part of the redemption
    uint256 totalAmount = burnRiskProxFor(bucket, account, riskProxAmount, riskProxPrice);

    // Send transaction can only fail for external code
    // if transaction fails, user will lost his ReserveTokens and RiskProx
    return moc.sendToAddress(account, totalAmount);
  }

  /**
    @dev Burns user RiskProx
    @param bucket Bucket where the RiskProxs are hold
    @param account user address to redeem riskProx from
    @param riskProxAmount Amount of RiskProx to redeem [using reservePrecision]
    @param riskProxPrice Price of one RiskProx in ReserveTokens [using reservePrecision]
    @return ResToken total value of the redemption [using reservePrecision]
  **/
  function burnRiskProxFor(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256)
  {
    // Calculate total ReserveTokens
    uint256 totalAmount = mocLibConfig.riskProResTokensValuet(riskProxAmount, riskProxPrice);
    riskProxManager.removeRiskProx(bucket, account, riskProxAmount, totalAmount);

    return totalAmount;
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Internal functions **/

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function redeemRiskProxInternal(
    address account,
    bytes32 bucket,
    uint256 riskProxAmount,
    RiskProxRedeemStruct memory details,
    address vendorAccount
  ) internal {
    emit RiskProxRedeem(
      bucket,
      account,
      details.commission.reserveTokenCommission,
      riskProxAmount,
      details.reserveTokenTotalWithoutCommission,
      details.resTokenInterests,
      details.bucketLev,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function mintRiskProInternal(address account, uint256 reserveTokenAmount, RiskProMintStruct memory details, address vendorAccount) internal {
    riskProToken.mint(account, details.finalRiskProAmount);
    riskProxManager.addValuesToBucket(BUCKET_C0, reserveTokenAmount, 0, details.finalRiskProAmount);

    emit RiskProMint(
      account,
      details.finalRiskProAmount,
      reserveTokenAmount,
      details.commission.reserveTokenCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function mintRiskProxInternal(address account, bytes32 bucket, RiskProxMintStruct memory details, address vendorAccount) internal {
    emit RiskProxMint(
      bucket,
      account,
      details.riskProxToMint,
      details.finalReserveTokenToMint,
      details.reserveTokenInterestAmount,
      details.lev,
      details.commission.reserveTokenCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function mintStableTokenInternal(address account, StableTokenMintStruct memory details, address vendorAccount) internal {
    emit StableTokenMint(
      account,
      details.stableTokenAmount,
      details.totalCost,
      details.commission.reserveTokenCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function redeemFreeStableTokenInternal(address account, FreeStableTokenRedeemStruct memory details, address vendorAccount) internal {
    emit FreeStableTokenRedeem(
      account,
      details.finalStableTokenAmount,
      details.finalReserveTokenAmount,
      details.commission.reserveTokenCommission,
      details.reserveTokenInterestAmount,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function redeemRiskProInternal(address account, RiskProRedeemStruct memory details, address vendorAccount) internal {
    emit RiskProRedeem(
      account,
      details.riskProFinalAmount,
      details.reserveTokenTotalWithoutCommission,
      details.commission.reserveTokenCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function redeemStableTokenWithPriceInternal(address account, uint256 amount, StableTokenRedeemStruct memory details, address vendorAccount)
    internal
  {
    emit StableTokenRedeem(
      account, //userAddress,
      amount,
      details.reserveTotal,
      details.commission.reserveTokenCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
    @dev Calculates the amount of ReserveTokens that one bucket should move to another in
    RiskProx minting/redemption. This extra makes RiskProx more leveraging than RiskPro.
    @param bucketFrom Origin bucket from which the ReserveTokens are moving
    @param bucketTo Destination bucket to which the ReserveTokens are moving
    @param totalReserveToken Amount of ReserveTokens moving between buckets [using reservePrecision]
    @param lev lev of the L bucket [using mocPrecision]
  */
  function moveExtraFundsToBucket(bytes32 bucketFrom, bytes32 bucketTo, uint256 totalReserveToken, uint256 lev) internal {
    uint256 resTokensToMove = mocLibConfig.bucketTransferAmount(totalReserveToken, lev);
    uint256 stableTokensToMove = mocState.resTokenToStableToken(resTokensToMove);

    uint256 resTokensToMoveFinal = Math.min(resTokensToMove, riskProxManager.getBucketNReserve(bucketFrom));
    uint256 stableTokensToMoveFinal = Math.min(stableTokensToMove, riskProxManager.getBucketNStableToken(bucketFrom));

    riskProxManager.moveResTokensAndStableTokens(bucketFrom, bucketTo, resTokensToMoveFinal, stableTokensToMoveFinal);
  }

  /**
   @dev Returns ReserveTokens for user in concept of interests refund
   @param bucket Bucket where the RiskProxs are hold
   @param resTokenToRedeem Total ReserveTokens value of the redemption [using mocPrecision]
   @return Interests [using reservePrecision]
  */
  function recoverInterests(bytes32 bucket, uint256 resTokenToRedeem) internal returns (uint256) {
    uint256 resTokenInterests = mocInrate.calcFinalRedeemInterestValue(bucket, resTokenToRedeem);

    return riskProxManager.recoverInrate(BUCKET_C0, resTokenInterests);
  }

  function doStableTokenRedeem(address userAddress, uint256 stableTokenAmount, uint256 totalReserveToken) internal {
    stableToken.burn(userAddress, stableTokenAmount);
    riskProxManager.substractValuesFromBucket(BUCKET_C0, totalReserveToken, stableTokenAmount, 0);
  }

  function initializeContracts() internal {
    moc = IMoC(connector.moc());
    stableToken = StableToken(connector.stableToken());
    riskProToken = RiskProToken(connector.riskProToken());
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    mocState = IMoCState(connector.mocState());
    mocInrate = IMoCInrate(connector.mocInrate());
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Structs **/

  struct RiskProxRedeemStruct {
    uint256 totalReserveTokenRedeemed;
    uint256 reserveTokenTotalWithoutCommission;
    uint256 resTokenInterests;
    uint256 bucketLev;
    uint256 riskProxToRedeem;
    uint256 resTokenToRedeem;
    uint256 riskProxPrice;
    CommissionReturnStruct commission;
  }

  struct RiskProxMintStruct {
    uint256 riskProxToMint;
    uint256 finalReserveTokenToMint;
    uint256 reserveTokenInterestAmount;
    uint256 lev;
    CommissionReturnStruct commission;
  }

  struct RiskProRedeemStruct {
    uint256 riskProFinalAmount;
    uint256 reserveTokenTotalWithoutCommission;
    CommissionReturnStruct commission;
  }

  struct FreeStableTokenRedeemStruct {
    uint256 finalStableTokenAmount;
    uint256 finalReserveTokenAmount;
    uint256 reserveTokenInterestAmount;
    CommissionReturnStruct commission;
  }

  struct RiskProMintStruct {
    uint256 riskProRegularPrice;
    uint256 reserveTokenValue;
    uint256 discountPrice;
    uint256 riskProDiscountAmount;
    uint256 regularRiskProAmount;
    uint256 availableRiskPro;
    uint256 finalRiskProAmount;
    CommissionReturnStruct commission;
  }

  struct StableTokenMintStruct {
    uint256 stableTokens;
    uint256 stableTokenAmount;
    uint256 totalCost;
    CommissionReturnStruct commission;
  }

  struct CommissionParamsStruct {
    address account; // Address of the user doing the transaction
    uint256 amount; // Amount from which commissions are calculated
    uint8 txTypeFeesMOC; // Transaction type if fees are paid in MoC
    uint8 txTypeFeesReserveToken; // Transaction type if fees are paid in ReserveToken
    address vendorAccount; // Vendor address
  }

  struct CommissionReturnStruct {
    uint256 reserveTokenCommission;
    uint256 mocCommission;
    uint256 reserveTokenPrice;
    uint256 mocPrice;
    uint256 reserveTokenMarkup;
    uint256 mocMarkup;
  }

  struct StableTokenRedeemStruct {
    uint256 reserveTotal;
    uint256 reserveTokenToRedeem;
    uint256 totalReserveToken;
    CommissionReturnStruct commission;
  }

  /** END UPDATE V0110: 24/09/2020 **/

  ////////////////////
  // Flux Capacitor //
  ////////////////////

  uint256 internal constant PRECISION = 10**18;
  uint256 internal constant ONE = 10**18;

  /**
   * @notice returns the absolute unsigned value of a signed value
   * @dev from openzeppelin SignedMath.sol
   */
  function _abs(int256 n) internal pure returns (uint256) {
    // must be unchecked in order to support `n = type(int256).min`
    return uint256(n >= 0 ? n : -n);
  }

  /**
   * @notice returns lineal decay factor
   * @param blocksAmount_ amount of blocks to ask for the decay
   * @return newAbsoluteAccumulator absolute accumulator updated by lineal decay factor [N]
   * @return newDifferentialAccumulator differential accumulator updated by lineal decay factor [N]
   */
  function _calcAccWithDecayFactor(uint256 blocksAmount_)
    internal
    view
    returns (uint256 newAbsoluteAccumulator, int256 newDifferentialAccumulator)
  {
    // [N] = [N] - [N]
    uint256 blocksElapsed = block.number + blocksAmount_ - lastOperationBlockNumber; // unchecked
    // [PREC] = [N] * [PREC] / [N]
    uint256 blocksRatio = (blocksElapsed * PRECISION) / decayBlockSpan; // unchecked
    if (blocksRatio >= ONE) return (0, 0);
    uint256 decayFactor = ONE - blocksRatio; // unchecked
    // [N] = [N] * [PREC] / [PREC]
    newAbsoluteAccumulator = (absoluteAccumulator * decayFactor) / PRECISION; // unchecked
    // [N] = [N] * [PREC] / [PREC]
    newDifferentialAccumulator = (differentialAccumulator * int256(decayFactor)) / int256(PRECISION); // unchecked
    return (newAbsoluteAccumulator, newDifferentialAccumulator);
  }

  /**
   * @notice update accumulators during a mint operation
   *  reverts if not allowed
   * @param reserveAmountToOperate_ reserve amount used to mint
   */
  function _updateAccumulatorsOnMint(uint256 reserveAmountToOperate_) internal {
    (uint256 newAbsoluteAccumulator, int256 newDifferentialAccumulator) = _calcAccWithDecayFactor(0);
    newAbsoluteAccumulator += reserveAmountToOperate_; // unchecked
    newDifferentialAccumulator += int256(reserveAmountToOperate_); // unchecked
    // cannot underflow, always newDifferentialAccumulator <= newAbsoluteAccumulator
    uint256 operationalDifference = newAbsoluteAccumulator - _abs(newDifferentialAccumulator);
    require(newAbsoluteAccumulator <= maxAbsoluteOperation, "max absolute operation reached");
    require(operationalDifference <= maxOperationalDifference, "max operational difference reached");
    // update storage
    absoluteAccumulator = newAbsoluteAccumulator;
    differentialAccumulator = newDifferentialAccumulator;
    lastOperationBlockNumber = block.number;
  }

  /**
   * @notice update accumulators during a redeem operation
   *  reverts if not allowed
   * @param reserveAmountToOperate_ reserve amount used for redeem
   */
  function _updateAccumulatorsOnRedeem(uint256 reserveAmountToOperate_) internal {
    (uint256 newAbsoluteAccumulator, int256 newDifferentialAccumulator) = _calcAccWithDecayFactor(0);
    newAbsoluteAccumulator += reserveAmountToOperate_; // unchecked
    newDifferentialAccumulator -= int256(reserveAmountToOperate_); // unchecked
    // cannot underflow, always newDifferentialAccumulator <= newAbsoluteAccumulator
    uint256 operationalDifference = newAbsoluteAccumulator - _abs(newDifferentialAccumulator);
    require(newAbsoluteAccumulator <= maxAbsoluteOperation, "max absolute operation reached");
    require(operationalDifference <= maxOperationalDifference, "max operational difference reached");
    // update storage
    absoluteAccumulator = newAbsoluteAccumulator;
    differentialAccumulator = newDifferentialAccumulator;
    lastOperationBlockNumber = block.number;
  }

  /**
   * @notice internal common function used to calc max reserved allowed to mint or redeem
   *  stable tokens due to accumulators
   * @param newAbsoluteAccumulator_ absolute accumulator updated by lineal decay factor [N]
   * @param a_ on mint = AA - DA ; on redeem = AA + DA
   * @param b_ on mint = AA + DA ; on redeem = AA - DA
   * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
   */
  function _calcMaxReserveAllowedToOperate(uint256 newAbsoluteAccumulator_, uint256 a_, uint256 b_)
    internal
    view
    returns (uint256 maxResAllowed)
  {
    if (newAbsoluteAccumulator_ >= maxAbsoluteOperation) return 0;
    uint256 absoluteAccAllowed = maxAbsoluteOperation - newAbsoluteAccumulator_;

    if (a_ <= maxOperationalDifference) return absoluteAccAllowed;
    if (b_ >= maxOperationalDifference) return 0;
    uint256 differentialAccAllowed = (maxOperationalDifference - b_) / 2;
    return Math.min(absoluteAccAllowed, differentialAccAllowed);
  }

  /**
   * @notice gets the max amount of reserve token allowed to operate to mint stable tokens with, restricted by accumulators
   * @param newAbsoluteAccumulator_ absolute accumulator updated by lineal decay factor [N]
   * @param newDifferentialAccumulator_ differential accumulator updated by lineal decay factor [N]
   * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
   */
  function _maxReserveAllowedToMint(uint256 newAbsoluteAccumulator_, int256 newDifferentialAccumulator_)
    internal
    view
    returns (uint256 maxResAllowed)
  {
    // X = mint amount
    // (AA + X) - |DA + X| <= MODA && X >= 0
    // 1) if DA + X >= 0 ---> AA + X - DA - X <= MODA ---> AA - DA <= MODA
    // 2) if DA + X < 0 ---> X <= (MODA - (AA + DA)) / 2

    // AA >= |DA|
    uint256 a = uint256(int256(newAbsoluteAccumulator_) - newDifferentialAccumulator_);
    uint256 b = uint256(int256(newAbsoluteAccumulator_) + newDifferentialAccumulator_);
    return _calcMaxReserveAllowedToOperate(newAbsoluteAccumulator_, a, b);
  }

  /**
   * @notice gets the max amount of reserve token allowed to operate to mint stable tokens with on the last block, restricted by accumulators
   * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
   */
  function lastMaxReserveAllowedToMint() external view returns (uint256 maxResAllowed) {
    (uint256 newAbsoluteAccumulator, int256 newDifferentialAccumulator) = _calcAccWithDecayFactor(0);
    return _maxReserveAllowedToMint(newAbsoluteAccumulator, newDifferentialAccumulator);
  }

  /**
   * @notice gets the max amount of reserve token allowed to operate to mint stable tokens with, restricted by accumulators
   * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
   */
  function maxReserveAllowedToMint() external view returns (uint256 maxResAllowed) {
    (uint256 newAbsoluteAccumulator, int256 newDifferentialAccumulator) = _calcAccWithDecayFactor(1);
    return _maxReserveAllowedToMint(newAbsoluteAccumulator, newDifferentialAccumulator);
  }

  /**
   * @notice gets the max amount of reserve token allowed to operate to redeem stable tokens with, restricted by accumulators
   * @param newAbsoluteAccumulator_ absolute accumulator updated by lineal decay factor [N]
   * @param newDifferentialAccumulator_ differential accumulator updated by lineal decay factor [N]
   * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
   */
  function _maxReserveAllowedToRedeem(uint256 newAbsoluteAccumulator_, int256 newDifferentialAccumulator_)
    internal
    view
    returns (uint256 maxResAllowed)
  {
    // X = redeem amount
    // (AA + X) - |DA - X| <= MODA && X >= 0
    // 1) if DA - X < 0 ---> AA + X + DA - X <= MODA ---> AA + DA <= MODA
    // 2) if DA - X >= 0 ---> X <= (MODA - (AA - DA)) / 2

    // AA >= |DA|
    uint256 a = uint256(int256(newAbsoluteAccumulator_) + newDifferentialAccumulator_);
    uint256 b = uint256(int256(newAbsoluteAccumulator_) - newDifferentialAccumulator_);
    return _calcMaxReserveAllowedToOperate(newAbsoluteAccumulator_, a, b);
  }

  /**
   * @notice gets the max amount of reserve token allowed to operate to redeem stable tokens with on the last block, restricted by accumulators
   * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
   */
  function lastMaxReserveAllowedToRedeem() external view returns (uint256 maxResAllowed) {
    (uint256 newAbsoluteAccumulator, int256 newDifferentialAccumulator) = _calcAccWithDecayFactor(0);
    return _maxReserveAllowedToRedeem(newAbsoluteAccumulator, newDifferentialAccumulator);
  }

  /**
   * @notice gets the max amount of reserve token allowed to operate to redeem stable tokens with, restricted by accumulators
   * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
   */
  function maxReserveAllowedToRedeem() external view returns (uint256 maxResAllowed) {
    (uint256 newAbsoluteAccumulator, int256 newDifferentialAccumulator) = _calcAccWithDecayFactor(1);
    return _maxReserveAllowedToRedeem(newAbsoluteAccumulator, newDifferentialAccumulator);
  }

  /**
   * @notice update the max absolute operation allowed
   * @dev this contract is not governed, so change is done throught MoC contract
   * @param maxAbsoluteOperation_ new max absolute operation allowed
   */
  function setMaxAbsoluteOperation(uint256 maxAbsoluteOperation_) external onlyWhitelisted(msg.sender) {
    maxAbsoluteOperation = maxAbsoluteOperation_;
  }

  /**
   * @notice update the max operational difference allowed
   * @dev this contract is not governed, so change is done throught MoC contract
   * @param maxOperationalDifference_ new max operational difference allowed
   */
  function setMaxOperationalDifference(uint256 maxOperationalDifference_) external onlyWhitelisted(msg.sender) {
    maxOperationalDifference = maxOperationalDifference_;
  }

  /**
   * @notice update the decay block span
   * @dev this contract is not governed, so change is done throught MoC contract
   * @param decayBlockSpan_ new decay block span
   */
  function setDecayBlockSpan(uint256 decayBlockSpan_) external onlyWhitelisted(msg.sender) {
    decayBlockSpan = decayBlockSpan_;
    // only for flux capacitor initialization
    if (lastOperationBlockNumber == 0) {
      lastOperationBlockNumber = block.number;
    }
  }

  // accumulator increasead by minting and redeeming stable token operations
  uint256 public absoluteAccumulator;
  // accumulator increasead by minting and decreased by redeeming stable token operations
  int256 public differentialAccumulator;
  // last block number where an operation was submitted
  uint256 public lastOperationBlockNumber;
  // absolute maximum transaction allowed for a certain number of blocks
  // if absoluteAccumulator is above this value the operation will be rejected
  uint256 public maxAbsoluteOperation;
  // differential maximum transaction allowed for a certain number of blocks
  // if operationalDifference is above this value the operation will be rejected
  uint256 public maxOperationalDifference;
  // number of blocks that have to elapse for the linear decay factor to be 0
  uint256 public decayBlockSpan;

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[44] private __gap;
}


contract MoCExchange_v0116_2 is MoCExchange {
  using Math for uint256;
  using SafeMath for uint256;

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  
  /**
    @dev Migrates to a new stable token contract
      Mints the new tokens to bridge contract in the same amount of the total supply of the old ones,
      so that they can later be exchanged.
      This contract must have minter and burner roles set on it
    @param newStableTokenAddress_ new stable token contract address
    @param bridgeAddress_ contract that will receive the new tokens and be able to distribute them
  */
  function migrateStableToken(address newStableTokenAddress_, address bridgeAddress_) public {
    uint256 totalSupply = stableToken.totalSupply();
    emit StableTokenMigrated(address(stableToken), newStableTokenAddress_);
    stableToken = StableToken(newStableTokenAddress_);
    stableToken.mint(bridgeAddress_, totalSupply);
  }
}




interface PriceProvider {
  function peek() external view returns (bytes32, bool);
}


/** @title ReserveToken Price Provider. */
contract MoCEMACalculator is Governed {
  using SafeMath for uint256;

  event MovingAverageCalculation (
    uint256 price,
    uint256 movingAverage
  );

  uint256 internal exponentialMovingAverage;
  uint256 public smoothingFactor;
  uint256 public lastEmaCalculation;
  uint256 public emaCalculationBlockSpan;

  uint256 public constant PRICE_PRECISION = 10**18;
  uint256 public constant FACTOR_PRECISION = 10**18;

  function getExponentalMovingAverage() public view returns (uint256) {
    return exponentialMovingAverage;
  }

  function getSmoothingFactor() public view returns (uint256) {
    return smoothingFactor;
  }

  function setSmoothingFactor(uint256 factor) public onlyAuthorizedChanger() {
    _doSetSmoothingFactor(factor);
  }

  function getGovernorAddress() public view returns (address) {
    return address(governor);
  }

  function getEmaCalculationBlockSpan() public view returns (uint256) {
    return emaCalculationBlockSpan;
  }

  /**
   * @param blockSpan Defines how many blocks should pass between EMA calculations
   **/
  function setEmaCalculationBlockSpan(uint256 blockSpan) public onlyAuthorizedChanger() {
    emaCalculationBlockSpan = blockSpan;
  }

  function shouldCalculateEma() public view returns (bool) {
    return block.number >= lastEmaCalculation.add(emaCalculationBlockSpan);
  }

  function getLastEmaCalculation() public view returns (uint256) {
    return lastEmaCalculation;
  }

  /**
    @dev Provides ResToken's Price and Moving average.
    More information of EMA calculation https://en.wikipedia.org/wiki/Exponential_smoothing
    @param initialEma Initial ema value
    @param smoothFactor Weight coefficient for EMA calculation.
    @param emaBlockSpan Block count in a period for EMA calculation
   */
  function initializeMovingAverage(uint256 initialEma, uint256 smoothFactor, uint256 emaBlockSpan) internal {
    _doSetSmoothingFactor(smoothFactor);
    lastEmaCalculation = block.number;
    exponentialMovingAverage = initialEma;
    emaCalculationBlockSpan = emaBlockSpan;
  }

  /**
    @dev Calculates a EMA of the price.
    More information of EMA calculation https://en.wikipedia.org/wiki/Exponential_smoothing
    @param reservePrice Current price.
   */
  function setExponentalMovingAverage(uint256 reservePrice) internal {
    if (shouldCalculateEma()) {
      uint256 weightedPrice = reservePrice.mul(smoothingFactor);
      uint256 currentEma = exponentialMovingAverage.mul(coefficientComp()).add(weightedPrice)
        .div(FACTOR_PRECISION);

      lastEmaCalculation = block.number;
      exponentialMovingAverage = currentEma;

      emit MovingAverageCalculation(reservePrice, currentEma);
    }
  }

  /**
    @dev Calculates the smoothing factor complement
  */
  function coefficientComp() internal view returns (uint256) {
    return FACTOR_PRECISION.sub(smoothingFactor);
  }

  function initializeGovernor(address _governor) internal {
    governor = IGovernor(_governor);
  }

  function _doSetSmoothingFactor(uint256 factor) private {
    require(factor <= FACTOR_PRECISION, "Invalid smoothing factor");
    smoothingFactor = factor;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


contract MoCState is MoCLibConnection, MoCBase, MoCEMACalculator, IMoCState {
  using Math for uint256;
  using SafeMath for uint256;

  struct InitializeParams {
    address connectorAddress;
    address governor;
    address priceProvider;
    uint256 liq;
    uint256 utpdu;
    uint256 maxDiscRate;
    uint256 dayBlockSpan;
    uint256 ema;
    uint256 smoothFactor;
    uint256 emaBlockSpan;
    uint256 maxMintRiskPro;
    address mocPriceProvider;
    address mocTokenAddress;
    address mocVendorsAddress;
    bool liquidationEnabled;
    uint256 protected;
  }

  // This is the current state.
  States public state;

  event StateTransition(States newState);
  event PriceProviderUpdated(address oldAddress, address newAddress);

// Contracts
  PriceProvider internal priceProvider;
  IMoCSettlement internal mocSettlement;
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address internal DEPRECATED_mocConverter;
  IERC20 internal stableToken;
  RiskProToken internal riskProToken;
  MoCRiskProxManager internal riskProxManager;

  // One Day based on 15 seconds blocks
  uint256 public dayBlockSpan;
  // Relation between StableToken and dollar
  uint256 public peg;
  // RiskPro max discount rate
  // Reflects the discount spot rate at Liquidation level
  uint256 public riskProMaxDiscountRate;
  // Liquidation limit
  // [using mocPrecision]
  uint256 public liq;
  // RiskPro with discount limit
  // [using mocPrecision]
  uint256 public utpdu;
  // Complete amount reserves in the system
  uint256 public reserves;
  // Price to use at stableToken redemption at
  // liquidation event
  uint256 public liquidationPrice;
  // Max value posible to mint of RiskPro
  uint256 public maxMintRiskPro;
  // Liquidation enabled
  bool public liquidationEnabled;
  // Protected limit
  // [using mocPrecision]
  uint256 public protected;

  /**
    @dev Initializes the contract
    @param params Params defined in InitializeParams struct
  */
  function initialize(InitializeParams memory params) public initializer {
    initializePrecisions();
    initializeBase(params.connectorAddress);
    initializeContracts(params.mocTokenAddress, params.mocVendorsAddress);
    initializeValues(
      params.governor,
      params.priceProvider,
      params.liq,
      params.utpdu,
      params.maxDiscRate,
      params.dayBlockSpan,
      params.maxMintRiskPro,
      params.mocPriceProvider,
      params.liquidationEnabled,
      params.protected);
    initializeMovingAverage(params.ema, params.smoothFactor, params.emaBlockSpan);
  }

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  // DEPRECATED. 
  // This function was used atomically in upgrade v0115 to migrate stableTokenV1 to stableTokenV2
  // After that, it is removed in this contract version to cannot be called more than once.
  //
  // event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  //
  // /**
  //   @dev Migrates to a new stable token contract
  //   @param newStableTokenAddress_ new stable token contract address
  // */
  // function migrateStableToken(address newStableTokenAddress_) public {
  //   emit StableTokenMigrated(address(stableToken), newStableTokenAddress_);  
  //   stableToken = IERC20(newStableTokenAddress_);
  // }

  /**
   @dev Sets the max discount rate.
   @param rate Discount rate at liquidation level [using mocPrecision]
  */
  function setMaxDiscountRate(uint256 rate) public onlyAuthorizedChanger() {
    require(rate < mocLibConfig.mocPrecision, "rate is lower than mocPrecision");

    riskProMaxDiscountRate = rate;
  }

  /**
   * @dev return the value of the RiskPro max discount rate configuration param
   * @return riskProMaxDiscountRate RiskPro max discount rate
   */
  function getMaxDiscountRate() public view returns(uint256) {
    return riskProMaxDiscountRate;
  }

  /**
    @dev Defines how many blocks there are in a day
    @param blockSpan blocks there are in a day
  */
  function setDayBlockSpan(uint256 blockSpan) public onlyAuthorizedChanger() {
    dayBlockSpan = blockSpan;
  }

  /**
   @dev Sets a new PriceProvider contract
   @param priceProviderAddress address of the price provider contract
  */
  function setPriceProvider(address priceProviderAddress) public onlyAuthorizedChanger() {
    address oldPriceProviderAddress = address(priceProvider);
    priceProvider = PriceProvider(priceProviderAddress);
    emit PriceProviderUpdated(oldPriceProviderAddress, address(priceProvider));
  }

  /**
   @dev Gets the PriceProviderAddress
   @return address of the price provider contract
  */
  function getPriceProvider() public view returns(address) {
    return address(priceProvider);
  }

  /**
   @dev Gets how many blocks there are in a day
   @return blocks there are in a day
  */
  function getDayBlockSpan() public view returns(uint256) {
    return dayBlockSpan;
  }

  /**
   @dev Subtract the reserve amount passed by parameter to the reserves total
   @param amount Amount that will be subtract to reserves
  */
  function substractFromReserves(uint256 amount) public onlyWhitelisted(msg.sender) {
    reserves = reserves.sub(amount);
  }

  /**
   @dev Add the reserve amount passed by parameter to the reserves total
   @param amount Amount that will be added to reserves
  */
  function addToReserves(uint256 amount) public onlyWhitelisted(msg.sender) {
    reserves = reserves.add(amount);
  }

  /**
    @dev All RiskPros in circulation
   */
  function riskProTotalSupply() public view returns (uint256) {
    return riskProToken.totalSupply();
  }

  /**
    @dev All stableTokens in circulation
   */
  function stableTokenTotalSupply() public view returns (uint256) {
    return stableToken.totalSupply();
  }

  /**
    @dev Target coverage for complete system
  */
  function cobj() public view returns (uint256) {
    return riskProxManager.getBucketCobj(BUCKET_C0);
  }

  /**
   @dev Amount of ReserveTokens in the system excluding
   RiskProx values and interests holdings
  */
  function collateralReserves() public view returns (uint256) {
    uint256 resTokensInRiskProx = riskProxToResTokenHelper(riskProxManager.getBucketNRiskPro(BUCKET_X2), BUCKET_X2);
    uint256 resTokensInBag = riskProxManager.getInrateBag(BUCKET_C0);

    return reserves.sub(resTokensInRiskProx).sub(resTokensInBag);
  }

  /**
   @dev GLOBAL Coverage
   @return coverage [using mocPrecision].
  */
  function globalCoverage() public view returns (uint256) {
    uint256 lB = globalLockedReserveTokens();

    return mocLibConfig.coverage(collateralReserves(), lB);
  }

  /**
   @dev BUCKET lockedReserveTokens
   @param bucket Name of the bucket used
   @return lockedReserveTokens amount [using reservePrecision].
  */
  function lockedReserveTokens(bytes32 bucket) public view returns (uint256) {
    uint256 nStableToken = riskProxManager.getBucketNStableToken(bucket);

    return mocLibConfig.lockedReserveTokens(getReserveTokenPrice(), nStableToken, peg);
  }

  /**
   @dev Gets ReserveTokens in RiskPro within specified bucket
   @param bucket Name of the bucket used
   @return ReserveToken amount of RiskPro in Bucket [using reservePrecision].
  */
  function getResTokensInRiskPro(bytes32 bucket) public view returns (uint256) {
    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);
    uint256 lB = lockedReserveTokens(bucket);

    if (lB >= nReserve) {
      return 0;
    }

    return nReserve.sub(lB);
  }

  /**
   @dev Gets the ReserveTokens in the contract that not corresponds to StableToken collateral
   @return ReserveTokens remainder [using reservePrecision].
  */
  function getReservesRemainder() public view returns (uint256) {
    uint256 lB = globalLockedReserveTokens();

    if (lB >= reserves) {
      return 0;
    }

    return reserves.sub(lB);
  }

  /**
   @dev BUCKET Coverage
   @param bucket Name of the bucket used
   @return coverage [using mocPrecision]
  */
  function coverage(bytes32 bucket) public view returns (uint256) {
    if (!riskProxManager.isBucketBase(bucket) && riskProxManager.isBucketEmpty(bucket)) {
      return riskProxManager.getBucketCobj(bucket);
    }

    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);
    uint256 lB = lockedReserveTokens(bucket);

    return mocLibConfig.coverage(nReserve, lB);
  }

  /**
   @dev Abundance ratio, receives tha amount of stableToken to use the value of stableToken0 and StableToken total supply
   @return abundance ratio [using mocPrecision]
  */
  function abundanceRatio(uint256 stableToken0) public view returns (uint256) {
    return mocLibConfig.abundanceRatio(stableToken0, stableTokenTotalSupply());
  }

  /**
   @dev Relation between stableTokens in bucket 0 and StableToken total supply
   @return abundance ratio [using mocPrecision]
  */
  function currentAbundanceRatio() public view returns (uint256) {
    return abundanceRatio(getBucketNStableToken(BUCKET_C0));
  }

  /**
   @dev BUCKET Leverage
   @param bucket Name of the bucket used
   @return leverage [using mocPrecision]
  */
  function leverage(bytes32 bucket) public view returns (uint256) {
    uint256 cov = coverage(bucket);

    return mocLibConfig.leverageFromCoverage(cov);
  }

  /**
   @dev GLOBAL maxStableToken
   @return maxStableToken to issue [using mocPrecision]
  */
  function globalMaxStableToken() public view returns (uint256) {
    return mocLibConfig.maxStableToken(collateralReserves(), cobj(), stableTokenTotalSupply(), peg, getReserveTokenPrice(), getBcons());
  }

  /**
   @dev Returns the amount of stableTokens in bucket 0, that can be redeemed outside of settlement
   @return amount of stableTokens in bucket 0, that can be redeemed outside of settlement [using mocPrecision]
  */
  function freeStableToken() public view returns (uint256) {
    return riskProxManager.getBucketNStableToken(BUCKET_C0);
  }

  /**
   @dev BUCKET maxStableToken
   @return maxStableToken to issue [using mocPrecision]
  */
  function maxStableToken(bytes32 bucket) public view returns (uint256) {
    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);
    uint256 nStableToken = riskProxManager.getBucketNStableToken(bucket);
    uint256 bktCobj = riskProxManager.getBucketCobj(bucket);

    return mocLibConfig.maxStableToken(nReserve, bktCobj, nStableToken, peg, getReserveTokenPrice(), getBcons());
  }

  /**
   @dev GLOBAL maxRiskPro
   @return maxRiskPro for redeem [using mocPrecision].
  */
  function globalMaxRiskPro() public view returns (uint256) {
    uint256 riskProPrice = riskProUsdPrice();

    return mocLibConfig.maxRiskPro(
        collateralReserves(), cobj(), stableTokenTotalSupply(), peg, getReserveTokenPrice(), getBcons(), riskProPrice
    );
  }

  /**
   @dev ABSOLUTE maxStableToken
   @return maxStableToken to issue [using mocPrecision]
  */
  function absoluteMaxStableToken() public view returns (uint256) {
    return Math.min(globalMaxStableToken(), maxStableToken(BUCKET_C0));
  }

  /**
    @dev BUCKET maxRiskPro to redeem / mint
    @param bucket Name of the bucket used
    @return maxRiskPro for redeem [using mocPrecision].
  */
  function maxRiskPro(bytes32 bucket) public view returns (uint256) {
    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);
    uint256 nStableToken = riskProxManager.getBucketNStableToken(bucket);
    uint256 riskProPrice = riskProUsdPrice();
    uint256 bktCobj = riskProxManager.getBucketCobj(bucket);

    return mocLibConfig.maxRiskPro(
      nReserve, bktCobj, nStableToken, peg, getReserveTokenPrice(), getBcons(), riskProPrice
    );
  }

  /**
   @dev GLOBAL max riskProx to mint
   @param bucket Name of the bucket used
   @return maxRiskProx [using mocPrecision]
  */
  function maxRiskProx(bytes32 bucket) public view returns (uint256) {
    uint256 maxResTokens = maxRiskProxResTokenValue(bucket);

    return mocLibConfig.maxRiskProWithResTokens(maxResTokens, bucketRiskProTecPrice(bucket));
  }

  /**
   @dev GLOBAL max riskProx to mint
   @param bucket Name of the bucket used
   @return maxRiskProx ReserveTokens value to mint [using reservePrecision]
  */
  function maxRiskProxResTokenValue(bytes32 bucket) public view returns (uint256) {
    uint256 nStableToken0 = riskProxManager.getBucketNStableToken(BUCKET_C0);
    uint256 bucketLev = leverage(bucket);

    return mocLibConfig.maxRiskProxResTokenValue(nStableToken0, peg, getReserveTokenPrice(), bucketLev);
  }

  /**
   @dev ABSOLUTE maxRiskPro
   @return maxStableToken to issue [using mocPrecision].
  */
  function absoluteMaxRiskPro() public view returns (uint256) {
    return Math.min(globalMaxRiskPro(), maxRiskPro(BUCKET_C0));
  }

  /**
   @dev DISCOUNT maxRiskPro
   @return maxRiskPro for mint with discount [using mocPrecision]
  */
  function maxRiskProWithDiscount() public view returns (uint256) {
    uint256 nStableToken = stableTokenTotalSupply();
    uint256 riskProSpotDiscount = riskProSpotDiscountRate();
    uint256 riskProPrice = riskProUsdPrice();
    uint256 reservePrice = getReserveTokenPrice();

    return mocLibConfig.maxRiskProWithDiscount(collateralReserves(), nStableToken, utpdu, peg, reservePrice, riskProPrice,
      riskProSpotDiscount);
  }

  /**
   @dev GLOBAL lockedReserveTokens
   @return lockedReserveTokens amount [using reservePrecision].
  */
  function globalLockedReserveTokens() public view returns (uint256) {
    return mocLibConfig.lockedReserveTokens(getReserveTokenPrice(), stableTokenTotalSupply(), peg);
  }

  /**
   @dev ReserveTokens price of RiskPro
   @return the RiskPro Tec Price [using reservePrecision].
  */
  function riskProTecPrice() public view returns (uint256) {
    return bucketRiskProTecPrice(BUCKET_C0);
  }

  /**
   @dev BUCKET ReserveTokens price of RiskPro
   @param bucket Name of the bucket used
   @return the RiskPro Tec Price [using reservePrecision]
  */
  function bucketRiskProTecPrice(bytes32 bucket) public view returns(uint256) {
    uint256 cov = globalCoverage();
    uint256 coverageThreshold = uint256(1).mul(mocLibConfig.mocPrecision);

    // If Protected Mode is reached and below threshold
    if (bucket == BUCKET_C0 && cov <= getProtected() && cov < coverageThreshold) {
      return 1; // wei
    }

    return bucketRiskProTecPriceHelper(bucket);
  }

/**
   @dev BUCKET ReserveTokens price of RiskPro (helper)
   @param bucket Name of the bucket used
   @return the RiskPro Tec Price [using reservePrecision]
  */
  function bucketRiskProTecPriceHelper(bytes32 bucket) public view returns (uint256) {
    uint256 nRiskPro = riskProxManager.getBucketNRiskPro(bucket);
    uint256 lb = lockedReserveTokens(bucket);
    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);

    return mocLibConfig.riskProTecPrice(nReserve, lb, nRiskPro);
  }

  /**
   @dev ReserveTokens price of RiskPro with spot discount applied
   @return the RiskPro Tec Price [using reservePrecision].
  */
  function riskProDiscountPrice() public view returns (uint256) {
    uint256 riskProTecprice = riskProTecPrice();
    uint256 discountRate = riskProSpotDiscountRate();

    return mocLibConfig.applyDiscountRate(riskProTecprice, discountRate);
  }

  /**
   @dev RiskPro USD PRICE
   @return the RiskPro USD Price [using mocPrecision]
  */
  function riskProUsdPrice() public view returns (uint256) {
    uint256 riskProResTokenPrice = riskProTecPrice();
    uint256 reservePrice = getReserveTokenPrice();

    return reservePrice.mul(riskProResTokenPrice).div(mocLibConfig.reservePrecision);
  }

  /**
   @dev GLOBAL max riskProx to mint
   @param bucket Name of the bucket used
   @return max RiskPro allowed to be spent to mint RiskProx [using reservePrecision]
  */
  function maxRiskProxRiskProValue(bytes32 bucket) public view returns (uint256) {
    uint256 resTokensValue = maxRiskProxResTokenValue(bucket);

    return mocLibConfig.maxRiskProWithResTokens(resTokensValue, riskProTecPrice());
  }

  /**
   @dev BUCKET RiskProx price in RiskPro
   @param bucket Name of the bucket used
   @return RiskPro RiskPro Price [[using mocPrecision]Precision].
  */
  function riskProxRiskProPrice(bytes32 bucket) public view returns (uint256) {
    // Otherwise, it reverts.
    if (state == States.Liquidated) {
      return 0;
    }

    uint256 riskProxResTokenPrice = bucketRiskProTecPrice(bucket);
    uint256 riskProResTokenPrice = riskProTecPrice();

    return mocLibConfig.riskProxRiskProPrice(riskProxResTokenPrice, riskProResTokenPrice);
  }

  /**
   @dev GLOBAL ReserveTokens Discount rate to apply to RiskProPrice.
   @return RiskPro discount rate [using DISCOUNT_PRECISION].
  */
  function riskProSpotDiscountRate() public view returns (uint256) {
    uint256 cov = globalCoverage();

    return mocLibConfig.riskProSpotDiscountRate(riskProMaxDiscountRate, liq, utpdu, cov);
  }

  /**
    @dev Calculates the number of days to next settlement based dayBlockSpan
    @return days to next settlement
  */
  function daysToSettlement() public view returns (uint256) {
    return blocksToSettlement().mul(mocLibConfig.dayPrecision).div(dayBlockSpan);
  }

  /**
    @dev Number of blocks to settlement
    @return Number of blocks to settlement
  */
  function blocksToSettlement() public view returns (uint256) {
    if (mocSettlement.nextSettlementBlock() <= block.number) {
      return 0;
    }

    return mocSettlement.nextSettlementBlock().sub(block.number);
  }

  /**
    @dev Verifies if forced liquidation is reached checking if globalCoverage <= liquidation (currently 1.04)
     and if liquidation is enabled
    @return true if liquidation state is reached, false otherwise
   */
  function isLiquidationReached() public view returns(bool) {
    uint256 cov = globalCoverage();
    if (state != States.Liquidated && cov <= liq && liquidationEnabled)
      return true;
    return false;
  }

  /**
    @dev Returns the price to use for stableToken redeem in a liquidation event
    @return price to use for stableToken redeem in a liquidation event
  */
  function getLiquidationPrice() public view returns (uint256) {
    return liquidationPrice;
  }

  function getBucketNReserve(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getBucketNReserve(bucket);
  }

  function getBucketNRiskPro(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getBucketNRiskPro(bucket);
  }

  function getBucketNStableToken(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getBucketNStableToken(bucket);
  }

  function getBucketCobj(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getBucketCobj(bucket);
  }

  function getInrateBag(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getInrateBag(bucket);
  }

  /**********************
    ReserveTokens PRICE PROVIDER
   *********************/

  function getBcons() public view returns (uint256) {
    return Math.min(getReserveTokenPrice(), getExponentalMovingAverage());
  }

  function getReserveTokenPrice() public view returns (uint256) {
    (bytes32 price, bool has) = priceProvider.peek();
    require(has, "Oracle have no Price");

    return uint256(price);
  }


  function calculateReserveTokenMovingAverage() public {
    setExponentalMovingAverage(getReserveTokenPrice());
  }



  /**
   @dev return the value of the liq threshold configuration param
   @return liq threshold, currently 1.04
  */
  function getLiq() public view returns(uint256) {
    return liq;
  }

  /**
   @dev sets the value of the liq threshold configuration param
   @param _liq liquidation threshold
  */
  function setLiq(uint256 _liq) public onlyAuthorizedChanger(){
    liq = _liq;
  }

  /**
    @dev return the value of the utpdu threshold configuration param
    @return utpdu Universal TPro discount sales coverage threshold
  */
  function getUtpdu() public view returns(uint256) {
    return utpdu;
  }

  /**
   @dev sets the value of the utpdu threshold configuration param
   @param _utpdu Universal TPro discount sales coverage threshold
  */
  function setUtpdu(uint256 _utpdu) public onlyAuthorizedChanger(){
    utpdu = _utpdu;
  }

  /**
   @dev returns the relation between StableToken and dollar. By default it is 1.
   @return peg relation between StableToken and dollar
  */
  function getPeg() public view returns(uint256) {
    return peg;
  }

  /**
   @dev sets the relation between StableToken and dollar. By default it is 1.
   @param _peg relation between StableToken and dollar
  */
  function setPeg(uint256 _peg) public onlyAuthorizedChanger() {
    peg = _peg;
  }

  /**
   @dev return the value of the protected threshold configuration param
   @return protected threshold, currently 1.5
  */
  function getProtected() public view returns(uint256) {
    return protected;
  }

  /**
   @dev sets the value of the protected threshold configuration param
   @param _protected protected threshold
  */
  function setProtected(uint _protected) public onlyAuthorizedChanger() {
    protected = _protected;
  }

  /**
   @dev returns if is liquidation enabled.
   @return liquidationEnabled is liquidation enabled
  */
  function getLiquidationEnabled() public view returns(bool) {
    return liquidationEnabled;
  }

  /**
   @dev returns if is liquidation enabled.
   @param _liquidationEnabled is liquidation enabled
  */
  function setLiquidationEnabled(bool _liquidationEnabled) public onlyAuthorizedChanger() {
    liquidationEnabled = _liquidationEnabled;
  }

  /**
   @dev Transitions to next state.
  */
  function nextState() public {
    // There is no coming back from Liquidation
    if (state == States.Liquidated)
      return;

    States prevState = state;
    calculateReserveTokenMovingAverage();
    uint256 cov = globalCoverage();
    if (cov <= liq && liquidationEnabled) {
      setLiquidationPrice();
      state = States.Liquidated;
    } else if (cov > liq && cov <= utpdu) {
      state = States.RiskProDiscount;
    } else if (cov > utpdu && cov <= cobj()) {
      state = States.BelowCobj;
    } else {
      state = States.AboveCobj;
    }

    if (prevState != state)
      emit StateTransition(state);
  }

  /**
   @dev Sets max mint RiskPro value
   @param _maxMintRiskPro [using mocPrecision]
  */
  function setMaxMintRiskPro(uint256 _maxMintRiskPro) public onlyAuthorizedChanger() {
    maxMintRiskPro = _maxMintRiskPro;
  }

  /**
   @dev return Max value posible to mint of RiskPro
   @return maxMintRiskPro
  */
  function getMaxMintRiskPro() public view returns(uint256) {
    return maxMintRiskPro;
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** and rename price interfaces **/
  /** Public functions **/

  /**********************
    MoC PRICE PROVIDER
   *********************/

  /**
   @dev Sets a new MoCProvider contract
   @param mocProviderAddress MoC price provider address
  */
  function setMoCPriceProvider(address mocProviderAddress) public onlyAuthorizedChanger() {
    address oldMoCPriceProviderAddress = address(mocPriceProvider);
    mocPriceProvider = PriceProvider(mocProviderAddress);
    emit MoCPriceProviderUpdated(oldMoCPriceProviderAddress, address(mocPriceProvider));
  }

  /**
   @dev Gets the MoCPriceProviderAddress
   @return MoC price provider address
  */
  function getMoCPriceProvider() public view returns(address) {
    return address(mocPriceProvider);
  }

  /**
   @dev Gets the MoCPrice
   @return MoC price
  */
  function getMoCPrice() public view returns(uint256) {
    (bytes32 price, bool has) = mocPriceProvider.peek();
    require(has, "Oracle have no MoC Price");

    return uint256(price);
  }

  /**********************
    MoC TOKEN
   *********************/

  /**
   @dev Sets the MoC token contract address
   @param mocTokenAddress MoC token contract address
  */
  // TODO: Suggestion: create a "MoCConnectorChanger" contract and whitelist the address
  function setMoCToken(address mocTokenAddress) public onlyAuthorizedChanger() {
    setMoCTokenInternal(mocTokenAddress);
  }

  /**
   @dev Gets the MoC token contract address
   @return MoC token contract address
  */
  function getMoCToken() public view returns(address) {
    return address(mocToken);
  }

  /**********************
    MoC VENDORS
   *********************/

  // TODO: Suggestion: create a "MoCConnectorChanger" contract and whitelist the address
  /**
   @dev Sets the MoCVendors contract address
   @param mocVendorsAddress MoCVendors contract address
  */
  function setMoCVendors(address mocVendorsAddress) public onlyAuthorizedChanger() {
    setMoCVendorsInternal(mocVendorsAddress);
  }

  /**
   @dev Gets the MoCVendors contract addfress
   @return MoCVendors contract address
  */
  function getMoCVendors() public view returns(address) {
    return mocVendors;
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** and rename price interfaces **/
  /** Internal functions **/

  /**********************
    Ex MoCConverter
   *********************/
  function stableTokensToResToken(uint256 stableTokenAmount) public view returns (uint256) {
    return mocLibConfig.stableTokensResTokensValue(stableTokenAmount, peg, getReserveTokenPrice());
  }

  function resTokenToStableToken(uint256 resTokensAmount) public view returns (uint256) {
    return mocLibConfig.maxStableTokensWithResTokens(resTokensAmount, getReserveTokenPrice());
  }
  function riskProxToResToken(uint256 riskProxAmount, bytes32 bucket) public view returns (uint256) {
    return mocLibConfig.riskProResTokensValuet(riskProxAmount, bucketRiskProTecPrice(bucket));
  }

  function riskProxToResTokenHelper(uint256 riskProxAmount, bytes32 bucket) public view returns(uint256) {
    return mocLibConfig.riskProResTokensValuet(riskProxAmount, bucketRiskProTecPriceHelper(bucket));
  }

  function resTokenToRiskProx(uint256 resTokensAmount, bytes32 bucket) public view returns (uint256) {
    return mocLibConfig.maxRiskProWithResTokens(resTokensAmount, bucketRiskProTecPrice(bucket));
  }


  /**********************
    MoC TOKEN
   *********************/

  /**
   @dev Sets the MoC token contract address (internal function)
   @param mocTokenAddress MoC token contract address
  */
  function setMoCTokenInternal(address mocTokenAddress) internal {
    mocToken = MoCToken(mocTokenAddress);

    emit MoCTokenChanged(mocTokenAddress);
  }

  /**********************
    MoC VENDORS
   *********************/

  /**
   @dev Sets the MoCVendors contract address (internal function)
   @param mocVendorsAddress MoCVendors contract address
  */
  function setMoCVendorsInternal(address mocVendorsAddress) internal {
    mocVendors = mocVendorsAddress;

    emit MoCVendorsChanged(mocVendorsAddress);
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
    @dev Calculates price at liquidation event as the relation between
    the stableToken total supply and the amount of ReserveTokens available to distribute
  */
  function setLiquidationPrice() internal {
    // When coverage is below 1, the amount to
    // distribute is all the ReserveTokens in the contract
    uint256 resTokenscAvailable = Math.min(globalLockedReserveTokens(), reserves);

    liquidationPrice = mocLibConfig.liquidationPrice(resTokenscAvailable, stableTokenTotalSupply());
  }

  function initializeValues(
    address _governor,
    address _priceProvider,
    uint256 _liq,
    uint256 _utpdu,
    uint256 _maxDiscRate,
    uint256 _dayBlockSpan,
    uint256 _maxMintRiskPro,
    address _mocPriceProvider,
    bool _liquidationEnabled,
    uint256 _protected
  ) internal {
    liq = _liq;
    utpdu = _utpdu;
    riskProMaxDiscountRate = _maxDiscRate;
    dayBlockSpan = _dayBlockSpan;
    governor = IGovernor(_governor);
    priceProvider = PriceProvider(_priceProvider);
    // Default values
    state = States.AboveCobj;
    peg = 1;
    maxMintRiskPro = _maxMintRiskPro;
    mocPriceProvider = PriceProvider(_mocPriceProvider);
    liquidationEnabled = _liquidationEnabled;
    protected = _protected;
  }

  function initializeContracts(address _mocTokenAddress, address _mocVendorsAddress) internal {
    mocSettlement = IMoCSettlement(connector.mocSettlement());
    stableToken = IERC20(connector.stableToken());
    riskProToken = RiskProToken(connector.riskProToken());
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    setMoCTokenInternal(_mocTokenAddress);
    setMoCVendorsInternal(_mocVendorsAddress);
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** and rename price interfaces **/
  /** Variables and events **/

  PriceProvider internal mocPriceProvider;
  MoCToken internal mocToken;
  address internal mocVendors;

  event MoCPriceProviderUpdated(
    address oldAddress,
    address newAddress
  );

  event MoCTokenChanged (
    address mocTokenAddress
  );

  event MoCVendorsChanged (
    address mocVendorsAddress
  );

  /** END UPDATE V0110: 24/09/2020 **/

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


contract MoCState_v0116_2 is MoCState {

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);

  /**
    @dev Migrates to a new stable token contract
    @param newStableTokenAddress_ new stable token contract address
  */
  function migrateStableToken(address newStableTokenAddress_) public {
    emit StableTokenMigrated(address(stableToken), newStableTokenAddress_);
    stableToken = IERC20(newStableTokenAddress_);
  }
}






contract PartialExecutionData {
  enum ExecutionState {Ready, Running, Finished}

  struct TaskGroup {
    bytes32 id;
    ExecutionState state;
    bytes32[] subTasks;
    function() internal onStart;
    function() internal onFinish;
    bool autoRestart;
  }

  struct Task {
    bytes32 id;
    function() internal returns (uint256) getStepCount;
    function(uint256) internal stepFunction;
    function() internal onStart;
    function() internal onFinish;
    uint256 currentStep;
    uint256 stepCount;
    ExecutionState state;
  }
}


/**
  @dev Brings basic data structures and functions for partial execution.
  The main data structures are:
    Task: Represents a function that needs to be executed by steps.
    TaskGroup: Represents a function that contains several functions that needs to be executed by steps.
  Tasks and Tasks groups can be executed specifying the amount of steps to run.
*/
contract PartialExecution is PartialExecutionData {
  using SafeMath for uint256;
  using Math for uint256;
  mapping(bytes32 => Task) internal tasks;
  mapping(bytes32 => TaskGroup) internal taskGroups;

  /**
   @dev Auxiliar function for tasks with no onFinish function
 */
  function noFunction() internal {}


  /**
   @dev Reset pointers a task group
   @param _groupId Id of the task group
   @param _subtasks Tasks to execute when executing the task group
   @param _onFinish Function to execute when all tasks of the group are completed
 */
  function resetTaskGroupPointers(
    bytes32 _groupId,
    bytes32[] memory _subtasks,
    function() _onStart,
    function() _onFinish,
    bool _autoRestart
  ) internal {
    taskGroups[_groupId].id = _groupId;
    taskGroups[_groupId].subTasks = _subtasks;
    taskGroups[_groupId].onStart = _onStart;
    taskGroups[_groupId].onFinish = _onFinish;
    taskGroups[_groupId].autoRestart = _autoRestart;

  }

  /**
   @dev Creates a task
   @param taskId Id of the task
   @param _getStepCount Function executed before starting the task
   Should return the step count of the execution
   @param _stepFunction Function to execute at each step
   @param _onStart Function to execute before task execution
   @param _onFinish Function to execute when all steps are completed
 */
  function resetTaskPointers(
    bytes32 taskId,
    function() internal returns (uint256) _getStepCount,
    function(uint256) internal _stepFunction,
    function() internal _onStart,
    function() internal _onFinish
  ) internal {
    tasks[taskId].id = taskId;
    tasks[taskId].getStepCount = _getStepCount;
    tasks[taskId].stepFunction = _stepFunction;
    tasks[taskId].onStart = _onStart;
    tasks[taskId].onFinish = _onFinish;
  }



  /**
   @dev Creates a task group
   @param _groupId Id of the task group
   @param _subtasks Tasks to execute when executing the task group
   @param _onFinish Function to execute when all tasks of the group are completed
 */
  function createTaskGroup(
    bytes32 _groupId,
    bytes32[] memory _subtasks,
    function() _onStart,
    function() _onFinish,
    bool _autoRestart
  ) internal {
    taskGroups[_groupId].id = _groupId;
    taskGroups[_groupId].subTasks = _subtasks;
    taskGroups[_groupId].onStart = _onStart;
    taskGroups[_groupId].onFinish = _onFinish;
    taskGroups[_groupId].state = ExecutionState.Ready;
    taskGroups[_groupId].autoRestart = _autoRestart;
  }

  /**
   @dev Creates a task
   @param taskId Id of the task
   @param _getStepCount Function executed before starting the task
   Should return the step count of the execution
   @param _stepFunction Function to execute at each step
   @param _onStart Function to execute before task execution
   @param _onFinish Function to execute when all steps are completed
 */
  function createTask(
    bytes32 taskId,
    function() internal returns (uint256) _getStepCount,
    function(uint256) internal _stepFunction,
    function() internal _onStart,
    function() internal _onFinish
  ) internal {
    tasks[taskId].id = taskId;
    tasks[taskId].getStepCount = _getStepCount;
    tasks[taskId].stepFunction = _stepFunction;
    tasks[taskId].onStart = _onStart;
    tasks[taskId].onFinish = _onFinish;
    tasks[taskId].state = ExecutionState.Ready;
  }

  /**
   @dev Executes all tasks of the group in order using the step count passed as parameter
   @param groupId Id of the task group
   @param stepCount Step count to execute
 */
  function executeGroup(bytes32 groupId, uint256 stepCount) internal {
    TaskGroup storage group = taskGroups[groupId];

    if (group.state == ExecutionState.Ready) {
      group.onStart();
      group.state = ExecutionState.Running;
    }

    uint256 leftSteps = stepCount;

    for (uint256 i = 0; i < group.subTasks.length && leftSteps > 0; i++) {
      uint256 consumed = executeTask(group.subTasks[i], leftSteps);
      leftSteps = leftSteps.sub(consumed);
    }

    if (groupFinished(groupId)) {
      group.state = ExecutionState.Finished;
      group.onFinish();
      if (group.autoRestart) {
        resetGroup(groupId);
      }
    }
  }

  /**
   @dev Executes a task
   @param taskId Id of the task
   @param steps Step count to execute
   @return The amount of steps consumed in the execution
 */
  function executeTask(bytes32 taskId, uint256 steps)
  internal
  returns (uint256)
  {
    Task storage task = tasks[taskId];
    uint256 initialStep = task.currentStep;

    if (task.state == ExecutionState.Finished) {
      // No execution
      return 0;
    }
    if (task.state == ExecutionState.Ready) {
      task.stepCount = task.getStepCount();
      task.onStart();
      task.state = ExecutionState.Running;
    }
    if (task.state == ExecutionState.Running) {
      uint256 endStep = Math.min(
        task.currentStep.add(steps),
        task.stepCount
      );

      for (
        task.currentStep;
        task.currentStep < endStep;
        task.currentStep++
      ) {
        task.stepFunction(task.currentStep);
      }

      if (task.currentStep == task.stepCount) {
        task.state = ExecutionState.Finished;
        task.onFinish();
      }
    }

    return task.currentStep.sub(initialStep);
  }

  /**
   @dev Put task in Ready to run state and reset currentStep value
   @param taskId Id of the task
 */
  function resetTask(bytes32 taskId) internal {
    tasks[taskId].state = ExecutionState.Ready;
    tasks[taskId].currentStep = 0;
  }

  /**
  @dev Reset all tasks in a group. Used at the completion of a task group execution
  @param groupId Id of the task group
*/
  function resetTasks(bytes32 groupId) internal {
    TaskGroup storage group = taskGroups[groupId];

    for (uint256 i = 0; i < group.subTasks.length; i++) {
      resetTask(group.subTasks[i]);
    }
  }

  /**
  @dev Set if a Group should be automatically set to Ready state
  after Finnished State is reached
  @param groupId Id of the task group
*/
  function setAutoRestart(bytes32 groupId, bool _autoRestart) internal {
    taskGroups[groupId].autoRestart = _autoRestart;
  }

  /**
  @dev Set Group in Ready state. Reset all sub-task.
  @param groupId Id of the task group
*/
  function resetGroup(bytes32 groupId) internal {
    TaskGroup storage group = taskGroups[groupId];
    group.state = ExecutionState.Ready;

    resetTasks(groupId);
  }

  /**
   @dev Returns true if the last task of the group was completed
   @param groupId Id of the task group
   @return boolean
 */
  function groupFinished(bytes32 groupId) internal view returns (bool) {
    TaskGroup storage group = taskGroups[groupId];
    bytes32 taskId = group.subTasks[group.subTasks.length.sub(1)];
    Task storage lastTask = tasks[taskId];

    return lastTask.state == ExecutionState.Finished;
  }

  /**
   @dev Returns true if the group is currently un Running state
   @param groupId Id of the task group
   @return boolean
 */
  function isGroupRunning(bytes32 groupId) internal view returns (bool) {
    return taskGroups[groupId].state == ExecutionState.Running;
  }

  /**
   @dev Returns true if the group is currently in Ready state
   @param groupId Id of the task group
   @return boolean
 */
  function isGroupReady(bytes32 groupId) internal view returns (bool) {
    return taskGroups[groupId].state == ExecutionState.Ready;
  }

  /**
   @dev Returns true if the task is currently un Running state
   @param taskId Id of the task
   @return boolean
 */
  function isTaskRunning(bytes32 taskId) internal view returns (bool) {
    return tasks[taskId].state == ExecutionState.Running;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


contract MoCSettlementEvents {
  event RedeemRequestAlter(address indexed redeemer, bool isAddition, uint256 delta);
  event RedeemRequestProcessed(address indexed redeemer, uint256 commission, uint256 amount);
  event SettlementRedeemStableToken(uint256 queueSize, uint256 accumCommissions, uint256 reservePrice);
  event SettlementDeleveraging(uint256 leverage, uint256 riskProxPrice, uint256 reservePrice, uint256 startBlockNumber);
  event SettlementStarted(
    uint256 stableTokenRedeemCount,
    uint256 deleveragingCount,
    uint256 riskProxPrice,
    uint256 reservePrice
  );
  event SettlementCompleted(uint256 commissionsPayed);
}

contract MoCSettlement is
MoCSettlementEvents,
MoCBase,
PartialExecution,
Governed,
IMoCSettlement
{
  using Math for uint256;
  using SafeMath for uint256;

  bytes32 public constant StableToken_REDEMPTION_TASK = keccak256("StableTokenRedemption");
  bytes32 public constant DELEVERAGING_TASK = keccak256("Deleveraging");
  bytes32 public constant SETTLEMENT_TASK = keccak256("Settlement");

  struct RedeemRequest {
    address payable who;
    uint256 amount;
  }

  struct UserRedeemRequest {
    uint256 index;
    bool activeRedeemer;
  }

  // All necessary data for Settlement execution
  struct SettlementInfo {
    uint256 reservePrice;
    uint256 riskProxPrice;
    uint256 stableTokenRedeemCount;
    uint256 deleveragingCount;
    uint256 riskProxAmount;
    uint256 partialCommissionAmount;
    uint256 finalCommissionAmount;
    uint256 leverage;
    uint256 startBlockNumber;
    bool isProtectedMode;
  }

  // Contracts
  IMoCState internal mocState;
  IMoCExchange internal mocExchange;
  StableToken internal stableToken;
  MoCRiskProxManager internal riskProxManager;

  /**
  @dev Block Number of the last successful execution
  */
  uint256 internal lastProcessedBlock;
  /**
  @dev Min number of blocks settlement should be re evaluated on
  */
  uint256 internal blockSpan;
  /**
  @dev Information for Settlement execution
  */
  SettlementInfo internal settlementInfo;
  /**
  @dev Redeem queue
  */
  RedeemRequest[] private redeemQueue;
  mapping(address => UserRedeemRequest) private redeemMapping;
  uint256 private redeemQueueLength;

  /**
    @dev Initializes the contract
    @param connectorAddress MoCConnector contract address
    @param _governor Governor contract address
    @param _blockSpan Blockspan configuration blockspan of settlement
  */
  function initialize(
    address connectorAddress,
    address _governor,
    uint256 _blockSpan
  ) public initializer {
    initializeBase(connectorAddress);
    initializeContracts();
    initializeValues(_governor, _blockSpan);
  }

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  // DEPRECATED. 
  // This function was used atomically in upgrade v0115 to migrate stableTokenV1 to stableTokenV2
  // After that, it is removed in this contract version to cannot be called more than once.
  //
  // event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  //
  // /**
  //   @dev Migrates to a new stable token contract
  //   @param newStableTokenAddress_ new stable token contract address
  // */
  // function migrateStableToken(address newStableTokenAddress_) public {
  //   emit StableTokenMigrated(address(stableToken), newStableTokenAddress_);  
  //   stableToken = StableToken(newStableTokenAddress_);
  // }

  /**
   *  @dev Set the blockspan configuration blockspan of settlement
   */
  function setBlockSpan(uint256 bSpan) public onlyAuthorizedChanger() {
    blockSpan = bSpan;
  }

  /**
   *  @dev Set Settlement to be kept in finnished state after
   *  all execution is completed.
   */
  function setSettlementToStall() public onlyAuthorizedChanger() {
    setAutoRestart(SETTLEMENT_TASK, false);
  }

  /**
   *  @dev Set Settlement state to Ready
   */
  function restartSettlementState() public onlyAuthorizedChanger() {
    resetGroup(SETTLEMENT_TASK);
    setAutoRestart(SETTLEMENT_TASK, true);
  }

  /**
    @dev Gets the RedeemRequest at the queue index position
    @param _index queue position to get
    @return redeemer's address and amount he submitted
  */
  function getRedeemRequestAt(uint256 _index)
  public
  view
  withinBoundaries(_index)
  returns (address payable, uint256)
  {
    return (redeemQueue[_index].who, redeemQueue[_index].amount);
  }

  /**
    @dev Gets the number of blocks the settlemnet will be allowed to run
  */
  function getBlockSpan() public view returns (uint256) {
    return blockSpan;
  }

  /**
    @dev Verify that the index is smaller than the length of the redeem request queue
    @param _index queue position to get
  */
  modifier withinBoundaries(uint256 _index) {
    require(_index < redeemQueueLength, "Index out of boundaries");
    _;
  }

  /**
    @dev returns current redeem queue size
  */
  function redeemQueueSize() public view returns (uint256) {
    return redeemQueueLength;
  }

  /**
    @dev Returns true if blockSpan number of blocks has pass since last execution
  */
  function isSettlementEnabled() public view returns (bool) {
    return nextSettlementBlock() <= block.number;
  }

  /**
    @dev Returns true if the settlment is running
  */
  function isSettlementRunning() public view returns (bool) {
    return isGroupRunning(SETTLEMENT_TASK);
  }

  /**
    @dev Returns true if the settlment is ready
  */
  function isSettlementReady() public view returns (bool) {
    return isGroupReady(SETTLEMENT_TASK);
  }

  /**
    @dev Returns the next block from which settlement is possible
  */
  function nextSettlementBlock() public view returns (uint256) {
    return lastProcessedBlock.add(blockSpan);
  }

  /**
    @dev returns the total amount of StableTokens in the redeem queue for _who
    @param _who address for which ^ is computed
    @return total amount of StableTokens in the redeem queue for _who [using mocPrecision]
  */
  function stableTokenAmountToRedeem(address _who) public view returns (uint256) {
    if (!redeemMapping[_who].activeRedeemer) {
      return 0;
    }

    uint256 indexRedeem = redeemMapping[_who].index;
    RedeemRequest memory redeemRequest = redeemQueue[indexRedeem];
    return redeemRequest.amount;
  }

  /**
    @dev push a new redeem request to the queue for the sender or updates the amount if the user has a redeem request
    @param amount amount he is willing to redeem [using mocPrecision]
    @param redeemer redeemer address
  */
  function addRedeemRequest(uint256 amount, address payable redeemer)
  public
  onlyWhitelisted(msg.sender)
  {
    if (!redeemMapping[redeemer].activeRedeemer) {
      if (redeemQueueLength == redeemQueue.length) {
        redeemQueue.length += 1;
      }
      uint256 index = redeemQueueLength;
      redeemQueue[redeemQueueLength++] = RedeemRequest(redeemer, amount);
      redeemMapping[redeemer] = UserRedeemRequest(index, true);
      emit RedeemRequestAlter(redeemer, true, amount);
    } else {
      alterRedeemRequestAmount(true, amount, redeemer);
    }
  }

  /**
    @dev empty the queue
  */
  function clear() public onlyWhitelisted(msg.sender) {
    redeemQueueLength = 0;
  }

  /**
    @dev Alters the redeem amount position for the redeemer
    @param isAddition true if adding amount to redeem, false to substract.
    @param delta the amount to add/substract to current position [using mocPrecision]
    @param redeemer address to alter amount for
    @return the filled amount [using mocPrecision]
  */
  function alterRedeemRequestAmount(
    bool isAddition,
    uint256 delta,
    address redeemer
  ) public onlyWhitelisted(msg.sender) {
    require(
      redeemMapping[redeemer].activeRedeemer,
      "This is not an active redeemer"
    );
    uint256 indexRedeem = redeemMapping[redeemer].index;
    RedeemRequest storage redeemRequest = redeemQueue[indexRedeem];
    require(redeemRequest.who == redeemer, "Not allowed redeemer");
    uint256 actualDelta = delta;
    if (isAddition) {
      redeemRequest.amount = redeemRequest.amount.add(delta);
    } else {
      if (redeemRequest.amount < delta) {
        actualDelta = redeemRequest.amount;
        redeemRequest.amount = 0;
      } else {
        redeemRequest.amount = redeemRequest.amount.sub(delta);
      }
    }
    emit RedeemRequestAlter(redeemer, isAddition, actualDelta);
  }

  /**
    @dev Runs settlement process in steps
    @param steps Amount of steps to run
    @return The commissions collected in the executed steps
  */
  function runSettlement(uint256 steps)
  public
  onlyWhitelisted(msg.sender)
  isTime()
  returns (uint256)
  {
    executeGroup(SETTLEMENT_TASK, steps);

    return settlementInfo.finalCommissionAmount;
  }

  /**
  @dev Create Task structures for Settlement execution
  */
  function fixTasksPointer() public {
    resetTaskPointers(
      DELEVERAGING_TASK,
      deleveragingStepCount,
      deleveragingStep,
      noFunction,
      finishDeleveraging
    );
    resetTaskPointers(
      StableToken_REDEMPTION_TASK,
      stableTokenRedemptionStepCount,
      stableTokenRedemptionStep,
      noFunction,
      finishStableTokenRedemption
    );

    bytes32[] memory tasks = new bytes32[](2);
    tasks[0] = DELEVERAGING_TASK;
    tasks[1] = StableToken_REDEMPTION_TASK;

    resetTaskGroupPointers(
      SETTLEMENT_TASK,
      tasks,
      initializeSettlement,
      finishSettlement,
      true
    );
  }

  function initializeContracts() internal {
    stableToken = StableToken(connector.stableToken());
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    mocState = IMoCState(connector.mocState());
    mocExchange = IMoCExchange(connector.mocExchange());
  }

  function initializeValues(address _governor, uint256 _blockSpan) internal {
    governor = IGovernor(_governor);
    blockSpan = _blockSpan;
    lastProcessedBlock = block.number;
    initializeTasks();
  }

  modifier isTime() {
    require(isSettlementEnabled(), "Settlement not yet enabled");
    _;
  }

  /**************************************************/
  /******************** TASKS ***********************/
  /**************************************************/

  /**
  @dev Returns the amount of steps for the Deleveraging task
  which is the amount of active RiskProx addresses
*/
  function deleveragingStepCount() internal view returns (uint256) {
    return riskProxManager.getActiveAddressesCount(BUCKET_X2);
  }

  /**
  @dev Returns the amount of steps for the StableToken Redemption task
  which is the amount of redeem requests in the queue
*/
  function stableTokenRedemptionStepCount() internal view returns (uint256) {
    // If Protected Mode is reached, DoCs in queue must not be redeemed until next settlement
    if (mocState.globalCoverage() <= mocState.getProtected()) {
      return 0;
    }
    return redeemQueueLength;
  }

  /**
  @dev Freezes state for Settlement execution
*/
  function initializeSettlement() internal {
    settlementInfo.leverage = mocState.leverage(BUCKET_X2);
    settlementInfo.reservePrice = mocState.getReserveTokenPrice();
    settlementInfo.riskProxPrice = mocState.bucketRiskProTecPrice(BUCKET_X2);
    settlementInfo.startBlockNumber = block.number;

    // Protected Mode
    if (mocState.globalCoverage() <= mocState.getProtected()) {
      settlementInfo.isProtectedMode = true;
    } else {
      settlementInfo.isProtectedMode = false;
    }

    settlementInfo.stableTokenRedeemCount = redeemQueueLength;
    settlementInfo.deleveragingCount = riskProxManager.getActiveAddressesCount(
      BUCKET_X2
    );
    settlementInfo.finalCommissionAmount = 0;
    settlementInfo.partialCommissionAmount = 0;
    settlementInfo.startBlockNumber = block.number;

    // Reset total paid in MoC for every vendor
    IMoCVendors mocVendors = IMoCVendors(mocState.getMoCVendors());
    mocVendors.resetTotalPaidInMoC();

    emit SettlementStarted(
      settlementInfo.stableTokenRedeemCount,
      settlementInfo.deleveragingCount,
      settlementInfo.riskProxPrice,
      settlementInfo.reservePrice
    );
  }

  /**
  @dev Execute final step of Settlement task group
*/
  function finishSettlement() internal {
    lastProcessedBlock = lastProcessedBlock.add(blockSpan);
    settlementInfo.finalCommissionAmount = settlementInfo
    .partialCommissionAmount;
    emit SettlementCompleted(settlementInfo.finalCommissionAmount);
  }

  /**
  @dev Execute final step of Deleveraging task
*/
  function finishDeleveraging() internal {
    emit SettlementDeleveraging(
      settlementInfo.leverage,
      settlementInfo.riskProxPrice,
      settlementInfo.reservePrice,
      settlementInfo.startBlockNumber
    );

    riskProxManager.emptyBucket(BUCKET_X2, BUCKET_C0);
  }

  /**
  @dev Execute final step of StableTokenRedemption task
*/
  function finishStableTokenRedemption() internal {
    emit SettlementRedeemStableToken(
      settlementInfo.stableTokenRedeemCount,
      settlementInfo.finalCommissionAmount,
      settlementInfo.reservePrice
    );

    if (!settlementInfo.isProtectedMode) {
      clear();
    }
  }

  /**
  @dev Individual Deleveraging step to be executed in partial execution
  uint256 parameter needed for PartialExecution
*/
  function deleveragingStep(uint256) internal {
    // We just pop the first element because the redemption always remove the address.
    address payable userAddress = riskProxManager.getActiveAddresses(
      BUCKET_X2
    )[0];
    uint256 riskProxBalance = riskProxManager.riskProxBalanceOf(
      BUCKET_X2,
      userAddress
    );

    // ReserveTokens sending could only fail if the receiving address
    // executes code and reverts. If that happens, the user will lose
    // his RiskProx and ReserveTokens will be kept in MoC.
    mocExchange.forceRedeemRiskProx(
      BUCKET_X2,
      userAddress,
      riskProxBalance,
      settlementInfo.riskProxPrice
    );
  }

  /**
  @dev Individual StableTokenRedemption step to be executed in partial execution
  @param index Step number currently in execution
*/
  function stableTokenRedemptionStep(uint256 index) internal {
    (address payable redeemer, uint256 redeemAmount) = getRedeemRequestAt(
      index
    );
    uint256 userStableTokenBalance = stableToken.balanceOf(redeemer);
    uint256 amountToRedeem = Math.min(userStableTokenBalance, redeemAmount);
    if (amountToRedeem > 0) {
      (bool result, uint256 reserveTokenCommissionSpent) = mocExchange
      .redeemStableTokenWithPrice(
        redeemer,
        amountToRedeem,
        settlementInfo.reservePrice
      );
      // Redemption can fail if the receiving address is a contract
      if (result) {
        emit RedeemRequestProcessed(
          redeemer,
          reserveTokenCommissionSpent,
          amountToRedeem
        );
        settlementInfo.partialCommissionAmount = settlementInfo
        .partialCommissionAmount
        .add(reserveTokenCommissionSpent);
      }
    }
    UserRedeemRequest storage userReedem = redeemMapping[redeemer];
    userReedem.activeRedeemer = false;
    redeemQueue[index].amount = 0;
  }

  /**
  @dev Create Task structures for Settlement execution
*/
  function initializeTasks() internal {
    createTask(
      DELEVERAGING_TASK,
      deleveragingStepCount,
      deleveragingStep,
      noFunction,
      finishDeleveraging
    );
    createTask(
      StableToken_REDEMPTION_TASK,
      stableTokenRedemptionStepCount,
      stableTokenRedemptionStep,
      noFunction,
      finishStableTokenRedemption
    );

    bytes32[] memory tasks = new bytes32[](2);
    tasks[0] = DELEVERAGING_TASK;
    tasks[1] = StableToken_REDEMPTION_TASK;

    createTaskGroup(
      SETTLEMENT_TASK,
      tasks,
      initializeSettlement,
      finishSettlement,
      true
    );
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


contract MoCSettlement_v0116_2 is MoCSettlement {

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/

  event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);

  /**
    @dev Migrates to a new stable token contract
    @param newStableTokenAddress_ new stable token contract address
  */
  function migrateStableToken(address newStableTokenAddress_) public {
    emit StableTokenMigrated(address(stableToken), newStableTokenAddress_);
    stableToken = StableToken(newStableTokenAddress_);
  }
}



/**
  @title StableTokenMigrationChanger
 */
contract StableTokenMigrationChanger is ChangeContract {
  UpgradeDelegator public upgradeDelegator;
  address public stableTokenV2;
  address public tokenMigrator;

  // MoC
  AdminUpgradeabilityProxy public mocProxy;
  address public mocCurrentImp;
  address public mocAtomicImp;
  // MocConnector
  AdminUpgradeabilityProxy public mocConnectorProxy;
  address public mocConnectorCurrentImp;
  address public mocConnectorAtomicImp;
  // MocExchange
  AdminUpgradeabilityProxy public mocExchangeProxy;
  address public mocExchangeCurrentImp;
  address public mocExchangeAtomicImp;
  // MocState
  AdminUpgradeabilityProxy public mocStateProxy;
  address public mocStateCurrentImp;
  address public mocStateAtomicImp;
  // MocSettlement
  AdminUpgradeabilityProxy public mocSettlementProxy;
  address public mocSettlementCurrentImp;
  address public mocSettlementAtomicImp;

  /**
    @notice Constructor
    @param _upgradeDelegator Address of the upgradeDelegator in charge of that proxy
    @param _stableTokenV2 Address of the new Stable Token to migrate
    @param _tokenMigrator Address of the Token Migrator contract who recives Stable Token V1 
        and makes the swaps to Stable Token V2
    @param _mocProxy MoC proxy address
    @param _mocAtomicImp MoC atomic implementation address
    @param _mocConnectorAtomicImp MoCConnector atomic implementation address
    @param _mocExchangeAtomicImp MoCExchange atomic implementation address
    @param _mocStateAtomicImp MoCState atomic implementation address
    @param _mocSettlementAtomicImp MoCSettlement atomic implementation address
  */
  constructor(
    UpgradeDelegator _upgradeDelegator,
    address _stableTokenV2,
    address _tokenMigrator,
    AdminUpgradeabilityProxy _mocProxy,
    address _mocAtomicImp,
    address _mocConnectorAtomicImp,
    address _mocExchangeAtomicImp,
    address _mocStateAtomicImp,
    address _mocSettlementAtomicImp) public {
    upgradeDelegator = _upgradeDelegator;
    stableTokenV2 = _stableTokenV2;
    tokenMigrator = _tokenMigrator;
    // MoC
    mocProxy = _mocProxy;
    mocCurrentImp = upgradeDelegator.getProxyImplementation(_mocProxy);
    mocAtomicImp = _mocAtomicImp;
    // MocConnector
    MoCConnector mocConnector = MoC(address(_mocProxy)).connector();
    mocConnectorProxy = castToAdminUpgradeabilityProxy(address(mocConnector));
    mocConnectorCurrentImp = upgradeDelegator.getProxyImplementation(mocConnectorProxy);
    mocConnectorAtomicImp = _mocConnectorAtomicImp;
    // MocExchange
    mocExchangeProxy = castToAdminUpgradeabilityProxy(mocConnector.mocExchange());
    mocExchangeCurrentImp = upgradeDelegator.getProxyImplementation(mocExchangeProxy);
    mocExchangeAtomicImp = _mocExchangeAtomicImp;
    // MocState
    mocStateProxy = castToAdminUpgradeabilityProxy(mocConnector.mocState());
    mocStateCurrentImp = upgradeDelegator.getProxyImplementation(mocStateProxy);
    mocStateAtomicImp = _mocStateAtomicImp;
    // MocSettlement
    mocSettlementProxy = castToAdminUpgradeabilityProxy(mocConnector.mocSettlement());
    mocSettlementCurrentImp = upgradeDelegator.getProxyImplementation(mocSettlementProxy);
    mocSettlementAtomicImp = _mocSettlementAtomicImp;
  }

  /**
   * @notice cast non payable address to AdminUpgradebilityProxy
   * @param _address address to cast
   */
  function castToAdminUpgradeabilityProxy(address _address) internal returns (AdminUpgradeabilityProxy proxy) {
    return AdminUpgradeabilityProxy(address(uint160(_address)));
  }

  /**
    @notice Execute the changes.
    @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
    the current architecture
    IMPORTANT: This function should not be overriden, you should only redefine the _beforeUpgrade and _afterUpgrade to use this template
   */
  function execute() external {
    _beforeUpgrade();
    _upgrade();
    _afterUpgrade();
  }

  /**
    @notice Upgrade the proxy to the newImplementation
    @dev IMPORTANT: This function should not be overriden
   */
  function _upgrade() internal {
    // MoC
    upgradeDelegator.upgrade(mocProxy, mocAtomicImp);
    // MocConnector
    upgradeDelegator.upgrade(mocConnectorProxy, mocConnectorAtomicImp);
    // MocExchange
    upgradeDelegator.upgrade(mocExchangeProxy, mocExchangeAtomicImp);
    // MocState
    upgradeDelegator.upgrade(mocStateProxy, mocStateAtomicImp);
    // MocSettlement
    upgradeDelegator.upgrade(mocSettlementProxy, mocSettlementAtomicImp);
    
    MoC_v0116_2(address(mocProxy)).migrateStableToken(stableTokenV2);
    MoCConnector_v0116_2(address(mocConnectorProxy)).migrateStableToken(stableTokenV2);
    MoCExchange_v0116_2(address(mocExchangeProxy)).migrateStableToken(stableTokenV2, tokenMigrator);
    MoCState_v0116_2(address(mocStateProxy)).migrateStableToken(stableTokenV2);
    MoCSettlement_v0116_2(address(mocSettlementProxy)).migrateStableToken(stableTokenV2);

    // upgrade again to the current implementation, we don't want that Atomicimplementation be alive more than
    // this atomic transaction
    // MoC
    upgradeDelegator.upgrade(mocProxy, mocCurrentImp);
    // MocConnector
    upgradeDelegator.upgrade(mocConnectorProxy, mocConnectorCurrentImp);
    // MocExchange
    upgradeDelegator.upgrade(mocExchangeProxy, mocExchangeCurrentImp);
    // MocState
    upgradeDelegator.upgrade(mocStateProxy, mocStateCurrentImp);
    // MocSettlement
    upgradeDelegator.upgrade(mocSettlementProxy, mocSettlementCurrentImp);
  }

  /**
    @notice Intended to prepare the system for the upgrade
    @dev This function can be overriden by child changers to upgrade contracts that require some preparation before the upgrade
   */
  function _beforeUpgrade() internal {
  }

  /**
    @notice Intended to do the final tweaks after the upgrade, for example initialize the contract
    @dev This function can be overriden by child changers to upgrade contracts that require some changes after the upgrade
   */
  function _afterUpgrade() internal {
    // verify that all proxies finish the process with the original implementation
    require(upgradeDelegator.getProxyImplementation(mocProxy) == mocCurrentImp, "Wrong MoC implementation");
    require(upgradeDelegator.getProxyImplementation(mocConnectorProxy) == mocConnectorCurrentImp, "Wrong MoCConnector implementation");
    require(upgradeDelegator.getProxyImplementation(mocExchangeProxy) == mocExchangeCurrentImp, "Wrong MoCExchange implementation");
    require(upgradeDelegator.getProxyImplementation(mocStateProxy) == mocStateCurrentImp, "Wrong MoCState implementation");
    require(upgradeDelegator.getProxyImplementation(mocSettlementProxy) == mocSettlementCurrentImp, "Wrong MoCSettlement implementation");
  }
}

