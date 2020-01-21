pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./base/MoCBase.sol";
import "moc-governance/contracts/Governance/Governed.sol";
import "moc-governance/contracts/Governance/IGovernor.sol";

contract MoCBucketContainer is MoCBase, Governed{
  using SafeMath for uint256;
  using Math for uint256;

  struct RiskProxBalance {
    uint256 value;
    uint index; // Index start in 1, zero is reserved for NULL
  }

  struct MoCBucket {
    bytes32 name;
    bool isBase;
    uint256 nStable;
    uint256 nRiskPro;
    uint256 nReserve;
    uint256 cobj;
    // Should only be used in X buckets
    mapping(address => RiskProxBalance) riskProxBalances;
    address payable[] activeBalances;
    uint256 activeBalancesLength;
    // Should only be used in Base buckets (C0)
    uint256 inrateBag;
    bool available;
  }

  event BucketMovement(
    bytes32 from,
    bytes32 to,
    uint256 reserves,
    uint256 stableTokens
  );

  event BucketCreation(
    bytes32 name,
    uint256 cobj
  );

  event BucketStateUpdate(
    bytes32 name,
    uint256 nReserve,
    uint256 nStable,
    uint256 nRiskProx,
    uint256 inrateBag
  );

  mapping(bytes32 => MoCBucket) internal mocBuckets;

   /**
   GETTERS
   */
  function getBucketNReserve(bytes32 bucket) public view returns(uint256) {
    return mocBuckets[bucket].nReserve;
  }

  function getBucketNRiskPro(bytes32 bucket) public view returns(uint256) {
    return mocBuckets[bucket].nRiskPro;
  }

  function getBucketNStableToken(bytes32 bucket) public view returns(uint256) {
    return mocBuckets[bucket].nStable;
  }

  function getBucketCobj(bytes32 bucket) public view returns(uint256) {
    return mocBuckets[bucket].cobj;
  }

  function getInrateBag(bytes32 bucket) public view returns(uint256) {
    return mocBuckets[bucket].inrateBag;
  }

  /**
   * @dev Sets the objective coverage (cobj) on an specficied bucket.
   * @param  _bucket - name of the bucket
   * @param  _cobj - new value of cobj
   */
  function setBucketCobj(bytes32 _bucket, uint256 _cobj) public onlyAuthorizedChanger(){
    //TODO: It is necessary to analyze the impact in the model it has when changing X2. This
    mocBuckets[_bucket].cobj = _cobj;
  }

  /**
    @dev returns true if the bucket is a base bucket
    @param bucket Name of the bucket
  **/
  function isBucketBase(bytes32 bucket) public view returns(bool){
    return mocBuckets[bucket].isBase;
  }

  /**
    @dev returns true if the bucket have stableTokens in it
    @param bucket Name of the bucket
  **/
  function isBucketEmpty(bytes32 bucket) public view returns(bool) {
    return mocBuckets[bucket].nStable == 0;
  }

  /**
    @dev Returns all the address that currently have riskProx position for this bucket
    @param bucket bucket of the active address
  */
  function getActiveAddresses(bytes32 bucket) public view returns(address payable[] memory) {
    return mocBuckets[bucket].activeBalances;
  }

  /**
    @dev Returns all the address that currently have riskProx position for this bucket
    @param bucket bucket of the active address
  */
  function getActiveAddressesCount(bytes32 bucket) public view returns(uint256 count) {
    return mocBuckets[bucket].activeBalancesLength;
  }

  /**
    @dev Add values to all variables of the bucket
    @param bucketName Name of the bucket
    @param reserveTokens ReserveToken amount [using reservePrecision]
    @param stableToken StableToken amount [using mocPrecision]
    @param riskProx RiskProx amount [using mocPrecision]
  **/
  function addValuesToBucket(bytes32 bucketName, uint256 reserveTokens, uint256 stableToken, uint256 riskProx)
  public onlyWhitelisted(msg.sender) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    bucket.nReserve = bucket.nReserve.add(reserveTokens);
    bucket.nStable = bucket.nStable.add(stableToken);
    bucket.nRiskPro = bucket.nRiskPro.add(riskProx);
  }

  /**
    @dev Substract values to all variables of the bucket
    @param bucketName Name of the bucket
    @param reserve ReserveToken amount [using reservePrecision]
    @param stableToken StableToken amount [using mocPrecision]
    @param riskProx RiskProx amount [using mocPrecision]
  **/
  function substractValuesFromBucket(bytes32 bucketName, uint256 reserve, uint256 stableToken, uint256 riskProx)
  public onlyWhitelisted(msg.sender)  {
    MoCBucket storage bucket = mocBuckets[bucketName];

    bucket.nReserve = bucket.nReserve.sub(reserve);
    bucket.nStable = bucket.nStable.sub(stableToken);
    bucket.nRiskPro = bucket.nRiskPro.sub(riskProx);
  }

  /**
    @dev Moves ReserveTokens from inrateBag to main ReserveTokens bucket bag
    @param bucketName Name of the bucket to operate
    @param amount value to move from inrateBag to main bag [using reservePrecision]
   */
  function deliverInrate(bytes32 bucketName, uint256 amount) public
   onlyWhitelisted(msg.sender) onlyBaseBucket(bucketName) bucketStateUpdate(bucketName) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    uint256 toMove = Math.min(bucket.inrateBag, amount);

    bucket.inrateBag = bucket.inrateBag.sub(toMove);
    bucket.nReserve = bucket.nReserve.add(toMove);
  }

  /**
    @dev Removes Interests rate from Inrate bag
    @param bucketName Name of the bucket to operate
    @param amount value to move from inrateBag to main bag [using reservePrecision]
    @return Retrieved value
   */
  function recoverInrate(bytes32 bucketName, uint256 amount) public
  onlyWhitelisted(msg.sender) onlyBaseBucket(bucketName) bucketStateUpdate(bucketName) returns(uint256) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    uint256 toRetrieve = Math.min(bucket.inrateBag, amount);

    bucket.inrateBag = bucket.inrateBag.sub(toRetrieve);

    return toRetrieve;
  }

  /**
    @dev Moves ReserveTokens from origin bucket to destination bucket inrateBag
    @param bucketName name of the bucket to from which takes
    @param reserveAmount value to add to main bag [using reservePrecision]
  */
  function payInrate(bytes32 bucketName, uint256 reserveAmount) public
  onlyWhitelisted(msg.sender) onlyBaseBucket(bucketName) {
    MoCBucket storage bucket = mocBuckets[bucketName];
    bucket.inrateBag = bucket.inrateBag.add(reserveAmount);
  }

  /**
    @dev Move ReserveTokens and StableTokens from one bucket to another
    @param from Name of bucket from where the ReserveTokens will be removed
    @param to Name of bucket from where the ReserveTokens will be added
    @param reserve ReserveTokens amount [using reservePrecision]
    @param stableTokens StableTokens amount [using mocPrecision]
  **/
  function moveResTokensAndStableTokens(bytes32 from, bytes32 to, uint256 reserve, uint256 stableTokens) public
  onlyWhitelisted(msg.sender) bucketStateUpdate(from) bucketStateUpdate(to) {
    MoCBucket storage bucketFrom = mocBuckets[from];
    MoCBucket storage bucketTo = mocBuckets[to];

    bucketFrom.nReserve = bucketFrom.nReserve.sub(reserve);
    bucketTo.nReserve = bucketTo.nReserve.add(reserve);

    bucketFrom.nStable = bucketFrom.nStable.sub(stableTokens);
    bucketTo.nStable = bucketTo.nStable.add(stableTokens);

    emit BucketMovement(from, to, reserve, stableTokens);
  }

  /**
    @dev Clears completely the origin bucket, removing all StableTokens, ReserveTokens and riskProxs
    @param toLiquidate Bucket to be cleared out
    @param destination Bucket that will receive the StableTokens and ReserveTokens
   */
  function liquidateBucket(bytes32 toLiquidate, bytes32 destination) public onlyWhitelisted(msg.sender) {
    require(!isBucketBase(toLiquidate), "Cannot liquidate a base bucket");

    clearBucketBalances(toLiquidate);
    emptyBucket(toLiquidate, destination);
  }

  /**
    @dev Clears StableTokens and ReserveTokens from bucket origin and sends them to destination bucket
    @param origin Bucket to clear out
    @param destination Destination bucket
  **/
  function emptyBucket(bytes32 origin, bytes32 destination) public onlyWhitelisted(msg.sender) {
    moveResTokensAndStableTokens(origin, destination, mocBuckets[origin].nReserve, mocBuckets[origin].nStable);
  }

  /**
   * @dev checks if a bucket exists
   * @param bucket name of the bucket
   */
  function isAvailableBucket(bytes32 bucket) public view returns(bool) {
    return mocBuckets[bucket].available;
  }

  /**
    @dev Put all bucket RiskProx balances in zero
    @param bucketName Bucket to clear out
   */
  function clearBucketBalances(bytes32 bucketName) public onlyWhitelisted(msg.sender) {
    MoCBucket storage bucket = mocBuckets[bucketName];
    bucket.nRiskPro = 0;
    bucket.activeBalancesLength = 0;
  }

  /**
    @dev Creates bucket
    @param name Name of the bucket
    @param cobj Target Coverage of the bucket
  **/
  function createBucket(bytes32 name, uint256 cobj, bool isBase) internal {
    mocBuckets[name].name = name;
    mocBuckets[name].nStable = 0;
    mocBuckets[name].nRiskPro = 0;
    mocBuckets[name].nReserve = 0;
    mocBuckets[name].cobj = cobj;
    mocBuckets[name].isBase = isBase;
    mocBuckets[name].available = true;
    emit BucketCreation(name, cobj);
  }

  modifier onlyBaseBucket(bytes32 bucket) {
    require(isBucketBase(bucket), "Bucket should be a base type bucket");
    _;
  }

  modifier bucketStateUpdate(bytes32 bucket) {
    _;
    emit BucketStateUpdate(
      bucket,
      mocBuckets[bucket].nReserve,
      mocBuckets[bucket].nStable,
      mocBuckets[bucket].nRiskPro,
      mocBuckets[bucket].inrateBag
      );
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}
