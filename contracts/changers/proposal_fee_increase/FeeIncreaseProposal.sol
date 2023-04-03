pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/IROCMoCInrate.sol";

/**
  @notice This changer sets Fee increase & New commission splitters in MoC Platform operations
 */
contract FeeIncreaseProposal is ChangeContract, Ownable {
  IROCMoCInrate public mocInrate;
  address payable public commissionAddress;
  address payable public riskProInterestAddress;
  uint256 public riskProRate;
  CommissionRates[] public commissionRates;
  uint8 public constant COMMISSION_RATES_ARRAY_MAX_LENGTH = 50;
  uint256 public constant PRECISION = 10**18;

  struct CommissionRates {
    uint8 txType;
    uint256 fee;
  }

  constructor(
    IROCMoCInrate _mocInrate,
    address payable _commissionAddress,
    address payable _riskProInterestAddress,
    uint256 _riskProRate,
    CommissionRates[] memory _commissionRates
  ) public {
    require(_mocInrate != IROCMoCInrate(0), "Wrong MoCInrate contract address");
    require(_commissionAddress != address(0), "Wrong Commission Address");
    require(_riskProInterestAddress != address(0), "Wrong RiskPro Interest target Address");
    require(
          _riskProRate <= PRECISION,
          "Wrong riskProProRate should not be higher than precision"
        );

    mocInrate = _mocInrate;
    commissionAddress = _commissionAddress;
    riskProInterestAddress = _riskProInterestAddress;
    riskProRate = _riskProRate;
    setCommissionRatesInternal(_commissionRates);
  }

  function execute() external {
    require(mocInrate != IROCMoCInrate(0), "Wrong MoCInrate contract address");

    mocInrate.setCommissionsAddress(commissionAddress);
    mocInrate.setRiskProInterestAddress(riskProInterestAddress);
    mocInrate.setRiskProRate(riskProRate);
    initializeCommissionRates();

    // Execute only one time
    mocInrate = IROCMoCInrate(0);
  }

  /**
    @dev returns the commission rate fees array length
  */
  function commissionRatesLength() public view returns (uint256) {
    return commissionRates.length;
  }

  /**
    @dev initializes the commission rate fees by transaction type to use in the MoCInrate contract
  */
  function initializeCommissionRates() internal {
    require(commissionRates.length > 0, "commissionRates cannot be empty");
    // Change the error message according to the value of the COMMISSION_RATES_ARRAY_MAX_LENGTH constant
    require(commissionRates.length <= COMMISSION_RATES_ARRAY_MAX_LENGTH, "commissionRates length must be between 1 and 50");

    for (uint256 i = 0; i < commissionRates.length; i++) {
      mocInrate.setCommissionRateByTxType(commissionRates[i].txType, commissionRates[i].fee);
    }
  }

  function setCommissionRatesInternal(CommissionRates[] memory _commissionRates) internal {
    require(_commissionRates.length > 0, "commissionRates cannot be empty");
    // Change the error message according to the value of the COMMISSION_RATES_ARRAY_MAX_LENGTH constant
    require(_commissionRates.length <= COMMISSION_RATES_ARRAY_MAX_LENGTH, "commissionRates length must be between 1 and 50");

    delete commissionRates;

    for (uint256 i = 0; i < _commissionRates.length; i++){
      commissionRates.push(_commissionRates[i]);
    }
  }

}