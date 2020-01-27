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
moc_inrate_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocInrate'])
moc_moc_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['moc'])
mocState_address = Web3.toChecksumAddress(node_manager.options['networks'][network]['addresses']['mocState'])

moc_inrate = node_manager.load_json_contract(os.path.join(path_build, "MoCInrate.json"),
                                             deploy_address=moc_inrate_address)
moc_moc = node_manager.load_json_contract(os.path.join(path_build, "MoC.json"),
                                          deploy_address=moc_moc_address)
moc_state = node_manager.load_json_contract(os.path.join(path_build, "MoCState.json"),
                                            deploy_address=mocState_address)

# Web3.fromWei(moc_moc.functions.getMocPrecision().call(), 'ether')
mocPrecision = moc_moc.functions.getMocPrecision().call()
riskProTecPrice = moc_state.functions.riskProTecPrice().call()
riskProSpotDiscount = moc_state.functions.riskProSpotDiscountRate().call()

# const factor = mocPrecision.sub(riskProSpotDiscount);
factor = mocPrecision - riskProSpotDiscount
# finalPrice = riskProTecPrice.mul(factor).div(mocPrecision);
finalPrice = (riskProTecPrice * factor) / mocPrecision
print("finalPrice: {0}".format(finalPrice))

riskProAmount = 25
reserveTotal = riskProAmount * finalPrice
print("reserveTotal: {0}".format(reserveTotal))

#rbtcPrecision = 10 ** 18
#CommissionRate = int(0.002 * 10 ** 18)
#btcCommissionAmount = moc_inrate.functions.calcCommissionValue(
#            int(nBTC * rbtcPrecision)).call() / CommissionRate
#nBTC_Payable = nBTC + btcCommissionAmount


# tx_hash = node_manager.fnx_transaction(moc_moc, 'mintRiskPro', int(nBTC * rbtcPrecision),
#                                        tx_params={'value': int(nBTC_Payable * rbtcPrecision)})
# tx_receipt = node_manager.wait_transaction_receipt(tx_hash)
# print(tx_receipt)

tx_hash = node_manager.fnx_transaction(moc_moc, 'mintRiskPro', int(reserveTotal * mocPrecision))
tx_receipt = node_manager.wait_transaction_receipt(tx_hash)
print(tx_receipt)


"""
const reserveTokenNeededToMintRiskPro = (moc, mocState) => async riskProAmount => {
  // TODO: manage max Bitpro with discount
  const mocPrecision = await moc.getMocPrecision();
  const riskProTecPrice = await mocState.riskProTecPrice();
  // Check discount rate
  const riskProSpotDiscount = await mocState.riskProSpotDiscountRate();
  const factor = mocPrecision.sub(riskProSpotDiscount);
  const finalPrice = riskProTecPrice.mul(factor).div(mocPrecision);

  const reserveTotal = toContractBNNoPrec(riskProAmount * finalPrice);
  return reserveTotal;
};


const mintRiskProAmount = (moc, mocState) => async (account, riskProAmount) => {
  if (!riskProAmount) {
    return;
  }

  const reserveTotal = await reserveTokenNeededToMintRiskPro(moc, mocState)(riskProAmount);
  // User should have more than this balance to pay commissions
  return moc.mintRiskPro(toContract(reserveTotal), { from: account });
};
"""