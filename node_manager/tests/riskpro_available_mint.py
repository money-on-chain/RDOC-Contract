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
mocState_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocState'])
moc_state = node_manager.load_json_contract(os.path.join(path_build, "MoCState.json"), deploy_address=mocState_address)


# getMaxMintRiskPro
getMaxMintRiskPro = Web3.fromWei(moc_state.functions.getMaxMintRiskPro().call(), 'ether')
print("getMaxMintRiskPro: {0}".format(getMaxMintRiskPro))

# maxMintRiskProAvalaible
maxMintRiskProAvalaible = Web3.fromWei(moc_state.functions.maxMintRiskProAvalaible().call(), 'ether')
print("maxMintRiskProAvalaible: {0}".format(maxMintRiskProAvalaible))

