# RoC precisions

The RIF On Chain system handles different types of currency precision to operate with tokens and RIF. The **MoCLibConnection** contract defines 2 variables that are used across the platform:

- _mocPrecision_: Currently RDOC, BROS and RIF2X tokens use 18 decimal places of precision.
- _reservePrecision_: Currently RIF amounts use 18 decimal places of precision.