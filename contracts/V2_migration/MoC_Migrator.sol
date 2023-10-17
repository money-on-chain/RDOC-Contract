pragma solidity ^0.5.8;

import "../MoC.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

contract MoC_Migrator is MoC {

  function migrateToV2(address mocV2Address_) external {
    uint256 balance = reserveToken.balanceOf(address(this));
    reserveToken.transfer(mocV2Address_, balance);
    // transfer riskProToken pauser role
    riskProToken.addPauser(mocV2Address_);
    riskProToken.renouncePauser();
  }
}