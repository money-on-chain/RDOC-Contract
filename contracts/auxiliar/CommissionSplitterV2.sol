pragma solidity ^0.5.8;

import "moc-governance/contracts/Governance/Governed.sol";
import "moc-governance/contracts/Governance/IGovernor.sol";
import "../interfaces/IMoC.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-eth/contracts/utils/ReentrancyGuard.sol";

/**
  @dev Contract that split his balance between two addresses based on a
  proportion defined by Governance.
 */
contract CommissionSplitterV2 is Governed, ReentrancyGuard {

  event SplitExecuted(
    uint256 outputAmount_1,
    uint256 outputAmount_2,
    uint256 outputAmount_3,
    uint256 outputTokenGovernAmount_1,
    uint256 outputTokenGovernAmount_2
  );

  // Math
  using SafeMath for uint256;
  uint256 public constant PRECISION = 10**18;

  // Collateral asset splitter

  IERC20 public reserveToken;

  // Output_1 receiver MoC Contract address
  IMoC public outputMoC;

  // Output_2 receiver address
  address public outputAddress_2;

  // Output_3 receiver address
  address public outputAddress_3;

  // Proportion of the balance to Output 1
  uint256 public outputProportion_1;

  // Proportion of the balance to Output 2
  uint256 public outputProportion_2;

  // Token Govern splitter

  // Output Token Govern #1 receiver address
  address public outputTokenGovernAddress_1;

  // Output Token Govern #2 receiver address
  address public outputTokenGovernAddress_2;

  // Proportion of the balance of Token Govern to Output 1
  uint256 public outputProportionTokenGovern_1;

  // Token Govern Address
  IERC20 public tokenGovern;

  /**
    @dev Initialize commission splitter contract
    @param _governor the address of the IGovernor contract
    @param _reserveToken the address of the ReserveToken contract
    @param _outputMoC the address receiver MoC Contract #1
    @param _outputAddress_2 the address receiver #2
    @param _outputAddress_3 the address receiver #3
    @param _outputProportion_1 the proportion of commission will send to address #1, it should have PRECISION precision
    @param _outputProportion_2 the proportion of commission will send to address #2, it should have PRECISION precision
    @param _outputTokenGovernAddress_1 the address receiver #1
    @param _outputTokenGovernAddress_2 the address receiver #2
    @param _outputProportionTokenGovern_1 the proportion of commission will send to address #1, it should have PRECISION precision
    @param _tokenGovern the address of Token Govern contract
   */
  function initialize(
    IGovernor _governor,
    IERC20 _reserveToken,
    IMoC _outputMoC,
    address _outputAddress_2,
    address _outputAddress_3,
    uint256 _outputProportion_1,
    uint256 _outputProportion_2,
    address _outputTokenGovernAddress_1,
    address _outputTokenGovernAddress_2,
    uint256 _outputProportionTokenGovern_1,
    IERC20 _tokenGovern
  ) public initializer {

    require(
      _outputProportion_1 <= PRECISION,
      "Output Proportion #1 should not be higher than precision"
    );

    require(
      _outputProportion_1.add(_outputProportion_2) <= PRECISION,
      "Output Proportion #1 and Output Proportion #2 should not be higher than precision"
    );

    require(
      _outputProportionTokenGovern_1 <= PRECISION,
      "Output Proportion Token Govern should not be higher than precision"
    );

    reserveToken = IERC20(_reserveToken);
    outputMoC = IMoC(_outputMoC);
    outputAddress_2 = _outputAddress_2;
    outputAddress_3 = _outputAddress_3;
    outputProportion_1 = _outputProportion_1;
    outputProportion_2 = _outputProportion_2;
    outputTokenGovernAddress_1 = _outputTokenGovernAddress_1;
    outputTokenGovernAddress_2 = _outputTokenGovernAddress_2;
    outputProportionTokenGovern_1 = _outputProportionTokenGovern_1;
    tokenGovern = IERC20(_tokenGovern);
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
    uint256 outputAmount_2 = currentBalance.mul(outputProportion_2).div(PRECISION);
    uint256 outputAmount_3 = currentBalance.sub(outputAmount_1.add(outputAmount_2));

    // sends reserve token to MoC Contracts
    if (outputAmount_1 > 0) {
      reserveToken.approve(address(outputMoC), outputAmount_1);
      outputMoC.addReserves(outputAmount_1);
    }

    // send reserve token to output 2
    if (outputAmount_2 > 0) {
      reserveToken.transfer(outputAddress_2, outputAmount_2);
    }

    // send reserve token to output 3
    if (outputAmount_3 > 0) {
      reserveToken.transfer(outputAddress_3, outputAmount_3);
    }

    // Split Token Govern
    uint256 tokenGovernBalance = tokenGovern.balanceOf(address(this));
    uint256 outputTokenGovernAmount_1 = tokenGovernBalance.mul(outputProportionTokenGovern_1).div(PRECISION);
    uint256 outputTokenGovernAmount_2 = tokenGovernBalance.sub(outputTokenGovernAmount_1);

    if (tokenGovernBalance > 0) {
      tokenGovern.transfer(outputTokenGovernAddress_1, outputTokenGovernAmount_1);
      tokenGovern.transfer(outputTokenGovernAddress_2, outputTokenGovernAmount_2);
    }

    emit SplitExecuted(outputAmount_1, outputAmount_2, outputAmount_3, outputTokenGovernAmount_1, outputTokenGovernAmount_2);
  }

  // Governance Setters

  function setOutputAddress_2(address payable _outputAddress_2)
    public
    onlyAuthorizedChanger
  {
    outputAddress_2 = _outputAddress_2;
  }

  function setOutputAddress_3(address payable _outputAddress_3)
    public
    onlyAuthorizedChanger
  {
    outputAddress_3 = _outputAddress_3;
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

  function setOutputProportion_2(uint256 _outputProportion_2)
    public
    onlyAuthorizedChanger
  {
    require(
      _outputProportion_2 <= PRECISION,
      "Output Proportion #2 should not be higher than precision"
    );
    outputProportion_2 = _outputProportion_2;
  }

  function setOutputTokenGovernAddress_1(address payable _outputTokenGovernAddress_1)
    public
    onlyAuthorizedChanger
  {
    outputTokenGovernAddress_1 = _outputTokenGovernAddress_1;
  }

  function setOutputTokenGovernAddress_2(address payable _outputTokenGovernAddress_2)
    public
    onlyAuthorizedChanger
  {
    outputTokenGovernAddress_2 = _outputTokenGovernAddress_2;
  }

  function setOutputProportionTokenGovern_1(uint256 _outputProportionTokenGovern_1)
    public
    onlyAuthorizedChanger
  {
    require(
      _outputProportionTokenGovern_1 <= PRECISION,
      "Output Proportion Token Govern should not be higher than precision"
    );
    outputProportionTokenGovern_1 = _outputProportionTokenGovern_1;
  }

  function setTokenGovern(address _tokenGovern) public onlyAuthorizedChanger {
    require(_tokenGovern != address(0), "Govern Token must not be 0x0");
    tokenGovern = IERC20(_tokenGovern);
  }


}
