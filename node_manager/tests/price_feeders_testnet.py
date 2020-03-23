import os
from web3 import Web3
from node_manager.utils import NodeManager

network = 'mocTestnet'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'config.json')
node_manager = NodeManager(path_to_config=config_path, network=network)
node_manager.connect_node()

print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=node_manager.is_connected))

path_build = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../build/contracts')

moc_medianizer_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['oracle'])
moc_medianizer = node_manager.load_json_contract(os.path.join(path_build, "oracle_testnet", "MoCMedianizer.json"),
                                                 deploy_address=moc_medianizer_address)

price_feeders = ['0x462D7082F3671a3BE160638Be3f8C23Ca354F48A',
                 '0xE0A3dCe741b7eAd940204820B78e7990a136eaC1']

peek = moc_medianizer.functions.peek().call()
price = Web3.toInt(peek[0])
have_value = peek[1]

print("Moc Medianizer at address: {medianizer_address}. Price: {price}. Have value {have_value}".format(
    medianizer_address=moc_medianizer_address,
    price=Web3.fromWei(price, 'ether'),
    have_value=have_value
))

print("Evaluating price feeders...")

for price_feed in price_feeders:
    pricefeed_address = Web3.toChecksumAddress(price_feed)
    index_med = moc_medianizer.functions.indexes(pricefeed_address).call()
    if Web3.toInt(index_med) > 0:
        print("Account: {0} Index: {1} Active: True".format(price_feed, Web3.toInt(index_med)))

    pricefeed = node_manager.load_json_contract(os.path.join(path_build, "oracle", "PriceFeed.json"),
                                                deploy_address=pricefeed_address)

    peek = pricefeed.functions.peek().call()
    price = Web3.toInt(peek[0])
    print("Account: {account} Price: {price} Have Value: {have_value}".format(
        account=price_feed,
        price=Web3.fromWei(price, 'ether'),
        have_value=peek[1]))
