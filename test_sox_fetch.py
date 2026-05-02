import sys
import os

# Add C:\財經APP to path if needed
sys.path.append(r'C:\財經APP')

try:
    from data_loader import _fetch_sox_data
    print("Import successful")
    
    df = _fetch_sox_data("2026-03-01", "2026-04-25")
    if not df.empty:
        print("Successfully fetched SOX data:")
        print(df.tail())
    else:
        print("Fetched empty SOX dataframe")
except Exception as e:
    print(f"Error: {e}")
