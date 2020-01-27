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
moc_inrate_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocInrate'])
moc_inrate = node_manager.load_json_contract(os.path.join(path_build, "MoCInrate.json"),
                                             deploy_address=moc_inrate_address)


getStableTmax = Web3.fromWei(moc_inrate.functions.getStableTmax().call(), 'ether')
getStablePower = moc_inrate.functions.getStablePower().call()
getStableTmin = Web3.fromWei(moc_inrate.functions.getStableTmin().call(), 'ether')
print("Inrate Stable Reedeem : ({getStableTmax}, {getStablePower}, {getStableTmin} )".format(
    getStableTmax=getStableTmax,
    getStablePower=getStablePower,
    getStableTmin=getStableTmin))
print("Reference: (Tmax, Power, Tmin)")


