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


// Dependency file: openzeppelin-eth/contracts/ownership/Ownable.sol

// pragma solidity ^0.5.0;

// import "zos-lib/contracts/Initializable.sol";

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable is Initializable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    function initialize(address sender) public initializer {
        _owner = sender;
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

    uint256[50] private ______gap;
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


// Dependency file: moc-governance/contracts/Governance/IGovernor.sol

// pragma solidity 0.5.8;

// import "moc-governance/contracts/Governance/ChangeContract.sol";

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


// Dependency file: moc-governance/contracts/Governance/Governed.sol

// pragma solidity 0.5.8;

// import "moc-governance/contracts/Governance/IGovernor.sol";
// import "zos-lib/contracts/Initializable.sol";

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


// Dependency file: moc-governance/contracts/Stopper/Stoppable.sol

// pragma solidity 0.5.8;

// import "moc-governance/contracts/Governance/Governed.sol";


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


// Dependency file: moc-governance/contracts/Stopper/Stopper.sol

// pragma solidity 0.5.8;

// import "openzeppelin-eth/contracts/ownership/Ownable.sol";
// import "moc-governance/contracts/Stopper/Stoppable.sol";

/**
  @title Stopper
  @notice The contract in charge of handling the stoppability of the contract
  that define this contract as its stopper
 */
contract Stopper is Ownable {

  /**
    @notice Pause activeContract if it is stoppable
    @param activeContract Contract to be paused
   */
  function pause(Stoppable activeContract) external onlyOwner {
    activeContract.pause();
  }

  /**
    @notice Unpause pausedContract if it is stoppable
    @param pausedContract Contract to be unpaused
   */
  function unpause(Stoppable pausedContract) external onlyOwner {
    pausedContract.unpause();
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


// Root file: contracts/mocks/MockStopper.sol

pragma solidity 0.5.8;

// import "moc-governance/contracts/Stopper/Stopper.sol";

// TODO Think of a better way to
// force solidity to compile the Stopper so we can require it

contract MockStopper is Stopper {

}

