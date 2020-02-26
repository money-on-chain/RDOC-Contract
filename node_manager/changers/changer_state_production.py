import os
from web3 import Web3
from node_manager.utils import NodeManager
import pprint

pp = pprint.PrettyPrinter(indent=4)

network = 'mocMainnet'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'config.json')
node_manager = NodeManager(path_to_config=config_path, network=network)
node_manager.connect_node()


print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=node_manager.is_connected))

path_build = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../build/contracts')
mocState_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocState'])
moc_state = node_manager.load_json_contract(os.path.join(path_build, "MoCState.json"),
                                            deploy_address=mocState_address)
oracle_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['oracle'])
governor_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['governor'])

init_settings = dict()
init_settings['peg'] = 1
init_settings['liq'] = int(1.04 * 10 ** 18)
init_settings['utpdu'] = int(2 * 10 ** 18)
init_settings['maxDiscRate'] = int(0.0 * 10 ** 18)
init_settings['dayBlockSpan'] = 2880
init_settings['initialEma'] = int(0.089 * 10 ** 18)
init_settings['smoothFactor'] = int(0.011049724 * 10 ** 18)
init_settings['emaBlockSpan'] = init_settings['dayBlockSpan']
init_settings['maxMintRiskPro'] = int(12000000 * 10 ** 18)


print("Going to change to this settings:")
pp.pprint(init_settings)
print("Wait...")


path_to_json = os.path.join(path_build, "MocStateChanger.json")
sc, json_content = node_manager.sc_from_json_bytecode(path_to_json)
tx_hash = node_manager.fnx_constructor(sc,
                                       moc_state.address,
                                       oracle_address,
                                       init_settings['peg'],
                                       init_settings['utpdu'],
                                       init_settings['maxDiscRate'],
                                       init_settings['dayBlockSpan'],
                                       init_settings['liq'],
                                       init_settings['smoothFactor'],
                                       init_settings['emaBlockSpan'],
                                       init_settings['maxMintRiskPro']
                                       )
tx_receipt = node_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)

contract_address = tx_receipt.contractAddress

print("Changer Contract Address: {address}".format(address=contract_address))

# moc_governor = node_manager.load_json_contract(os.path.join(path_build, "Governor.json"),
#                                                deploy_address=governor_address)
#
# print("Saving changes to governor...")
# tx_hash = node_manager.fnx_transaction(moc_governor, 'executeChange', contract_address)
# tx_receipt = node_manager.wait_transaction_receipt(tx_hash)
# print(tx_receipt)
#
# print("Governor changes done!")


"""
Connecting to mocTestnet...
Connected: True
Going to change to this settings:
{   'dayBlockSpan': 2880,
    'emaBlockSpan': 2880,
    'initialEma': 89000000000000000,
    'liq': 1040000000000000000,
    'maxDiscRate': 0,
    'maxMintRiskPro': 12000000000000000000000000,
    'peg': 1,
    'smoothFactor': 11049724000000000,
    'utpdu': 2000000000000000000}
Wait...
AttributeDict({'transactionHash': HexBytes('0x69f2b7688bdb07c50346f2af635f64179055f2a23a5c2214bcd519719ee7ec27'), 'transactionIndex': 0, 'blockHash': HexBytes('0x92a5ef09fd65cc7e446c3cbef32642443fa01e0c7f135d2c2bbbd383f9095b5a'), 'blockNumber': 625156, 'cumulativeGasUsed': 1116538, 'gasUsed': 1116538, 'contractAddress': '0xac25ECb2a67CB85e3890Ed05Dedf8972541FBBcB', 'logs': [AttributeDict({'logIndex': 0, 'blockNumber': 625156, 'blockHash': HexBytes('0x92a5ef09fd65cc7e446c3cbef32642443fa01e0c7f135d2c2bbbd383f9095b5a'), 'transactionHash': HexBytes('0x69f2b7688bdb07c50346f2af635f64179055f2a23a5c2214bcd519719ee7ec27'), 'transactionIndex': 0, 'address': '0xac25ECb2a67CB85e3890Ed05Dedf8972541FBBcB', 'data': '0x', 'topics': [HexBytes('0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0'), HexBytes('0x0000000000000000000000000000000000000000000000000000000000000000'), HexBytes('0x000000000000000000000000c67d9ee30d2119a384e02de568be80fe785074ba')]})], 'from': '0xc67d9ee30d2119a384e02de568be80fe785074ba', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000800000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000020000000000001000000800000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000008000000080000000000000000000000000000000000000000000000000000000000000000000000880000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000')})
Changer Contract Address: 0xac25ECb2a67CB85e3890Ed05Dedf8972541FBBcB


Connecting to mocMainnet...
Connected: True
Going to change to this settings:
{   'dayBlockSpan': 2880,
    'emaBlockSpan': 2880,
    'initialEma': 89000000000000000,
    'liq': 1040000000000000000,
    'maxDiscRate': 0,
    'maxMintRiskPro': 12000000000000000000000000,
    'peg': 1,
    'smoothFactor': 11049724000000000,
    'utpdu': 2000000000000000000}
Wait...
AttributeDict({'transactionHash': HexBytes('0x1b90902cf4c3975e3764826aff0b6c50e163e361d775c530856e082f74db29fa'), 'transactionIndex': 3, 'blockHash': HexBytes('0xf48eaf0110a254f74f70772576969620fa5c139ba083ba06fba8d93f2afa2ac3'), 'blockNumber': 2127938, 'cumulativeGasUsed': 1578905, 'gasUsed': 1116538, 'contractAddress': '0xd48DFafD7099198247478522243a6dC47075e8dF', 'logs': [AttributeDict({'logIndex': 0, 'blockNumber': 2127938, 'blockHash': HexBytes('0xf48eaf0110a254f74f70772576969620fa5c139ba083ba06fba8d93f2afa2ac3'), 'transactionHash': HexBytes('0x1b90902cf4c3975e3764826aff0b6c50e163e361d775c530856e082f74db29fa'), 'transactionIndex': 3, 'address': '0xd48DFafD7099198247478522243a6dC47075e8dF', 'data': '0x', 'topics': [HexBytes('0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0'), HexBytes('0x0000000000000000000000000000000000000000000000000000000000000000'), HexBytes('0x00000000000000000000000027a3074db95ec5f6a0e73dc41a4859f48990e841')]})], 'from': '0x27a3074db95ec5f6a0e73dc41a4859f48990e841', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000001000000000000000000000000000000000000020000000000000000000800000000000000000000000000000000400000000000000000400000000000000000040000000000000000000000000000080000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000020000000000000000000000000000000000000000000000000000000000000000000')})
Changer Contract Address: 0xd48DFafD7099198247478522243a6dC47075e8dF

"""