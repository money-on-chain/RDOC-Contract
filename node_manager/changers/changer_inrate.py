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
moc_inrate_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocInrate'])
moc_inrate = node_manager.load_json_contract(os.path.join(path_build, "MoCInrate.json"),
                                             deploy_address=moc_inrate_address)
oracle_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['oracle'])
governor_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['governor'])

dayBlockSpan = 2551
init_settings = dict()
init_settings['bitProInterestBlockSpan'] = int(dayBlockSpan * 1)
init_settings['btxcTmin'] = int(0.000133681 * 10 ** 18)
init_settings['btxcTmax'] = int(0.004 * 10 ** 18)
init_settings['btxcPower'] = int(4)
init_settings['newBitProRate'] = int(0.000047945 * 10 ** 18)
init_settings['newCommissionRate'] = int(0.002 * 10 ** 18)
init_settings['stableTmin'] = int(0.0 * 10 ** 18)
init_settings['stableTmax'] = int(0.01 * 10 ** 18)
init_settings['stablePower'] = int(0)


print("Going to change to this settings:")
pp.pprint(init_settings)
print("Wait...")


path_to_json = os.path.join(path_build, "MocInrateChanger.json")
sc, json_content = node_manager.sc_from_json_bytecode(path_to_json)
tx_hash = node_manager.fnx_constructor(sc,
                                       moc_inrate.address,
                                       init_settings['bitProInterestBlockSpan'],
                                       init_settings['btxcTmin'],
                                       init_settings['btxcTmax'],
                                       init_settings['btxcPower'],
                                       init_settings['newBitProRate'],
                                       init_settings['newCommissionRate'],
                                       init_settings['stableTmin'],
                                       init_settings['stableTmax'],
                                       init_settings['stablePower']
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


