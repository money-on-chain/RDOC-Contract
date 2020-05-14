"""

Title: Upgrade Moc Settlement v019
Project: MoC and RRC20
Networks: mocTestnet, mocTestnetAlpha, mocMainnet, rdocTestnet, rdocMainnet

This is script upgrade MoC Settlement Fix task pointer

"""


import os
from web3 import Web3
from moneyonchain.manager import ConnectionManager

network = 'rdocMainnet'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'config.json')

connection_manager = ConnectionManager(options=config_path, network=network)

print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=connection_manager.is_connected))

path_build = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../build/contracts')

moc_settlement_address = Web3.toChecksumAddress(
    connection_manager.options['networks'][network]['addresses']['MoCSettlement'])

print("Calling Settlement fixTasksPointer ...")
moc_settlement = connection_manager.load_json_contract(
    os.path.join(path_build, "MoCSettlement_v019.json"),
    deploy_address=moc_settlement_address)
tx_hash = connection_manager.fnx_transaction(moc_settlement, 'fixTasksPointer')
tx_receipt = connection_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)
print("Fix done!")


"""
Connecting to rdocTestnet...
Connected: True
Calling Settlement fixTasksPointer ...
AttributeDict({'transactionHash': HexBytes('0xb6669faebdec56582870134a138b4adade0147500a623129fff0e3193dc135c5'), 'transactionIndex': 7, 'blockHash': HexBytes('0x97680bb130540cff701f1fdb626283d704e5864bbcba3782a8355cf5596a8c4c'), 'blockNumber': 848554, 'cumulativeGasUsed': 365178, 'gasUsed': 72952, 'contractAddress': None, 'logs': [], 'from': '0xa8F94d08d3d9C045fE0b86a953DF39b14206153c', 'to': '0x163D79dB568417983Aa2D64AA6310Bed0f23Ab61', 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Fix done!

Connecting to rdocMainnet...
Connected: True
Calling Settlement fixTasksPointer ...
AttributeDict({'transactionHash': HexBytes('0x2f72acc9b71f70a3a79a54ed3cbeff573875e4f8db022a66e1ecabb95afcd3c4'), 'transactionIndex': 0, 'blockHash': HexBytes('0x3500f3b644320f5fc4ccf79fcc334cca3fbfcbfc57d7bf95ec68b387be08e967'), 'blockNumber': 2353737, 'cumulativeGasUsed': 72952, 'gasUsed': 72952, 'contractAddress': None, 'logs': [], 'from': '0x27a3074Db95Ec5f6a0E73DC41a4859F48990e841', 'to': '0xb8a6beBa78c3E73f6A66DDacFaEB240ae22Ca709', 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Fix done!
"""