import os
from web3 import Web3
from node_manager.utils import NodeManager


network = 'development'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'config.json')
node_manager = NodeManager(path_to_config=config_path, network=network)
node_manager.connect_node()


print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=node_manager.is_connected))


path_build = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../build/contracts')
moc_moc_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['moc'])
reserve_token_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['reserveToken'])


moc_moc = node_manager.load_json_contract(os.path.join(path_build, "MoC.json"),
                                          deploy_address=moc_moc_address)
reserve_token = node_manager.load_json_contract(os.path.join(path_build, "ReserveToken.json"),
                                                deploy_address=reserve_token_address)
moc_inrate_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocInrate'])
moc_inrate = node_manager.load_json_contract(os.path.join(path_build, "MoCInrate.json"),
                                             deploy_address=moc_inrate_address)
moc_state_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocState'])
moc_state = node_manager.load_json_contract(os.path.join(path_build, "MoCState.json"),
                                            deploy_address=moc_state_address)

print("Reserve token balance:")
from_address = Web3.toChecksumAddress("0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3")

balance = reserve_token.functions.balanceOf(from_address).call()
print("Account: {0} Reserve Balance: {1}".format(from_address, Web3.fromWei(balance, 'ether')))

balance = moc_moc.functions.getAllowance(from_address).call()
print("Account: {0} Spendable Balance: {1}".format(from_address, Web3.fromWei(balance, 'ether')))

reserve_t = moc_moc.functions.reserveToken().call()
print("Reserve: {0}".format(reserve_t))

result = moc_state.functions.currentAbundanceRatio().call()
print("Abundance 0: {0}".format(result))

result = moc_inrate.functions.spotInrate().call()
print("spotInrate: {0}".format(result))

result = moc_inrate.functions.getRiskProxTmax().call()
print("getRiskProxTmax: {0} inrateTPl: (BtcxTmax, BtcxPower, BtcxTmin )".format(result))

result = moc_inrate.functions.getRiskProxPower().call()
print("getRiskProxPower: {0} inrateTPl: (BtcxTmax, BtcxPower, BtcxTmin )".format(result))

result = moc_inrate.functions.getRiskProxTmin().call()
print("getRiskProxTmin: {0} inrateTPl: (BtcxTmax, BtcxPower, BtcxTmin )".format(result))

result = moc_inrate.functions.getStableTmax().call()
print("getStableTmax: {0} inrateTPl: (BtcxTmax, BtcxPower, BtcxTmin )".format(result))

result = moc_inrate.functions.getStablePower().call()
print("getStablePower: {0} inrateTPl: (BtcxTmax, BtcxPower, BtcxTmin )".format(result))

result = moc_inrate.functions.getStableTmin().call()
print("getStableTmin: {0} inrateTPl: (BtcxTmax, BtcxPower, BtcxTmin )".format(result))


#result = moc_state.functions.abundanceRatio(1000000000000000000).call()
#print("Abundance 1: {0}".format(result))

# interest_v = moc_inrate.functions.riskProxInrateAvg(str.encode('X2'), 1000000000000000000, False).call()
# print("Interest AVG: {0}".format(interest_v))
#
interest_v = moc_inrate.functions.calcMintInterestValues(str.encode('X2'), 1000000000000000000).call()
print("Interest: {0}".format(interest_v))

result = moc_inrate.functions.stableTokenInrateAvg(0).call()
print("stableTokenInrateAvg: {0}".format(result))

#mocPrecision = moc_moc.functions.getMocPrecision().call()
#claim_value = 1000

# tx_hash = node_manager.fnx_transaction(reserve_token, 'claim', int(claim_value * mocPrecision))
# tx_receipt = node_manager.wait_transaction_receipt(tx_hash)
# print(tx_receipt)
#
#
# print("Reserve token balance:")
# from_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['accounts'][0]['address'])
# balance = reserve_token.functions.balanceOf(from_address).call()
# print("Account: {0} Balance: {1}".format(from_address, Web3.fromWei(balance, 'ether')))