import os
from web3 import Web3
from node_manager.utils import NodeManager
from collections import OrderedDict


network = 'mocTestnet'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'config.json')
node_manager = NodeManager(path_to_config=config_path, network=network)
node_manager.connect_node()


print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=node_manager.is_connected))


path_build = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../build/contracts')
mocState_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocState'])
moc_state = node_manager.load_json_contract(os.path.join(path_build, "MoCState.json"), deploy_address=mocState_address)

info = OrderedDict()
description = OrderedDict()

# smoothing factor
info['getSmoothingFactor'] = Web3.fromWei(moc_state.functions.getSmoothingFactor().call(), 'ether')
print("Smoothing factor: {0}".format(info['getSmoothingFactor']))
description['getSmoothingFactor'] = 'Smooth factor'

# Ema calculation blockspan
info['getEmaCalculationBlockSpan'] = moc_state.functions.getEmaCalculationBlockSpan().call()
description['getEmaCalculationBlockSpan'] = 'Defines how many blocks should pass between EMA calculations'
print("Ema calculation blockspan: {0}".format(info['getEmaCalculationBlockSpan']))

# las ema calculation
info['getLastEmaCalculation'] = moc_state.functions.getLastEmaCalculation().call()
description['getLastEmaCalculation'] = 'EMA calculations'
print("Last ema calculation: {0}".format(info['getLastEmaCalculation']))

# getExponentalMovingAverage
info['getExponentalMovingAverage'] = Web3.fromWei(moc_state.functions.getExponentalMovingAverage().call(), 'ether')
description['getExponentalMovingAverage'] = 'Exponential Moving Average'
print("Exp moving average: {0}".format(info['getExponentalMovingAverage']))

# getReservePrecision
info['getReservePrecision'] = moc_state.functions.getReservePrecision().call()
description['getReservePrecision'] = 'Reserve Precision'
print("Reserve precision: {0}".format(info['getReservePrecision']))

# getMocPrecision
info['getMocPrecision'] = moc_state.functions.getMocPrecision().call()
description['getMocPrecision'] = 'MOC precision'
print("MOC precision: {0}".format(info['getMocPrecision']))

info['getDayPrecision'] = moc_state.functions.getDayPrecision().call()
description['getDayPrecision'] = 'DAY precision'
print("DAY precision: {0}".format(info['getDayPrecision']))

# governor adreess
info['getGovernorAddress'] = moc_state.functions.getGovernorAddress().call()
description['getGovernorAddress'] = 'Governor Address'
print("Governor Address: {0}".format(info['getGovernorAddress']))

# get Max Discount Rate
info['getMaxDiscountRate'] = Web3.fromWei(moc_state.functions.getMaxDiscountRate().call(), 'ether')
description['getMaxDiscountRate'] = 'Max Discount Rate'
print("Max Discount Rate: {0}".format(info['getMaxDiscountRate']))

# address of price provider
info['getPriceProvider'] = moc_state.functions.getPriceProvider().call()
description['getPriceProvider'] = 'address of price provider'
print("Adress Price Provider: {0}".format(info['getPriceProvider']))

# block span day
info['getDayBlockSpan'] = moc_state.functions.getDayBlockSpan().call()
description['getDayBlockSpan'] = 'Day block span'
print("Day block span: {0}".format(info['getDayBlockSpan']))

# All RiskPros in circulation
info['riskProTotalSupply'] = Web3.fromWei(moc_state.functions.riskProTotalSupply().call(), 'ether')
description['riskProTotalSupply'] = 'All RiskPros in circulation'
print("All RiskPros in circulation: {0}".format(info['riskProTotalSupply']))

# All stableTokens in circulation
info['stableTokenTotalSupply'] = Web3.fromWei(moc_state.functions.stableTokenTotalSupply().call(), 'ether')
description['stableTokenTotalSupply'] = 'All stableTokens in circulation'
print("All stableTokens in circulation: {0}".format(info['stableTokenTotalSupply']))

# Target coverage for complete system
info['cobj'] = Web3.fromWei(moc_state.functions.cobj().call(), 'ether')
description['cobj'] = 'Target coverage for complete system'
print("Target coverage for complete system (cobj): {0}".format(info['cobj']))

# Amount of ReserveTokens in the system excluding  RiskProx values and interests holdings
info['collateralReserves'] = Web3.fromWei(moc_state.functions.collateralReserves().call(), 'ether')
description['collateralReserves'] = 'Amount of ReserveTokens in the system excluding  RiskProx values and interests holdings'
print("Collateral Reserves: {0}".format(info['collateralReserves']))

# global coverage
info['globalCoverage'] = Web3.fromWei(moc_state.functions.globalCoverage().call(), 'ether')
description['globalCoverage'] = 'global coverage'
print("Global Coverage: {0}".format(info['globalCoverage']))

# Gets the ReserveTokens in the contract that not corresponds
info['getReservesRemainder'] = Web3.fromWei(moc_state.functions.getReservesRemainder().call(), 'ether')
description['getReservesRemainder'] = 'Gets the ReserveTokens in the contract that not corresponds'
print("Reserves remainder: {0}".format(info['getReservesRemainder']))

# Relation between stableTokens in bucket 0 and StableToken total supply
info['currentAbundanceRatio'] = Web3.fromWei(moc_state.functions.currentAbundanceRatio().call(), 'ether')
description['currentAbundanceRatio'] = 'Relation between stableTokens in bucket 0 and StableToken total supply'
print("Current Abundance Ratio: {0}".format(info['currentAbundanceRatio']))

# GLOBAL maxStableToken
info['globalMaxStableToken'] = Web3.fromWei(moc_state.functions.globalMaxStableToken().call(), 'ether')
description['globalMaxStableToken'] = 'GLOBAL maxStableToken'
print("Max Stable Token: {0}".format(info['globalMaxStableToken']))

# amount of stableTokens in bucket 0, that can be redeemed outside of settlement
info['freeStableToken'] = Web3.fromWei(moc_state.functions.freeStableToken().call(), 'ether')
description['freeStableToken'] = 'amount of stableTokens in bucket 0, that can be redeemed outside of settlement'
print("Free stable token: {0}".format(info['freeStableToken']))

# GLOBAL maxRiskPro
info['globalMaxRiskPro'] = Web3.fromWei(moc_state.functions.globalMaxRiskPro().call(), 'ether')
description['globalMaxRiskPro'] = 'GLOBAL maxRiskPro'
print("Global Max Risk Pro: {0}".format(info['globalMaxRiskPro']))

# ABSOLUTE maxStableToken
info['absoluteMaxStableToken'] = Web3.fromWei(moc_state.functions.absoluteMaxStableToken().call(), 'ether')
description['absoluteMaxStableToken'] = 'ABSOLUTE maxStableToken'
print("Absolute Max Stable Token: {0}".format(info['absoluteMaxStableToken']))

#  ABSOLUTE maxRiskPro
info['absoluteMaxRiskPro'] = Web3.fromWei(moc_state.functions.absoluteMaxRiskPro().call(), 'ether')
description['absoluteMaxRiskPro'] = 'ABSOLUTE maxRiskPro'
print("Absolute Max Risk Pro: {0}".format(info['absoluteMaxRiskPro']))

#  DISCOUNT maxRiskPro
info['maxRiskProWithDiscount'] = Web3.fromWei(moc_state.functions.maxRiskProWithDiscount().call(), 'ether')
description['maxRiskProWithDiscount'] = 'Discount Max Risk Pro'
print("Discount Max Risk Pro: {0}".format(info['maxRiskProWithDiscount']))

#  GLOBAL lockedReserveTokens
info['globalLockedReserveTokens'] = Web3.fromWei(moc_state.functions.globalLockedReserveTokens().call(), 'ether')
description['globalLockedReserveTokens'] = 'Global Locked Reserve Tokens'
print("Global Locked Reserve Tokens: {0}".format(info['globalLockedReserveTokens']))

#  ReserveTokens price of RiskPro
info['riskProTecPrice'] = Web3.fromWei(moc_state.functions.riskProTecPrice().call(), 'ether')
description['riskProTecPrice'] = 'Risk Pro Tec Price'
print("Risk Pro Tec Price: {0}".format(info['riskProTecPrice']))

# ReserveTokens price of RiskPro with spot discount applied
info['riskProDiscountPrice'] = Web3.fromWei(moc_state.functions.riskProDiscountPrice().call(), 'ether')
description['riskProDiscountPrice'] = 'ReserveTokens price of RiskPro with spot discount applied'
print("Risk Pro Discount Price: {0}".format(info['riskProDiscountPrice']))

# RiskPro USD PRICE
info['riskProUsdPrice'] = Web3.fromWei(moc_state.functions.riskProUsdPrice().call(), 'ether')
description['riskProUsdPrice'] = 'RiskPro USD PRICE'
print("Risk Pro Usd Price: {0}".format(info['riskProUsdPrice']))


# GLOBAL ReserveTokens Discount rate to apply to RiskProPrice.
info['riskProSpotDiscountRate'] = Web3.fromWei(moc_state.functions.riskProSpotDiscountRate().call(), 'ether')
description['riskProSpotDiscountRate'] = 'GLOBAL ReserveTokens Discount rate to apply to RiskProPrice.'
print("Risk Pro Spot Discount Rate: {0}".format(info['riskProSpotDiscountRate']))

# Days to settlement
info['daysToSettlement'] = moc_state.functions.daysToSettlement().call()
description['daysToSettlement'] = 'Days to settlement'
print("Days to settlement: {0}".format(info['daysToSettlement']))

# Blocks to settlement
info['blocksToSettlement'] = moc_state.functions.blocksToSettlement().call()
description['blocksToSettlement'] = 'Blocks to settlement'
print("Blocks to settlement: {0}".format(info['blocksToSettlement']))

# Is liquidation reached?
info['isLiquidationReached'] = moc_state.functions.isLiquidationReached().call()
description['isLiquidationReached'] = 'Is liquidation reached?'
print("Is liquidation reached?: {0}".format(info['isLiquidationReached']))

# Liquidation price
info['getLiquidationPrice'] = Web3.fromWei(moc_state.functions.getLiquidationPrice().call(), 'ether')
description['getLiquidationPrice'] = 'Liquidation price'
print("Liquidation Price: {0}".format(info['getLiquidationPrice']))

# Bcons
info['getBcons'] = Web3.fromWei(moc_state.functions.getBcons().call(), 'ether')
description['getBcons'] = 'Bcons'
print("Bcons: {0}".format(info['getBcons']))

# Reserve Token Price
info['getReserveTokenPrice'] = Web3.fromWei(moc_state.functions.getReserveTokenPrice().call(), 'ether')
description['getReserveTokenPrice'] = 'Reserve Token Price'
print("Reserve Token Price: {0}".format(info['getReserveTokenPrice']))

# Liq
info['getLiq'] = Web3.fromWei(moc_state.functions.getLiq().call(), 'ether')
description['getLiq'] = 'Liq'
print("Liq: {0}".format(info['getLiq']))

# Utpdu
info['getUtpdu'] = Web3.fromWei(moc_state.functions.getUtpdu().call(), 'ether')
description['getUtpdu'] = 'Utpdu'
print("Utpdu: {0}".format(info['getUtpdu']))

# getPeg
info['getPeg'] = moc_state.functions.getPeg().call()
description['getPeg'] = 'PEG'
print("PEG: {0}".format(info['getPeg']))

############
# BUCKETS
############
print("")
print("BUCKETS")
print("=======")
print()
print("BUCKET C0")
print("=========")

# BUCKET lockedReserveTokens
info['C0_lockedReserveTokens'] = Web3.fromWei(moc_state.functions.lockedReserveTokens(str.encode('C0')).call(), 'ether')
description['C0_lockedReserveTokens'] = 'Locked Reserve Tokens Bucket'
print("Locked Reserve Tokens Bucket: {0}".format(info['C0_lockedReserveTokens']))

# Gets ReserveTokens in RiskPro within specified bucket
info['C0_getResTokensInRiskPro'] = Web3.fromWei(moc_state.functions.getResTokensInRiskPro(str.encode('C0')).call(), 'ether')
description['C0_getResTokensInRiskPro'] = 'Gets ReserveTokens in RiskPro'
print("Gets ReserveTokens in RiskPro: {0}".format(info['C0_getResTokensInRiskPro']))

# BUCKET Coverage
info['C0_coverage'] = Web3.fromWei(moc_state.functions.coverage(str.encode('C0')).call(), 'ether')
description['C0_coverage'] = 'BUCKET Coverage'
print("Coverage: {0}".format(info['C0_coverage']))

# BUCKET Leverage
info['C0_leverage'] = Web3.fromWei(moc_state.functions.leverage(str.encode('C0')).call(), 'ether')
description['C0_leverage'] = 'BUCKET Leverage'
print("Leverage: {0}".format(info['C0_leverage']))

# BUCKET maxStableToken
info['C0_maxStableToken'] = Web3.fromWei(moc_state.functions.maxStableToken(str.encode('C0')).call(), 'ether')
description['C0_maxStableToken'] = 'BUCKET maxStableToken'
print("Max Stable Token: {0}".format(info['C0_maxStableToken']))

# BUCKET maxRiskPro to redeem / mint
info['C0_maxRiskPro'] = Web3.fromWei(moc_state.functions.maxRiskPro(str.encode('C0')).call(), 'ether')
description['C0_maxRiskPro'] = 'BUCKET maxRiskPro to redeem / mint'
print("Max Risk Pro: {0}".format(info['C0_maxRiskPro']))

# Bucket max riskProx to mint
info['C0_maxRiskProx'] = Web3.fromWei(moc_state.functions.maxRiskProx(str.encode('C0')).call(), 'ether')
description['C0_maxRiskProx'] = 'Bucket max riskProx to mint'
print("Max Risk ProX: {0}".format(info['C0_maxRiskProx']))

# Bucket max riskProx to mint
info['C0_maxRiskProxResTokenValue'] = Web3.fromWei(moc_state.functions.maxRiskProxResTokenValue(str.encode('C0')).call(), 'ether')
description['C0_maxRiskProxResTokenValue'] = 'Bucket max riskProx to mint'
print("Max Risk ProX Token Value: {0}".format(info['C0_maxRiskProxResTokenValue']))

# Bucket max riskProx to mint
info['C0_bucketRiskProTecPrice'] = Web3.fromWei(moc_state.functions.bucketRiskProTecPrice(str.encode('C0')).call(), 'ether')
description['C0_bucketRiskProTecPrice'] = 'Risk Pro Tec Price'
print("Risk Pro Tec Price: {0}".format(info['C0_bucketRiskProTecPrice']))

# GLOBAL max riskProx to mint
info['C0_maxRiskProxRiskProValue'] = Web3.fromWei(moc_state.functions.maxRiskProxRiskProValue(str.encode('C0')).call(), 'ether')
description['C0_maxRiskProxRiskProValue'] = 'Max Risk Prox RiskPro Value'
print("Max Risk Prox RiskPro Value: {0}".format(info['C0_maxRiskProxRiskProValue']))

# RiskProx price in RiskPro
info['C0_riskProxRiskProPrice'] = Web3.fromWei(moc_state.functions.riskProxRiskProPrice(str.encode('C0')).call(), 'ether')
description['C0_riskProxRiskProPrice'] = 'Risk Prox Risk Pro Price'
print("Risk Prox Risk Pro Price: {0}".format(info['C0_riskProxRiskProPrice']))

# getBucketNReserve
info['C0_getBucketNReserve'] = Web3.fromWei(moc_state.functions.getBucketNReserve(str.encode('C0')).call(), 'ether')
description['C0_getBucketNReserve'] = 'Bucket N Reserve'
print("Bucket N Reserve: {0}".format(info['C0_getBucketNReserve']))

# BucketNRiskPro
info['C0_getBucketNRiskPro'] = Web3.fromWei(moc_state.functions.getBucketNRiskPro(str.encode('C0')).call(), 'ether')
description['C0_getBucketNRiskPro'] = 'Bucket N RiskPro'
print("Bucket N RiskPro: {0}".format(info['C0_getBucketNRiskPro']))

# Bucket N StableToken
info['C0_getBucketNStableToken'] = Web3.fromWei(moc_state.functions.getBucketNStableToken(str.encode('C0')).call(), 'ether')
description['C0_getBucketNStableToken'] = 'Bucket N StableToken'
print("Bucket N StableToken: {0}".format(info['C0_getBucketNStableToken']))

# Bucket C Obj.
info['C0_getBucketCobj'] = Web3.fromWei(moc_state.functions.getBucketCobj(str.encode('C0')).call(), 'ether')
description['C0_getBucketCobj'] = 'Bucket C Obj'
print("Bucket C Obj.: {0}".format(info['C0_getBucketCobj']))

# Inrate Bag
info['C0_getInrateBag'] = Web3.fromWei(moc_state.functions.getInrateBag(str.encode('C0')).call(), 'ether')
description['C0_getInrateBag'] = 'Inrate Bag'
print("Inrate Bag: {0}".format(info['C0_getInrateBag']))

print("")
print("BUCKET X2")
print("=========")

# BUCKET lockedReserveTokens
info['X2_lockedReserveTokens'] = Web3.fromWei(moc_state.functions.lockedReserveTokens(str.encode('X2')).call(), 'ether')
description['X2_lockedReserveTokens'] = 'Locked Reserve Tokens Bucket'
print("Locked Reserve Tokens Bucket: {0}".format(info['X2_lockedReserveTokens']))

# Gets ReserveTokens in RiskPro within specified bucket
info['X2_getResTokensInRiskPro'] = Web3.fromWei(moc_state.functions.getResTokensInRiskPro(str.encode('X2')).call(), 'ether')
description['X2_getResTokensInRiskPro'] = 'Gets ReserveTokens in RiskPro within specified bucket'
print("Gets ReserveTokens in RiskPro: {0}".format(info['X2_getResTokensInRiskPro']))

# BUCKET Coverage
info['X2_coverage'] = Web3.fromWei(moc_state.functions.coverage(str.encode('X2')).call(), 'ether')
description['X2_coverage'] = 'BUCKET Coverage'
print("Coverage: {0}".format(info['X2_coverage']))

# BUCKET Leverage
info['X2_leverage'] = Web3.fromWei(moc_state.functions.leverage(str.encode('X2')).call(), 'ether')
description['X2_leverage'] = 'BUCKET Leverage'
print("Leverage: {0}".format(info['X2_leverage']))

# BUCKET maxStableToken
info['X2_maxStableToken'] = Web3.fromWei(moc_state.functions.maxStableToken(str.encode('X2')).call(), 'ether')
description['X2_maxStableToken'] = 'BUCKET maxStableToken'
print("Max Stable Token: {0}".format(info['X2_maxStableToken']))

# BUCKET maxRiskPro to redeem / mint
info['X2_maxRiskPro'] = Web3.fromWei(moc_state.functions.maxRiskPro(str.encode('X2')).call(), 'ether')
description['X2_maxRiskPro'] = 'BUCKET maxRiskPro to redeem / mint'
print("Max Risk Pro: {0}".format(info['X2_maxRiskPro']))

# Bucket max riskProx to mint
info['X2_maxRiskProx'] = Web3.fromWei(moc_state.functions.maxRiskProx(str.encode('X2')).call(), 'ether')
description['X2_maxRiskProx'] = 'Bucket max riskProx to mint'
print("Max Risk ProX: {0}".format(info['X2_maxRiskProx']))

# Bucket max riskProx to mint
info['X2_maxRiskProxResTokenValue'] = Web3.fromWei(moc_state.functions.maxRiskProxResTokenValue(str.encode('X2')).call(), 'ether')
description['X2_maxRiskProxResTokenValue'] = 'Bucket max riskProx to mint'
print("Max Risk ProX Token Value: {0}".format(info['X2_maxRiskProxResTokenValue']))

# Bucket max riskProx to mint
info['X2_bucketRiskProTecPrice'] = Web3.fromWei(moc_state.functions.bucketRiskProTecPrice(str.encode('X2')).call(), 'ether')
description['X2_bucketRiskProTecPrice'] = 'Risk Pro Tec Price'
print("Risk Pro Tec Price: {0}".format(info['X2_bucketRiskProTecPrice']))

# GLOBAL max riskProx to mint
info['X2_maxRiskProxRiskProValue'] = Web3.fromWei(moc_state.functions.maxRiskProxRiskProValue(str.encode('X2')).call(), 'ether')
description['X2_maxRiskProxRiskProValue'] = 'Max Risk Prox RiskPro Value'
print("Max Risk Prox RiskPro Value: {0}".format(info['X2_maxRiskProxRiskProValue']))

# RiskProx price in RiskPro
info['X2_riskProxRiskProPrice'] = Web3.fromWei(moc_state.functions.riskProxRiskProPrice(str.encode('X2')).call(), 'ether')
description['X2_riskProxRiskProPrice'] = 'RiskProx price in RiskPro'
print("Risk Prox Risk Pro Price: {0}".format(info['X2_riskProxRiskProPrice']))

# getBucketNReserve
info['X2_getBucketNReserve'] = Web3.fromWei(moc_state.functions.getBucketNReserve(str.encode('X2')).call(), 'ether')
description['X2_getBucketNReserve'] = 'Bucket N Reserve'
print("Bucket N Reserve: {0}".format(info['X2_getBucketNReserve']))

# BucketNRiskPro
info['X2_getBucketNRiskPro'] = Web3.fromWei(moc_state.functions.getBucketNRiskPro(str.encode('X2')).call(), 'ether')
description['X2_getBucketNRiskPro'] = 'Bucket N RiskPro'
print("Bucket N RiskPro: {0}".format(info['X2_getBucketNRiskPro']))

# Bucket N StableToken
info['X2_getBucketNStableToken'] = Web3.fromWei(moc_state.functions.getBucketNStableToken(str.encode('X2')).call(), 'ether')
description['X2_getBucketNStableToken'] = 'Bucket N StableToken'
print("Bucket N StableToken: {0}".format(info['X2_getBucketNStableToken']))

# Bucket C Obj.
info['X2_getBucketCobj'] = Web3.fromWei(moc_state.functions.getBucketCobj(str.encode('X2')).call(), 'ether')
description['X2_getBucketCobj'] = 'Bucket C Obj'
print("Bucket C Obj.: {0}".format(info['X2_getBucketCobj']))

# Inrate Bag
info['X2_getInrateBag'] = Web3.fromWei(moc_state.functions.getInrateBag(str.encode('X2')).call(), 'ether')
description['X2_getInrateBag'] = 'Inrate Bag'
print("Inrate Bag: {0}".format(info['X2_getInrateBag']))


print("#### States")

md_header = '''
| Nº  | Function                         | Value         | Description                    |
| :---:  | :---------------------------- | -----------   | ------------------------------ |
'''

count = 0
md_lines = list()
for d_key in info:
    count += 1
    line = '| {0} | {1}  | {2}  | {3} |'.format(count, d_key, info[d_key], description[d_key])
    md_lines.append(line)

print(md_header)
print('\n'.join(md_lines))
