pragma solidity 0.5.8;

interface IMoCExchange {
    function getMoCTokenBalance(address owner, address spender) external view
    returns (uint256 mocBalance, uint256 mocAllowance);

    function mintRiskPro(address account, uint256 reserveAmount, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemRiskPro(address account, uint256 riskProAmount, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function mintStableToken(address account, uint256 reserveToMint, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemRiskProx(address payable account, bytes32 bucket, uint256 riskProxAmount, address vendorAccount)
    external returns (uint256, uint256, uint256, uint256, uint256);

    function mintRiskProx(address payable account, bytes32 bucket, uint256 reserveToMint, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemFreeStableToken(address account, uint256 stableTokenAmount, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemAllStableToken(address origin, address payable destination) external
    returns (uint256);

    function convertToMoCPrice(uint256 reserveAmount) external view returns (uint256, uint256, uint256);

    function forceRedeemRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice)
    external returns (bool);

    function redeemStableTokenWithPrice(address payable userAddress, uint256 amount, uint256 reservePrice) external
    returns (bool, uint256);
}