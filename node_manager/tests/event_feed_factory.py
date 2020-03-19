import os
from web3 import Web3
from node_manager.utils import NodeManager
import datetime
import csv

network = 'mocTestnet'
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'config.json')
node_manager = NodeManager(path_to_config=config_path, network=network)
node_manager.connect_node()

print("Connecting to %s..." % network)
print("Connected: {conectado}".format(conectado=node_manager.is_connected))

path_build = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../build/contracts')
moc_factory_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['FeedFactory'])
moc_factory = node_manager.load_json_contract(os.path.join(path_build, "oracle", "FeedFactory.json"),
                                              deploy_address=moc_factory_address)

days = 60  # testnet 160
day_blocks = 2880
hours_delta = 0

block_number = int(node_manager.block_number)

l_events = list()
for i in range(days):
    count_day = i + 1

    from_block = block_number - day_blocks * count_day
    last_block = block_number - day_blocks * (count_day - 1)

    print("requesting from block {0} to block {1} Count day: {2}".format(from_block, last_block, count_day))

    events = list()
    try:
        events = node_manager.list_events_from(moc_factory, 'Created',
                                               from_block=from_block, to_block=last_block)
    except Exception as e:
        print('Failed connecting to node: ' + str(e))

    for event in events:
        d_event = dict()
        d_event['blockNumber'] = event['blockNumber']
        ts = node_manager.get_block_timestamp(d_event['blockNumber'])
        dt = ts - datetime.timedelta(hours=hours_delta)
        d_event['timestamp'] = dt.strftime("%Y-%m-%d %H:%M:%S")
        d_event['sender'] = event['args']['sender']
        d_event['feed'] = event['args']['feed']
        l_events.append(d_event)

# re order
o_list = sorted(l_events, key=lambda i: i['blockNumber'], reverse=True)

# write to disk
columns = ['Nº', 'Block Nº', 'Timestamp', 'sender', 'feed']
path_file = 'feedfactory_{0}.csv'.format(network)
with open(path_file, 'w', newline='') as csvfile:
    writer = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    writer.writerow(columns)

    count = 0
    for e_event in o_list:
        count += 1
        row = [count,
               e_event['blockNumber'],
               e_event['timestamp'],
               e_event['sender'],
               e_event['feed']]
        writer.writerow(row)
