import pandas as pd

df = pd.read_parquet('cases.parquet')
print("=== Total Cases in RCAEval ===")
print("Shape:", df.shape)
print("\nColumns:", df.columns.tolist())

print("\n=== Suites & Systems ===")
if 'suite' in df.columns:
    print(df['suite'].value_counts())
elif 'dataset' in df.columns:
    print(df['dataset'].value_counts())

print("\n=== Sample 5 rows ===")
print(df.head(5))

# Filter for RE1 Online Boutique
re1_ob = df[df['case'].str.startswith('re1ob_')] if 'case' in df.columns else df[df.iloc[:,0].astype(str).str.startswith('re1ob_')]
print("\n=== RE1 Online Boutique cases count ===")
print("Found cases:", len(re1_ob))
print(re1_ob.head(10))

# Save a CSV copy for easy inspection
re1_ob.to_csv('re1_ob_cases.csv', index=False)
print("\nSaved re1_ob_cases.csv")
