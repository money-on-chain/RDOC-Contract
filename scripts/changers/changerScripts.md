# Changer Scripts -- WORK IN PROGRESS --

This folder contains a _pre-alpha_ set of scripts and tools to facilitate change contracts execution. They are *by no mean* ready to be use on mainet networks.
On general basis, the follow this standard:
 - On `script-config` there are general network configurations
 - Script `input` arguments are _hardcoded_ on each script as necessary, on a `const input = { ... }` section at the beginning.
 - The scripts is suppose to be run with no arguments
 - The output will be console logged (TxHash -> confirmation -> receipt | error )

 ## Dependencies

  - Contracts must be compiled into `~/build/contracts`
