# Getting RIF2X

RIF2X is targeted towards users looking to profit from long positions in RIF, with two times the risk and reward. Leveraged instruments borrow capital from the base bucket (50% in a X2) and pay a daily rate to it as return.

There is a relation between RDOCS and RIF2X. The more RDOCs minted, the more RIF2X can be minted, since they are used for leverage.

The RIF2X token does not implement an ERC20 interface and can not be traded freely because leveraged instruments cannot change owner. RIF2X are assigned to the user RIFX positions can be canceled any time though.

The daily rate can be obtained invoking the `dailyInrate()` view of the **MocInrate** contract.
