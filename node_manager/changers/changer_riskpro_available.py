import os
from web3 import Web3
from node_manager.utils import NodeManager
import pprint

pp = pprint.PrettyPrinter(indent=4)

network = 'development'
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
init_settings['maxDiscRate'] = int(0.5 * 10 ** 18)
init_settings['dayBlockSpan'] = 2824
init_settings['initialEma'] = int(8247 * 10 ** 18)
init_settings['smoothFactor'] = int(0.009950249 * 10 ** 18)
init_settings['emaBlockSpan'] = init_settings['dayBlockSpan']
init_settings['maxMintRiskPro'] = int(10 * 10 ** 18)


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

moc_governor = node_manager.load_json_contract(os.path.join(path_build, "Governor.json"),
                                               deploy_address=governor_address)

print("Saving changes to governor...")
tx_hash = node_manager.fnx_transaction(moc_governor, 'executeChange', contract_address)
tx_receipt = node_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)

print("Governor changes done!")


