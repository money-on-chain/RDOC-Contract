// Dependency file: zos-lib/contracts/Initializable.sol

// pragma solidity >=0.4.24 <0.6.0;


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


// Dependency file: moc-governance/contracts/Blockability/Blockable.sol

// pragma solidity 0.5.8;

// import "zos-lib/contracts/Initializable.sol";

/**
  @title Blockable
  @notice Base contract to be able to define a blockable contract. The blocked contract
  is blocked until a certain date. That date cannot be changed while the contract is blocked so
  it is guaranteed that you will be blocked until that date
  */
contract Blockable is Initializable {

  string constant private NOT_AUTHORIZED_TO_BLOCK = "not_authorized_to_block";
  string constant private BLOCKED = "blocked";
  string constant private THRESHOLD_TOO_LOW = "threshold_too_low";

  uint256 public unblockDate;

  /**
    @notice Disables functions that should be disabled when the governor is blocked
   */
  modifier notBlocked() {
    require(!isBlocked(), BLOCKED);
    _;
  }

  /**
    @notice Returns true if no change can be executed in the current block
   */
  function isBlocked() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return now < unblockDate;
  }

  /**
    @notice Initialize the contract with the basic settings
    @dev This initialize replaces the constructor but it is not called automatically.
    It is necessary because of the upgradeability of the contracts
    @param _firstUnblockDate Timestamp of the first threshold that should be passed before the governor is active
      again
   */
  function initialize(uint256 _firstUnblockDate) public initializer {
    unblockDate = _firstUnblockDate;
  }


  /**
    @notice Defines which addresses are authorized to Block and which are not
    @dev Should be defined by subclasses
    @param who Address that is being asked for
   */
  function isAuthorizedToBlock(address who) public view returns(bool);
  /**
    @notice Blocks the governor until unblockAt
    @dev The new threshold should be big enough to block the governor after the tx and the contract should not be blocked, but that is enforced
    in the executeChange function which ALWAYS should be called before calling this function because it is the only one authorizing a changer
    @param newUnblockDate Timestamp of the next threshold that should be passed before the governor is active
      again
   */
  function blockUntil(uint256 newUnblockDate) public notBlocked {
    require(isAuthorizedToBlock(msg.sender), NOT_AUTHORIZED_TO_BLOCK);
    // solium-disable-next-line security/no-block-members
    require(now < newUnblockDate, THRESHOLD_TOO_LOW);
    unblockDate = newUnblockDate;
  }


  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


// Dependency file: moc-governance/contracts/Governance/ChangeContract.sol

// pragma solidity 0.5.8;

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


// Dependency file: moc-governance/contracts/ChangersTemplates/Blocker.sol

// pragma solidity 0.5.8;

// import "moc-governance/contracts/Blockability/Blockable.sol";
// import "moc-governance/contracts/Governance/ChangeContract.sol";

/**
  @title Blocker
  @notice This contract is a ChangeContract intended to be used when
  you want to block a Blockable (example: BlockableGovernor )
 */
contract Blocker is ChangeContract {

  Blockable public blockable;
  uint256 public unblockDate;

  /**
    @notice Constructor
    @param _blockable Address of the contract to be blocked
    @param _unblockDate Date that marks when the blockable will be unblocked
  */
  constructor(Blockable _blockable, uint256 _unblockDate) public {
    blockable = _blockable;
    unblockDate = _unblockDate;
  }

  /**
    @notice Execute the changes.
    @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
    the current architecture
   */
  function execute() external {
    blockable.blockUntil(unblockDate);
  }
}


// Root file: contracts/mocks/MockBlocker.sol

pragma solidity 0.5.8;

// import "moc-governance/contracts/ChangersTemplates/Blocker.sol";

// TODO Think of a better way to
// force solidity to compile the Blocker so we can require it

contract MockBlocker is Blocker{

}

