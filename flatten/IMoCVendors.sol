// Root file: contracts/interface/IMoCVendors.sol

pragma solidity 0.5.8;

interface IMoCVendors {
    function resetTotalPaidInMoC() external;

    function getIsActive(address account) external view
    returns (bool);

    function getTotalPaidInMoC(address account) external view
    returns (uint256);

    function getStaking(address account) external view
    returns (uint256);

    function getMarkup(address account) external view
    returns (uint256);

    function updatePaidMarkup(address account, uint256 mocAmount, uint256 reserveAmount, uint256 totalMoCAmount) external;
}