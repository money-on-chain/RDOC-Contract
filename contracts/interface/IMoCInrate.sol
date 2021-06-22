pragma solidity ^0.5.8;

interface IMoCInrate {
    // Transaction types
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

    function calcStableTokenRedInterestValues(uint256 STABLETOKENAmount, uint256 reserveAmount) external view returns(uint256);

    function calcMintInterestValues(bytes32 bucket, uint256 reserveAmount) external view returns(uint256);

    function calcFinalRedeemInterestValue(bytes32 bucket, uint256 reserveToRedeem) external view returns(uint256);

    function setRiskProInterestBlockSpan(uint256 newBitProBlockSpan) external;
}