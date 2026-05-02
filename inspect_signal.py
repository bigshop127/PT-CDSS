import pandas as pd
import sys
import os

sys.path.append(r'C:\財經APP')

try:
    from signal_generator import generate_signals # Assuming signal.py contains generate_signals
except ImportError:
    # If it's just signal.py without a main function, let's try to find the function name
    # The Investigator's report showed dimension_logic was being inserted into a function.
    pass

# Let's read signal.py to find the function name
with open(r'C:\財經APP\signal.py', 'r', encoding='utf-8') as f:
    content = f.read()
    print("Found signal.py content")
    # Search for function definition
    import re
    match = re.search(r'def (\w+)\(df', content)
    if match:
        func_name = match.group(1)
        print(f"Detected function name: {func_name}")
    else:
        print("Could not detect function name")
