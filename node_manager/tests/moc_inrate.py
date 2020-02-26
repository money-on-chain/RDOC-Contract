import os
from web3 import Web3
from node_manager.utils import NodeManager
from collections import OrderedDict


network = 'mocMainnet'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'config.json')
node_manager = NodeManager(path_to_config=config_path, network=network)
node_manager.connect_node()


print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=node_manager.is_connected))


path_build = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../build/contracts')
moc_inrate_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocInrate'])
moc_inrate = node_manager.load_json_contract(os.path.join(path_build, "MoCInrate.json"),
                                             deploy_address=moc_inrate_address)

info = OrderedDict()
description = OrderedDict()

# INRATE
info_inrate = OrderedDict()

print("")
print("INRATES")
print("========")

# BTCX Params
info_inrate['getRiskProxTmin'] = Web3.fromWei(moc_inrate.functions.getRiskProxTmin().call(), 'ether')
description['getRiskProxTmin'] = 'BtcxTmin (inrateTPl: (BtcxTmax, BtcxPower, BtcxTmin ))'

info_inrate['getRiskProxTmax'] = Web3.fromWei(moc_inrate.functions.getRiskProxTmax().call(), 'ether')
description['getRiskProxTmax'] = 'BtcxTmax (inrateTPl: (BtcxTmax, BtcxPower, BtcxTmin ))'

info_inrate['getRiskProxPower'] = moc_inrate.functions.getRiskProxPower().call()
description['getRiskProxPower'] = 'BtcxPower (inrateTPl: (BtcxTmax, BtcxPower, BtcxTmin ))'

print("inrateTPl: ({getRiskProxTmax}, {getRiskProxPower}, {getRiskProxTmin} )".format(
    getRiskProxTmax=info_inrate['getRiskProxTmax'],
    getRiskProxPower=info_inrate['getRiskProxPower'],
    getRiskProxTmin=info_inrate['getRiskProxTmin']
))

# getRiskProInterestBlockSpan
info_inrate['getRiskProInterestBlockSpan'] = moc_inrate.functions.getRiskProInterestBlockSpan().call()
description['getRiskProInterestBlockSpan'] = 'RiskPro Interest BlockSpan'
print("RiskPro Interest BlockSpan: {0}".format(info_inrate['getRiskProInterestBlockSpan']))

# Risk ProRate
info_inrate['getRiskProRate'] = Web3.fromWei(moc_inrate.functions.getRiskProRate().call(), 'ether')
description['getRiskProRate'] = 'RiskPro Rate'
print("Risk ProRate: {0}".format(info_inrate['getRiskProRate']))

# Risk ProRate
info_inrate['getCommissionRate'] = Web3.fromWei(moc_inrate.functions.getCommissionRate().call(), 'ether')
description['getCommissionRate'] = 'Commission Rate'
print("Commission Rate: {0}".format(info_inrate['getCommissionRate']))

# RiskPro Interest Address
info_inrate['getRiskProInterestAddress'] = moc_inrate.functions.getRiskProInterestAddress().call()
description['getRiskProInterestAddress'] = 'RiskPro Interest Address'
print("RiskPro Interest Address: {0}".format(info_inrate['getRiskProInterestAddress']))

# Spot Inrate
info_inrate['spotInrate'] = Web3.fromWei(moc_inrate.functions.spotInrate().call(), 'ether')
description['spotInrate'] = 'Spot Inrate'
print("Spot Inrate: {0}".format(info_inrate['spotInrate']))

# Spot Inrate
info_inrate['dailyInrate'] = Web3.fromWei(moc_inrate.functions.dailyInrate().call(), 'ether')
description['dailyInrate'] = 'Daily Inrate'
print("Daily Inrate: {0}".format(info_inrate['dailyInrate']))

# Is Daily Enabled?
info_inrate['isDailyEnabled'] = moc_inrate.functions.isDailyEnabled().call()
description['isDailyEnabled'] = 'Is Daily Enabled'
print("Is Daily Enabled: {0}".format(info_inrate['isDailyEnabled']))

# Is RiskPro Interest Enabled?
info_inrate['isRiskProInterestEnabled'] = moc_inrate.functions.isRiskProInterestEnabled().call()
description['isRiskProInterestEnabled'] = 'Is RiskPro Interest Enabled?'
print("Is RiskPro Interest Enabled: {0}".format(info_inrate['isRiskProInterestEnabled']))

# Calculate RiskPro Holders Interest
calculate_riskproholder_rates = moc_inrate.functions.calculateRiskProHoldersInterest().call()

info_inrate['calculateRiskProHoldersInterest_0'] = Web3.fromWei(calculate_riskproholder_rates[0], 'ether')
description['calculateRiskProHoldersInterest_0'] = 'Calculates RiskPro Holders interest rates toPay interest in RBTC'

info_inrate['calculateRiskProHoldersInterest_1'] = Web3.fromWei(calculate_riskproholder_rates[1], 'ether')
description['calculateRiskProHoldersInterest_1'] = 'Calculates RiskPro Holders interest rates. bucketBtnc0 RTBC on ' \
                                                  'bucket0 used to calculate de interest'

md_header = '''
| Nº  | Function                         | Value         | Description                    |
| :---:  | :---------------------------- | -----------   | ------------------------------ |
'''

count = 0
md_lines = list()
for d_key in info_inrate:
    count += 1
    line = '| {0} | {1}  | {2}  | {3} |'.format(count, d_key, info_inrate[d_key], description[d_key])
    md_lines.append(line)

print(md_header)
print('\n'.join(md_lines))




