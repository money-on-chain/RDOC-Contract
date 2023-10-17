pragma solidity ^0.5.8;


contract Deprecated {

  // ==================================================
  //            CONTRACT DEPRECATED
  // ==================================================
  //
  // MoC protocol was migrated to V2 and the entire contract is deprecated
  // All interactions with it will revert in the fallback function
  function() external {
    revert("contract deprecated. Protocol migrated to V2");
  }
}