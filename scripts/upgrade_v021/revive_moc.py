"""

Title: Revive Moc
Project:  ROC
Networks:

"""


import os
from web3 import Web3
from moneyonchain.manager import ConnectionManager

network = 'rdocTestnetAlpha'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'config.json')

connection_manager = ConnectionManager(options=config_path, network=network)

print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=connection_manager.is_connected))

path_build = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../build/contracts')

moc_settlement_address = Web3.toChecksumAddress(
    connection_manager.options['networks'][network]['addresses']['MoC'])

print("Calling Revive ...")
moc_settlement = connection_manager.load_json_contract(
    os.path.join(path_build, "MoC.json"),
    deploy_address=moc_settlement_address)
tx_hash = connection_manager.fnx_transaction(moc_settlement, 'revive')
tx_receipt = connection_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)
print("Revive done!")

