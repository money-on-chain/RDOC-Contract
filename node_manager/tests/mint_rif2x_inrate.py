import os
from web3 import Web3
from node_manager.utils import NodeManager


network = 'mocTestnet'
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

result = moc_inrate.functions.getRiskProxTmax().call()
print("max: {0}".format(Web3.fromWei(result, 'ether')))

result = moc_inrate.functions.getRiskProxPower().call()
print("power: {0}".format(result))

result = moc_inrate.functions.getRiskProxTmin().call()
print("min: {0}".format(result))
print("Settlement: 30")

#interest_v = moc_inrate.functions.calcMintInterestValues(str.encode('X2'), 1 * 10 ** 18).call()
#print("Interest: {0}".format(interest_v))


print("Calculation on buying 1.0 RIF2X")

interest_v = moc_inrate.functions.riskProxInrateAvg(str.encode('X2'), 1 * 10 ** 18, True).call()
interest_no_days = Web3.fromWei(interest_v, 'ether')
#print("riskProxInrateAvg: {0}".format(Web3.fromWei(interest_v, 'ether')))

for day_to_sett in reversed(range(0, 30)):
    print("Days to settlement: {0} Interest: {1}".format(day_to_sett, interest_no_days * day_to_sett))


#interest_v = moc_inrate.functions.inrateToSettlement(interest_v, True).call()
#print("inrateToSettlement: {0}".format(Web3.fromWei(interest_v, 'ether')))



