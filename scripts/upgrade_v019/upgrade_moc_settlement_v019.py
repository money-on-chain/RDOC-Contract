"""

Title: Upgrade v019
Project: MoC and RRC20
Networks: mocTestnet, mocTestnetAlpha, mocMainnet, rdocTestnet, rdocMainnet

This is script upgrade MoC Settlement Contract to version v019 Fix Partial Execution.

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
upgradeDelegator_address = Web3.toChecksumAddress(
    connection_manager.options['networks'][network]['addresses']['upgradeDelegator'])
MoCHelperLib_address = Web3.toChecksumAddress(
    connection_manager.options['networks'][network]['addresses']['MoCHelperLib'])
governor_address = Web3.toChecksumAddress(
    connection_manager.options['networks'][network]['addresses']['governor'])

# fix of the link library
link_library = [('__MoCHelperLib__________________________', MoCHelperLib_address.replace('0x', ''))]

# Deploy new contract
print("Deploying new contract MoC Settlement version 019...")
path_to_json = os.path.join(path_build, "MoCSettlement_v019.json")
sc = connection_manager.load_bytecode_contract_file_json(path_to_json, link_library=link_library)
tx_hash = connection_manager.fnx_constructor(sc, gas_limit=6000000)
tx_receipt = connection_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)

new_contract_address = tx_receipt.contractAddress
print("Finish deploying contract!.")
print("New Deploy Contract Address: {address}".format(address=new_contract_address))

# Upgrade Contract
print("Upgrading proxy: {0} to new implementation {1}".format(moc_settlement_address, new_contract_address))
path_to_json = os.path.join(path_build, "MoCSettlement_v019_Updater.json")
sc = connection_manager.load_bytecode_contract_file_json(path_to_json, link_library=link_library)
tx_hash = connection_manager.fnx_constructor(sc, moc_settlement_address, upgradeDelegator_address, new_contract_address)
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

Connecting to rdocTestnetAlpha...
Connected: True
Deploying new contract MoC Settlement version 019...
AttributeDict({'transactionHash': HexBytes('0x51e5cb1146e72e6c420b1898c0850a65be4a78c5c3277e881e6e7906a090c289'), 'transactionIndex': 8, 'blockHash': HexBytes('0xb2470f052512aa7a59237959c6f0d3754aaef1fdc56be974397613311c754be3'), 'blockNumber': 847725, 'cumulativeGasUsed': 3459114, 'gasUsed': 2870402, 'contractAddress': '0x669069b02C4B59E167Cd15E13605C89803DEc9bE', 'logs': [], 'from': '0xa8F94d08d3d9C045fE0b86a953DF39b14206153c', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish deploying contract!.
New Deploy Contract Address: 0x669069b02C4B59E167Cd15E13605C89803DEc9bE
Upgrading proxy: 0xF7a2835aF44DF2b831291D7229DcD13D32E57d4A to new implementation 0x669069b02C4B59E167Cd15E13605C89803DEc9bE
AttributeDict({'transactionHash': HexBytes('0x304df6be78fddc33a1f80bcb2951ba30bfb6a98d4a4afa02bc049be326d0d05b'), 'transactionIndex': 7, 'blockHash': HexBytes('0x658b78951ed19f05a725936c9ef1f5cd20431ee4aa82c7a2a3ea70b2e08b01e8'), 'blockNumber': 847727, 'cumulativeGasUsed': 433089, 'gasUsed': 225963, 'contractAddress': '0x7Eddb365a4FA09b7fb3ce13FFC7885c5d1a0e1B3', 'logs': [], 'from': '0xa8F94d08d3d9C045fE0b86a953DF39b14206153c', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish upgrading contract!.
Contract address to execute change: 0x7Eddb365a4FA09b7fb3ce13FFC7885c5d1a0e1B3


Connecting to rdocTestnet...
Connected: True
Deploying new contract MoC Settlement version 019...
AttributeDict({'transactionHash': HexBytes('0xac832c821f7550d96c8a009c3aadb82b0c491c1cb3d4581713f0fa61b6d2f0c7'), 'transactionIndex': 4, 'blockHash': HexBytes('0x1815786bc94837d48dc79f9dab2ee6364f9a5e77668578aca4b50dbd974fc98a'), 'blockNumber': 848533, 'cumulativeGasUsed': 2995942, 'gasUsed': 2870402, 'contractAddress': '0x107F6a27d516C7d6958Bbc80FBdD2d6520B496f9', 'logs': [], 'from': '0xa8F94d08d3d9C045fE0b86a953DF39b14206153c', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish deploying contract!.
New Deploy Contract Address: 0x107F6a27d516C7d6958Bbc80FBdD2d6520B496f9
Upgrading proxy: 0x163D79dB568417983Aa2D64AA6310Bed0f23Ab61 to new implementation 0x107F6a27d516C7d6958Bbc80FBdD2d6520B496f9
AttributeDict({'transactionHash': HexBytes('0x794814363894430556343bf4365ad983c4bd14065fc47538a048359bb6c97112'), 'transactionIndex': 2, 'blockHash': HexBytes('0x230a7a94e484b47a0c40e14152628544e26a7b97a30ab86edd8639a7bce97348'), 'blockNumber': 848534, 'cumulativeGasUsed': 285135, 'gasUsed': 225963, 'contractAddress': '0xb6Cc71509745D3f59ACF652b5525c1677aF84B4e', 'logs': [], 'from': '0xa8F94d08d3d9C045fE0b86a953DF39b14206153c', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish upgrading contract!.
Contract address to execute change: 0xb6Cc71509745D3f59ACF652b5525c1677aF84B4e

Connecting to rdocMainnet...
Connected: True
Deploying new contract MoC Settlement version 019...
AttributeDict({'transactionHash': HexBytes('0x2987435549b5fc33cf405ffaa11ac1a9cab1ab2c01b3be4b6c8950345cb9b422'), 'transactionIndex': 0, 'blockHash': HexBytes('0xadff8ff1e743145fc1b656e7b28b0216dd42b48d4dea4246c90534f06ff98e75'), 'blockNumber': 2351895, 'cumulativeGasUsed': 2870402, 'gasUsed': 2870402, 'contractAddress': '0x65233579961F93D74402b8C6f78A7D98D23a39a1', 'logs': [], 'from': '0x27a3074Db95Ec5f6a0E73DC41a4859F48990e841', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish deploying contract!.
New Deploy Contract Address: 0x65233579961F93D74402b8C6f78A7D98D23a39a1
Upgrading proxy: 0xb8a6beBa78c3E73f6A66DDacFaEB240ae22Ca709 to new implementation 0x65233579961F93D74402b8C6f78A7D98D23a39a1
AttributeDict({'transactionHash': HexBytes('0xbc620061ca5f2eba2957993b48a70722bd5f0860ddf80818d2c70f5511b2f415'), 'transactionIndex': 0, 'blockHash': HexBytes('0x61574e10af21d994a462cd8605fd29aaf41b2609ef8b872531e8eb6af007c531'), 'blockNumber': 2351896, 'cumulativeGasUsed': 226027, 'gasUsed': 226027, 'contractAddress': '0xc62552253335434BB1deD6fEFd992dfCfafc64C0', 'logs': [], 'from': '0x27a3074Db95Ec5f6a0E73DC41a4859F48990e841', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish upgrading contract!.
Contract address to execute change: 0xc62552253335434BB1deD6fEFd992dfCfafc64C0


"""