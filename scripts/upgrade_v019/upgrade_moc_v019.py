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

network = 'rdocMainnet'
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
Connecting to rdocTestnetAlpha...
Connected: True
Deploying new contract MoC version 019...
AttributeDict({'transactionHash': HexBytes('0x91eca4ad27036d4989365adf6ec2e28160d10cbfc67a55885651f20f2de6cd81'), 'transactionIndex': 0, 'blockHash': HexBytes('0x11bf6c3071908e384750b5b60ae616e21be9a392b423bac4c8272b5f464c3ae7'), 'blockNumber': 776786, 'cumulativeGasUsed': 5624674, 'gasUsed': 5624674, 'contractAddress': '0x26d8A5DD55Bd15366FA0A195e5385F4A2eAeC7D0', 'logs': [], 'from': '0xa8f94d08d3d9c045fe0b86a953df39b14206153c', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish deploying contract!.
New Deploy Contract Address: 0x26d8A5DD55Bd15366FA0A195e5385F4A2eAeC7D0
Upgrading proxy: 0x4512f4C1d984bbf8B7f7404EddFb1881cFA79EfD to new implementation 0x26d8A5DD55Bd15366FA0A195e5385F4A2eAeC7D0
AttributeDict({'transactionHash': HexBytes('0x4526365998242ac405bb4d76723253f8b167b4d4c9c0afe22a7f984fa0b6858b'), 'transactionIndex': 2, 'blockHash': HexBytes('0xe3786f0bd424d80766d2a1a91068486cea462ff0973231aab904703bd4da14de'), 'blockNumber': 776788, 'cumulativeGasUsed': 988171, 'gasUsed': 225963, 'contractAddress': '0xe0181AB36e34223BB9E7F6BA6FdF6EE87c46a452', 'logs': [], 'from': '0xa8f94d08d3d9c045fe0b86a953df39b14206153c', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish upgrading contract!.
Contract address to execute change: 0xe0181AB36e34223BB9E7F6BA6FdF6EE87c46a452

Connecting to rdocTestnet...
Connected: True
Deploying new contract MoC version 019...
AttributeDict({'transactionHash': HexBytes('0x4f7d39c7d23f21d1f06d10a14ff463e8295e396ad067a816c29a3c887e3c9d81'), 'transactionIndex': 2, 'blockHash': HexBytes('0xaa3d3ab78fd658fcd677bdcaff923e06645ce3817af76ad5a2a8077290556983'), 'blockNumber': 789625, 'cumulativeGasUsed': 5732267, 'gasUsed': 5624674, 'contractAddress': '0x1e9c73fA37C24F59658b155d60733d1f43f64c2b', 'logs': [], 'from': '0xa8f94d08d3d9c045fe0b86a953df39b14206153c', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish deploying contract!.
New Deploy Contract Address: 0x1e9c73fA37C24F59658b155d60733d1f43f64c2b
Upgrading proxy: 0x7e2F245F7dc8e78576ECB13AEFc0a101E9BE1AD3 to new implementation 0x1e9c73fA37C24F59658b155d60733d1f43f64c2b
AttributeDict({'transactionHash': HexBytes('0x9f01be2e3cd4def4956329a2e2affaa643aa98342f85da291244282c9bedd089'), 'transactionIndex': 0, 'blockHash': HexBytes('0x767e627cf0b4ce6f37daabfc54bfa6db8220cf20990570cc65707dbef54933bc'), 'blockNumber': 789627, 'cumulativeGasUsed': 225963, 'gasUsed': 225963, 'contractAddress': '0xcC8f86d1B2160C35CAEc66C16d8b7adCa06eC4E3', 'logs': [], 'from': '0xa8f94d08d3d9c045fe0b86a953df39b14206153c', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish upgrading contract!.
Contract address to execute change: 0xcC8f86d1B2160C35CAEc66C16d8b7adCa06eC4E3

Connecting to rdocMainnet...
Connected: True
Deploying new contract MoC version 019...
AttributeDict({'transactionHash': HexBytes('0xe53ed259c161cd90218d5d1174452fffffc2b89d2d573349544d36252a5dcfe0'), 'transactionIndex': 0, 'blockHash': HexBytes('0x00a8436f9027bbba7115bccc5ff2e6a84d1e530c76311029d751f558c5c238e1'), 'blockNumber': 2291559, 'cumulativeGasUsed': 5624674, 'gasUsed': 5624674, 'contractAddress': '0x874056dE3941F1aa208188E91a86fDFC498Ac7a2', 'logs': [], 'from': '0x27a3074db95ec5f6a0e73dc41a4859f48990e841', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish deploying contract!.
New Deploy Contract Address: 0x874056dE3941F1aa208188E91a86fDFC498Ac7a2
Upgrading proxy: 0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1 to new implementation 0x874056dE3941F1aa208188E91a86fDFC498Ac7a2
AttributeDict({'transactionHash': HexBytes('0x27f913ee45766fca4629ad3b0ca20431b6fb5528f9803fa43fc23e1fcd3f55d2'), 'transactionIndex': 0, 'blockHash': HexBytes('0x712e3800b68bb721e9c82087e89e2e3f5801ae7ecab2df57b3299a8c5ae14823'), 'blockNumber': 2291560, 'cumulativeGasUsed': 226027, 'gasUsed': 226027, 'contractAddress': '0xc383e690401eb88a800BDC7840e73B5D6c6754a6', 'logs': [], 'from': '0x27a3074db95ec5f6a0e73dc41a4859f48990e841', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Finish upgrading contract!.
Contract address to execute change: 0xc383e690401eb88a800BDC7840e73B5D6c6754a6

"""