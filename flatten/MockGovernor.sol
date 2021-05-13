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


// Dependency file: openzeppelin-eth/contracts/utils/ReentrancyGuard.sol

// pragma solidity ^0.5.0;

// import "zos-lib/contracts/Initializable.sol";

/**
 * @title Helps contracts guard against reentrancy attacks.
 * @author Remco Bloemen <remco@2π.com>, Eenae <alexey@mixbytes.io>
 * @dev If you mark a function `nonReentrant`, you should also
 * mark it `external`.
 */
contract ReentrancyGuard is Initializable {
    /// @dev counter to allow mutex lock with only one SSTORE operation
    uint256 private _guardCounter;

    function initialize() public initializer {
        // The counter starts at one to prevent changing it from zero to a non-zero
        // value, which is a more expensive operation.
        _guardCounter = 1;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and make it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _guardCounter += 1;
        uint256 localCounter = _guardCounter;
        _;
        require(localCounter == _guardCounter);
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


// Dependency file: moc-governance/contracts/Governance/Governor.sol

// pragma solidity 0.5.8;

// import "openzeppelin-eth/contracts/ownership/Ownable.sol";
// import "openzeppelin-eth/contracts/utils/ReentrancyGuard.sol";

// import "moc-governance/contracts/Governance/ChangeContract.sol";
// import "moc-governance/contracts/Governance/IGovernor.sol";

/**
  @title Governor
  @notice Basic governor that handles its governed contracts changes
  through trusting an external address
  */
contract Governor is ReentrancyGuard, Ownable, IGovernor {

  address private currentChangeContract;

  /**
    @notice Function to be called to make the changes in changeContract
    @param changeContract Address of the contract that will execute the changes
   */
  function executeChange(ChangeContract changeContract) external {
    _executeChange(changeContract);
  }


  /**
    @notice Returns true if the _changer address is currently authorized to make
    changes within the system
    @param _changer Address of the contract that will be tested
   */
  function isAuthorizedChanger(address _changer) external view returns (bool) {
    return _isAuthorizedChanger(_changer);
  }



  /**
    @notice Function to be called to make the changes in changeContract
    @param changeContract Address of the contract that will execute the changes
   */
  function _executeChange(ChangeContract changeContract) internal nonReentrant onlyOwner {
    enableChangeContract(changeContract);
    changeContract.execute();
    disableChangeContract();
  }

  /**
    @notice Returns true if the _changer address is currently authorized to make
    changes within the system
    @param _changer Address of the contract that will be tested
   */
  function _isAuthorizedChanger(address _changer) internal view returns (bool) {
    return currentChangeContract == _changer;
  }

  /**
    @notice Authorize the changeContract address to make changes
    @param changeContract Address of the contract that will be authorized
   */
  function enableChangeContract(ChangeContract changeContract) internal {
    currentChangeContract = address(changeContract);
  }

  /**
    @notice UNAuthorize the currentChangeContract address to make changes
   */
  function disableChangeContract() internal {
    currentChangeContract = address(0x0);
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


// Root file: contracts/mocks/MockGovernor.sol

pragma solidity 0.5.8;

// import "moc-governance/contracts/Governance/Governor.sol";

// TODO Think of a better way to
// force solidity to compile the Governor so we can require it

contract MockGovernor is Governor {

}

