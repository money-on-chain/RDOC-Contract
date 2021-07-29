pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "../MoCInrate.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @dev This contract is used to update the configuration of MocInrate
 * with MoC --- governance.
 */
contract MocInrateChanger is ChangeContract, Ownable {
  MoCInrate private mocInrate;
  uint256 public riskProInterestBlockSpan;
  uint256 public btxcTmin;
  uint256 public btxcTmax;
  uint256 public btxcPower;
  uint256 public newRiskProRate;
  /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  uint256 public newCommissionRate;
  address payable public newRiskProInterestAddress;
  address payable public newCommissionsAddress;
  uint256 public stableTmin;
  uint256 public stableTmax;
  uint256 public stablePower;

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/

  CommissionRates[] public commissionRates;
  uint8 public constant COMMISSION_RATES_ARRAY_MAX_LENGTH = 50;

  struct CommissionRates {
    uint8 txType;
    uint256 fee;
  }

  /** END UPDATE V0110: 24/09/2020 **/

  constructor(
    MoCInrate _mocInrate,
    uint256 _riskProIntBlockSpan,
    uint256 _btxcTmin,
    uint256 _btxcTmax,
    uint256 _btxcPower,
    uint256 _newRiskProRate,
    //uint256 _newComRate,
    uint256 _stableTmin,
    uint256 _stableTmax,
    uint256 _stablePower,
    CommissionRates[] memory _commissionRates
  ) public {
    mocInrate = _mocInrate;
    riskProInterestBlockSpan = _riskProIntBlockSpan;
    btxcTmin = _btxcTmin;
    btxcTmax = _btxcTmax;
    btxcPower = _btxcPower;
    newRiskProRate = _newRiskProRate;
    //newCommissionRate = _newComRate;
    stableTmin = _stableTmin;
    stableTmax = _stableTmax;
    stablePower = _stablePower;

    setCommissionRatesInternal(_commissionRates);
  }

  function execute() external {
    mocInrate.setRiskProInterestBlockSpan(riskProInterestBlockSpan);
    mocInrate.setRiskProxTmin(btxcTmin);
    mocInrate.setRiskProxTmax(btxcTmax);
    mocInrate.setRiskProxPower(btxcPower);

    mocInrate.setRiskProRate(newRiskProRate);
    if (address(0) != newCommissionsAddress){
      mocInrate.setCommissionsAddress(newCommissionsAddress);
    }
    if (address(0) != newRiskProInterestAddress){
      mocInrate.setRiskProInterestAddress(newRiskProInterestAddress);
    }

    //mocInrate.setCommissionRate(newCommissionRate);

    mocInrate.setStableTmin(stableTmin);
    mocInrate.setStableTmax(stableTmax);
    mocInrate.setStablePower(stablePower);

    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    initializeCommissionRates();
  }

  function setRiskProInterestBlockSpan(uint256 _riskProInterestBlockSpan) public onlyOwner(){
    riskProInterestBlockSpan = _riskProInterestBlockSpan;
  }

  function setRiskProxTmin(uint256 _btxcTmin) public onlyOwner(){
    btxcTmin = _btxcTmin;
  }

  function setRiskProxTmax(uint256 _btxcTmax) public onlyOwner(){
    btxcTmax = _btxcTmax;
  }

  function setRiskProxPower(uint256 _btxcPower) public onlyOwner(){
    btxcPower = _btxcPower;
  }

  function setRiskProInterestAddress(address payable _newRiskProInterestAddress) public onlyOwner(){
    newRiskProInterestAddress = _newRiskProInterestAddress;
  }

  function setRiskProRate(uint256 _newRiskProRate) public onlyOwner(){
    newRiskProRate = _newRiskProRate;
  }

  function setCommissionsAddress(address payable _newCommissionsAddress) public onlyOwner(){
    newCommissionsAddress = _newCommissionsAddress;
  }

  // function setCommissionRate(uint256 _newCommissionRate) public onlyOwner(){
  //   newCommissionRate = _newCommissionRate;
  // }

  function setStableTmin(uint256 _stableTmin) public onlyOwner(){
    stableTmin = _stableTmin;
  }

  function setStableTmax(uint256 _stableTmax) public onlyOwner(){
    stableTmax = _stableTmax;
  }

  function setStablePower(uint256 _stablePower) public onlyOwner(){
    stablePower = _stablePower;
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Public functions **/

  /**
    @dev returns the commission rate fees array length
  */
  function commissionRatesLength() public view returns (uint256) {
    return commissionRates.length;
  }

  function setCommissionRates(CommissionRates[] memory _commissionRates) public onlyOwner(){
    setCommissionRatesInternal(_commissionRates);
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Internal functions **/

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

  /** END UPDATE V0110: 24/09/2020 **/
}
