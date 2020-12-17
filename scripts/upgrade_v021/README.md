# Upgrade Smart Contract

## Upgrade v021

Revive the contract. 

**Requirements**

1. Python >= 3.6
2. `pip install moneyonchain>=0.04`

**Upgrade**

1. npm install
2. npm run truffle-compile
3. python ./upgrade_moc_v021.py
4. python ./upgrade_moc_state_v021.py
5. python ./revive_moc.py
6. python ./revive_moc_state.py