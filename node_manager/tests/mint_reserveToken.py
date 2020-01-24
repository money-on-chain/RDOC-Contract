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
moc_moc_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['moc'])
reserve_token_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['reserveToken'])


moc_moc = node_manager.load_json_contract(os.path.join(path_build, "MoC.json"),
                                          deploy_address=moc_moc_address)
reserve_token = node_manager.load_json_contract(os.path.join(path_build, "ReserveToken.json"),
                                                deploy_address=reserve_token_address)

print("NOTE: This only work on development!!")

print("Reserve token balance:")
from_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['accounts'][0]['address'])
balance = reserve_token.functions.balanceOf(from_address).call()
print("Account: {0} Balance: {1}".format(from_address, Web3.fromWei(balance, 'ether')))

mocPrecision = moc_moc.functions.getMocPrecision().call()
claim_value = 1000

tx_hash = node_manager.fnx_transaction(reserve_token, 'claim', int(claim_value * mocPrecision))
tx_receipt = node_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)


print("Reserve token balance:")
from_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['accounts'][0]['address'])
balance = reserve_token.functions.balanceOf(from_address).call()
print("Account: {0} Balance: {1}".format(from_address, Web3.fromWei(balance, 'ether')))

"""
const setAllowanceForAll = (reserveToken, moc, accounts) =>
  executeBatched(
    accounts.map(from => () => reserveToken.approve(moc.address, INITIAL_BALANCE, { from }))
  );

"""

# setallowence
tx_hash = node_manager.fnx_transaction(reserve_token, 'approve', moc_moc_address, int(claim_value * mocPrecision))
tx_receipt = node_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)


allowance = moc_moc.functions.getAllowance(from_address).call()
print("allownce: {0}".format(allowance))
