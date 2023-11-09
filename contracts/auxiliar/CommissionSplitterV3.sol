pragma solidity ^0.5.8;

import "moc-governance/contracts/Governance/Governed.sol";
import "moc-governance/contracts/Governance/IGovernor.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-eth/contracts/utils/ReentrancyGuard.sol";

/**
  @dev Contract that split his balance between two addresses based on a
  proportion defined by Governance.
 */
contract CommissionSplitterV3 is Governed, ReentrancyGuard {

  event SplitExecuted(uint256 outputAmount_1, uint256 outputAmount_2);

  // Math
  using SafeMath for uint256;
  uint256 public constant PRECISION = 10**18;

  // Collateral asset splitter

  IERC20 public reserveToken;

  // Output_1 receiver address
  address public outputAddress_1;

  // Output_2 receiver address
  address public outputAddress_2;

  // Proportion of the balance to Output 1
  uint256 public outputProportion_1;

  /**
    @dev Initialize commission splitter contract
    @param _governor the address of the IGovernor contract
    @param _reserveToken the address of the ReserveToken contract
    @param _outputAddress_1 the address receiver #1
    @param _outputAddress_2 the address receiver #2
    @param _outputProportion_1 the proportion of commission will send to address #1, it should have PRECISION precision
   */
  function initialize(
    IGovernor _governor,
    IERC20 _reserveToken,
    address _outputAddress_1,
    address _outputAddress_2,
    uint256 _outputProportion_1
  ) public initializer {

    require(
      _outputProportion_1 <= PRECISION,
      "Output Proportion #1 should not be higher than precision"
    );

    reserveToken = IERC20(_reserveToken);
    outputAddress_1 = _outputAddress_1;
    outputAddress_2 = _outputAddress_2;
    outputProportion_1 = _outputProportion_1;
    Governed.initialize(_governor);
  }

  /**
  @dev Split current balance of the contract, and sends one part
  to destination address #1 and the other to destination address #2.
   */
  function split() public nonReentrant {

    // Split collateral Assets

    uint256 currentBalance = reserveToken.balanceOf(address(this));
    uint256 outputAmount_1 = currentBalance.mul(outputProportion_1).div(PRECISION);
    uint256 outputAmount_2 = currentBalance.sub(outputAmount_1);

    // sends reserve token to output 1
    if (outputAmount_1 > 0) {
      reserveToken.transfer(outputAddress_1, outputAmount_1);
    }

    // send reserve token to output 2
    if (outputAmount_2 > 0) {
      reserveToken.transfer(outputAddress_2, outputAmount_2);
    }

    emit SplitExecuted(outputAmount_1, outputAmount_2);
  }

  // Governance Setters

  function setOutputAddress_1(address payable _outputAddress_1)
    public
    onlyAuthorizedChanger
  {
    outputAddress_1 = _outputAddress_1;
  }

  function setOutputAddress_2(address payable _outputAddress_2)
    public
    onlyAuthorizedChanger
  {
    outputAddress_2 = _outputAddress_2;
  }

  function setOutputProportion_1(uint256 _outputProportion_1)
    public
    onlyAuthorizedChanger
  {
    require(
      _outputProportion_1 <= PRECISION,
      "Output Proportion #1 should not be higher than precision"
    );
    outputProportion_1 = _outputProportion_1;
  }

}
