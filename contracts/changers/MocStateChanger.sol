pragma solidity ^0.5.8;
import "../MoCState.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @dev This contract is used to update the configuration of MoCState
 * with MoC --- governance.
 */
contract MocStateChanger is ChangeContract, Ownable {
  MoCState public mocState;
  address public priceProvider;
  uint256 public newPeg;
  uint256 public uptdu;
  uint256 public maxDiscRate;
  uint256 public dayBlockSpan;
  uint256 public liq;
  uint256 public smoothingFactor;
  uint256 public emaCalculationBlockSpan;
  uint256 public maxMintRiskPro;
  address public mocPriceProvider;
  address public mocToken;
  address public mocVendors;
  bool public liquidationEnabled;
  uint256 public protected;

  constructor(
    MoCState _mocState,
    address _priceProvider,
    uint256 _newPeg,
    uint256 _uptdu,
    uint256 _maxDiscRate,
    uint256 _dayBlockSpan,
    uint256 _liq,
    uint256 _smoothingFactor,
    uint256 _emaCalculationBlockSpan,
    uint256 _maxMintRiskPro,
    address _mocPriceProvider,
    address _mocTokenAddress,
    address _mocVendorsAddress,
    bool _liquidationEnabled,
    uint256 _protected
  ) public {
    mocState = _mocState;
    newPeg = _newPeg;
    uptdu = _uptdu;
    maxDiscRate = _maxDiscRate;
    dayBlockSpan = _dayBlockSpan;
    liq = _liq;
    smoothingFactor = _smoothingFactor;
    emaCalculationBlockSpan = _emaCalculationBlockSpan;
    priceProvider = _priceProvider;
    maxMintRiskPro = _maxMintRiskPro;
    mocPriceProvider = _mocPriceProvider;
    mocToken = _mocTokenAddress;
    mocVendors = _mocVendorsAddress;
    liquidationEnabled = _liquidationEnabled;
    protected = _protected;
  }

  function execute() external {
    mocState.setPeg(newPeg);
    mocState.setDayBlockSpan(dayBlockSpan);
    mocState.setLiq(liq);
    mocState.setUtpdu(uptdu);
    mocState.setMaxDiscountRate(maxDiscRate);
    mocState.setEmaCalculationBlockSpan(emaCalculationBlockSpan);
    mocState.setSmoothingFactor(smoothingFactor);
    mocState.setPriceProvider(priceProvider);
    mocState.setMaxMintRiskPro(maxMintRiskPro);
    mocState.setMoCPriceProvider(mocPriceProvider);
    mocState.setMoCToken(mocToken);
    mocState.setMoCVendors(mocVendors);
    mocState.setLiquidationEnabled(liquidationEnabled);
    mocState.setProtected(protected);
  }

  function setMaxMintRiskPro(uint256 _maxMintRiskPro) public onlyOwner() {
    maxMintRiskPro = _maxMintRiskPro;
  }

  function setPriceProvider(address _priceProvider) public onlyOwner() {
    priceProvider = _priceProvider;
  }

  function setMoCPriceProvider(address _mocPriceProvider) public onlyOwner() {
    mocPriceProvider = _mocPriceProvider;
  }

  function setMoCToken(address _mocTokenAddress) public onlyOwner() {
    mocToken = _mocTokenAddress;
  }

  function setMoCVendors(address _mocVendorsAddress) public onlyOwner() {
    mocVendors = _mocVendorsAddress;
  }

  function setLiquidationEnabled(bool _liquidationEnabled) public onlyOwner() {
    liquidationEnabled = _liquidationEnabled;
  }

  function setProtected(uint _protected) public onlyOwner() {
    protected = _protected;
  }

  function setSmoothingFactor(uint256 factor) public onlyOwner() {
    smoothingFactor = factor;
  }

  /**
  * @param blockSpan Defines how many blocks should pass between BMA calculations
  **/
  function setEmaCalculationBlockSpan(uint256 blockSpan) public onlyOwner() {
    emaCalculationBlockSpan = blockSpan;
  }

  function updatePegValue(uint256 _newPeg) public onlyOwner() {
    newPeg = _newPeg;
  }

  function updateUtpduValue(uint256 _uptdu) public onlyOwner() {
    uptdu = _uptdu;
  }

  function updatemaxDiscRateValue(uint256 _maxDiscRate) public onlyOwner() {
    maxDiscRate = _maxDiscRate;
  }

  function updateDayBlockSpanValue(uint256 _dayBlockSpan) public onlyOwner() {
    dayBlockSpan = _dayBlockSpan;
  }

  function updateLiqValue(uint256 _liq) public onlyOwner() {
    liq = _liq;
  }
}
