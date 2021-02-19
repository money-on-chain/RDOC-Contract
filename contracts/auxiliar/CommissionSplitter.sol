pragma solidity 0.5.8;

import "moc-governance/contracts/Governance/Governed.sol";
import "moc-governance/contracts/Governance/IGovernor.sol";
import "../MoC.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-eth/contracts/utils/ReentrancyGuard.sol";

/**
  @dev Contract that split his balance between two addresses based on a
  proportion defined by Governance. One of those addresses should
  be a Money on Chain RRC20 contract.
 */
contract CommissionSplitter is Governed, ReentrancyGuard {
  event SplitExecuted(uint256 commissionAmount, uint256 mocAmount);
  // Math
  using SafeMath for uint256;
  uint256 constant public PRECISION = 10 ** 18;

  // Final receiver address
  address public commissionsAddress;
  // Proportion of the balance to send to moc
  uint256 internal mocProportion;

  // Contracts
  MoC public moc;
  IERC20 public reserveToken;

  /**
    @dev Initialize commission splitter contract
    @param _mocAddress the address of MoC contract
    @param _commissionsAddress the address in which the remaining commissions (profit ones) are sent
    @param _mocProportion the proportion of commission that moc will keep, it should have PRECISION precision
    @param _governor the address of the IGovernor contract
    @param _reserveToken the address of the ReserveToken contract
   */
  function initialize(
    MoC _mocAddress,
    address payable _commissionsAddress,
    uint256 _mocProportion,
    IGovernor _governor,
    address _reserveToken
  ) public initializer {
    _setMocProportion(_mocProportion);
    moc = _mocAddress;
    reserveToken = IERC20(_reserveToken);
    commissionsAddress = _commissionsAddress;

    Governed.initialize(_governor);
  }

  /**
    @dev Split current balance of the contract, and sends one part
    to destination address and the other to MoC Reserves.
   */
  function split() public {
    uint256 currentBalance = reserveToken.balanceOf(address(this));
    uint256 mocAmount = currentBalance.mul(mocProportion).div(PRECISION);
    uint256 commissionAmount = currentBalance.sub(mocAmount);

    _sendReservesToMoC(mocAmount);
    reserveToken.transfer(commissionsAddress, commissionAmount);

    emit SplitExecuted(commissionAmount, mocAmount);
  }

  // Governance Setters
  function setCommissionAddress(address _commissionAddress) public onlyAuthorizedChanger {
    commissionsAddress = _commissionAddress;
  }

  function setMocProportion(uint256 _mocProportion) public onlyAuthorizedChanger {
    _setMocProportion(_mocProportion);
  }

  function _setMocProportion(uint256 _mocProportion) internal {
    require(_mocProportion <= PRECISION, "Proportion should not be higher than precision");
    mocProportion = _mocProportion;
  }

  /**
    @dev Sends tokens to Money on chain reserves
   */
  function _sendReservesToMoC(uint256 amount) internal {
    reserveToken.approve(address(moc), amount);
    moc.addReserves(amount);
  }

}
