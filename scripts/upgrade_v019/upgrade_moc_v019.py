"""

Title: Upgrade v019
Project: MoC and RRC20
Networks: mocTestnet, mocTestnetAlpha, mocMainnet, rdocTestnet, rdocMainnet

This is script upgrade MoC Contract to version v019 Fix Evalbucketliquidation.
This fix consist in add modifier to the function eval bucket liquidation that
prevent to liquidate bucket when is settlement running.

"""


import os
from web3 import Web3
from moneyonchain.manager import ConnectionManager

network = 'rdocTestnet'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'config.json')

connection_manager = ConnectionManager(options=config_path, network=network)

print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=connection_manager.is_connected))

path_build = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../build/contracts')

moc_address = Web3.toChecksumAddress(
    connection_manager.options['networks'][network]['addresses']['MoC'])
upgradeDelegator_address = Web3.toChecksumAddress(
    connection_manager.options['networks'][network]['addresses']['upgradeDelegator'])
MoCHelperLib_address = Web3.toChecksumAddress(
    connection_manager.options['networks'][network]['addresses']['MoCHelperLib'])
governor_address = Web3.toChecksumAddress(
    connection_manager.options['networks'][network]['addresses']['governor'])

# fix of the link library
link_library = [('__MoCHelperLib__________________________', MoCHelperLib_address.replace('0x', ''))]

# Deploy new contract
print("Deploying new contract MoC version 019...")
path_to_json = os.path.join(path_build, "MoC.json")
sc = connection_manager.load_bytecode_contract_file_json(path_to_json, link_library=link_library)
tx_hash = connection_manager.fnx_constructor(sc, gas_limit=6000000)
tx_receipt = connection_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)

new_contract_address = tx_receipt.contractAddress
print("Finish deploying contract!.")
print("New Deploy Contract Address: {address}".format(address=new_contract_address))

# Upgrade Contract
print("Upgrading proxy: {0} to new implementation {1}".format(moc_address, new_contract_address))
path_to_json = os.path.join(path_build, "MoC_v019_Updater.json")
sc = connection_manager.load_bytecode_contract_file_json(path_to_json, link_library=link_library)
tx_hash = connection_manager.fnx_constructor(sc, moc_address, upgradeDelegator_address, new_contract_address)
tx_receipt = connection_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)
print("Finish upgrading contract!.")

upgrade_contract_address = tx_receipt.contractAddress
print("Contract address to execute change: {0}".format(upgrade_contract_address))

# print("Making governor changes...")
# moc_governor = connection_manager.load_json_contract(os.path.join(path_build, "Governor.json"),
#                                                      deploy_address=governor_address)
# tx_hash = connection_manager.fnx_transaction(moc_governor, 'executeChange', upgrade_contract_address)
# tx_receipt = connection_manager.wait_transaction_receipt(tx_hash)
# print(tx_receipt)
# print("Governor changes done!")


"""

"""