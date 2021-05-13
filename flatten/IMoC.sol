// Root file: contracts/interface/IMoC.sol

pragma solidity 0.5.8;

interface IMoC {
    function sendToAddress(address receiver, uint256 tokenAmount) external returns(bool);
}