pragma solidity ^0.5.8;

import "openzeppelin-eth/contracts/ownership/Ownable.sol";
import "moc-governance/contracts/Stopper/Stoppable.sol";

/**
  @title Stopper
  @notice The contract in charge of handling the stoppability and maximum gas Price limit 
    of the contract that define this contract as its stopper.
  @dev both pausing or setting a really low maxGasPrice has the same effect on the protocol,
    is prevents anyone from using it. And it also requires the same level of reactivity, 
    as a sudden network gasPrice spike, would require immediate maxGasPrice adjustment to compensate, 
    as it would a pause. Stopper, holds owner account responsible for both this two features.
 */
contract StopperV2 is Ownable {

  /**
    @notice Pause activeContract if it is stoppable
    @param activeContract Contract to be paused
   */
  function pause(Stoppable activeContract) external onlyOwner {
    activeContract.pause();
  }

  /**
    @notice Unpause pausedContract if it is stoppable
    @param pausedContract Contract to be unpaused
   */
  function unpause(Stoppable pausedContract) external onlyOwner {
    pausedContract.unpause();
  }

  /**
    @notice set new gas price limit to target contract
    @param gasPriceLimitedContract Contract to be updated with new gas price limit
    @param maxGasPrice_ new gas price limit
   */
  function setMaxGasPrice(GasPriceLimited gasPriceLimitedContract, uint256 maxGasPrice_) external onlyOwner {
    gasPriceLimitedContract.setMaxGasPrice(maxGasPrice_);
  }

  /**
   * @notice update the max absolute operation allowed
   * @param fluxControlledContract Contract to be updated with new max absolute operation allowed
   * @param maxAbsoluteOperation_ new max absolute operation allowed
   */
  function setMaxAbsoluteOperation(FluxControlled fluxControlledContract, uint256 maxAbsoluteOperation_) external onlyOwner {
    fluxControlledContract.setMaxAbsoluteOperation(maxAbsoluteOperation_);
  }

  /**
   * @notice update the max operational difference allowed
   * @param fluxControlledContract Contract to be updated with new max operational difference allowed
   * @param maxOperationalDifference_ new max operational difference allowed
   */
  function setMaxOperationalDifference(FluxControlled fluxControlledContract, uint256 maxOperationalDifference_) external onlyOwner {
   fluxControlledContract.setMaxOperationalDifference(maxOperationalDifference_);
  }

  /**
   * @notice update the decay block span
   * @param fluxControlledContract Contract to be updated with new decay block span
   * @param decayBlockSpan_ new decay block span
   */
  function setDecayBlockSpan(FluxControlled fluxControlledContract, uint256 decayBlockSpan_) external onlyOwner {
    fluxControlledContract.setDecayBlockSpan(decayBlockSpan_);
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}

interface GasPriceLimited {
  /**
   * @notice set new gas price limit
   * @param maxGasPrice_ new gas price limit
   */
  function setMaxGasPrice(uint256 maxGasPrice_) external;
}

interface FluxControlled {
  function setMaxAbsoluteOperation(uint256 maxAbsoluteOperation_) external;

  function setMaxOperationalDifference(uint256 maxOperationalDifference_) external;

  function setDecayBlockSpan(uint256 decayBlockSpan_) external;
}