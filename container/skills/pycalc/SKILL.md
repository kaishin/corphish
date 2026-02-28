---
name: pycalc
description: Perform mathematical calculations using Python. Use for any math operations - arithmetic, algebra, statistics, scientific calculations, etc.
allowed-tools: Bash(pycalc:*)
---

# Python Calculator

Use Python for any mathematical calculations. Perfect for:

- Arithmetic (basic math)
- Algebra (solve equations, simplify expressions)
- Statistics (mean, median, std dev, etc.)
- Scientific calculations (trigonometry, logarithms, etc.)
- Unit conversions
- Financial calculations

## Usage

```bash
pycalc "expression"           # Evaluate a math expression
pycalc --solve "x**2 + 5*x + 6 = 0"  # Solve equation
pycalc --stats "1,2,3,4,5"    # Calculate statistics
pycalc --convert "100 km to miles"  # Unit conversion
```

## Examples

```bash
pycalc "2 + 2"                          # 4
pycalc "sqrt(16) + log(10)"             # 4 + 2.302...
pycalc "factorial(5)"                   # 120
pycalc "sin(pi/2) + cos(0)"             # 2.0
pycalc "2**10"                          # 1024
pycalc "bin(42)"                        # '0b101010'
pycalc "hex(255)"                       # '0xff'
```

## Advanced

```bash
# Statistics
pycalc --stats "10,20,30,40,50"        # mean=30, median=30, etc.

# Solve equation
pycalc --solve "x**2 - 4 = 0"           # x = 2, x = -2

# Define variables and compute
pycalc "a = 5; b = 10; a * b"          # 50

# Import math module (automatic)
pycalc "gcd(48, 18)"                   # 6
pycalc "degrees(pi)"                   # 180.0
```
