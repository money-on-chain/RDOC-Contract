import os
from web3 import Web3
from node_manager.utils import NodeManager


network = 'development'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'config.json')
node_manager = NodeManager(path_to_config=config_path, network=network)
node_manager.connect_node()
print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=node_manager.is_connected))
print("Gas price: {gas_price}".format(gas_price=node_manager.gas_price))


"""
curl http://localhost:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
"""