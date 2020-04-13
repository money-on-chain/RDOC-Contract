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

# Moc Medianizer is oracle
moc_medianizer_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['oracle'])
moc_factory_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['FeedFactory'])

moc_medianizer = node_manager.load_json_contract(os.path.join(path_build, "oracle", "MoCMedianizer.json"),
                                                 deploy_address=moc_medianizer_address)
moc_factory = node_manager.load_json_contract(os.path.join(path_build, "oracle", "FeedFactory.json"),
                                              deploy_address=moc_factory_address)

# owner of the price feeder
priceFeedOwner = '0x64dcc3bcbeae8ce586cabdef79104986beafcad6'

sc, json_content = node_manager.sc_from_json_bytecode(os.path.join(path_build, "PriceFeederAdder.json"))
tx_hash = node_manager.fnx_constructor(sc,
                                       moc_factory.address,
                                       moc_medianizer.address,
                                       Web3.toChecksumAddress(priceFeedOwner)
                                       )
tx_receipt = node_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)

moc_price_feed_adder = node_manager.web3.eth.contract(
    address=tx_receipt.contractAddress,
    abi=json_content['abi'],
)

print("Contract address: {feedadder}".format(feedadder=tx_receipt.contractAddress))


"""
1. Pricefeeder #1 Mainnet

Connecting to mocMainnet...
Connected: True
AttributeDict({'transactionHash': HexBytes('0x09acc67e3861fb96065297ce3755d441fbe7e4fe86424297d18deaf72de7a1bd'), 'transactionIndex': 3, 'blockHash': HexBytes('0x057aa7c09f023e51baac1f4af4231fb827e55a3fcacdeb4d431b3e353ae1357a'), 'blockNumber': 2121969, 'cumulativeGasUsed': 460902, 'gasUsed': 280165, 'contractAddress': '0xE24b5147a003A57414E8757Ddbf7D7A1c53e9e32', 'logs': [], 'from': '0x27a3074db95ec5f6a0e73dc41a4859f48990e841', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Contract address: 0xE24b5147a003A57414E8757Ddbf7D7A1c53e9e32

2. Pricefeeder #2 Testnet RSK

Connecting to mocTestnet...
Connected: True
AttributeDict({'transactionHash': HexBytes('0x8ed6deb115bb93f993a2cf1cb135552e7b793590b7471550143500d0dffa0590'), 'transactionIndex': 1, 'blockHash': HexBytes('0xbb90cafb412c1bc6118cee3d525d4e4375a7d9dac71e661d4e88dda7ffb88e11'), 'blockNumber': 700187, 'cumulativeGasUsed': 336442, 'gasUsed': 280165, 'contractAddress': '0x41054126325E8181b8A3F7504cE68305dF51E875', 'logs': [], 'from': '0xc67d9ee30d2119a384e02de568be80fe785074ba', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Contract address: 0x41054126325E8181b8A3F7504cE68305dF51E875

3. Pricefeeder #2 Mainnet RSK

Connecting to mocMainnet...
Connected: True
AttributeDict({'transactionHash': HexBytes('0x932047a88536ede3ba307cdf04f5f4e01e2edfe8c864575ac382104e37d2a968'), 'transactionIndex': 0, 'blockHash': HexBytes('0x63f53f5b26ed472d6064396f72165079f0d084ee7f0af9b4daf0b0861a3f4706'), 'blockNumber': 2232040, 'cumulativeGasUsed': 280165, 'gasUsed': 280165, 'contractAddress': '0xaa0E3753aDA1fB85016c8C611C0573452c587208', 'logs': [], 'from': '0x27a3074db95ec5f6a0e73dc41a4859f48990e841', 'to': None, 'root': '0x01', 'status': 1, 'logsBloom': HexBytes('0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000')})
Contract address: 0xaa0E3753aDA1fB85016c8C611C0573452c587208
"""