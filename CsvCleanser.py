import pandas as pd

src_csv = open("sample.csv", 'r')
csv_lines = src_csv.readlines()[37:-5]
src_csv.close()

print(csv_lines)

new_file = open("sample_cleansed.csv", 'w')
new_file.write(''.join(csv_lines))
new_file.close()

df = pd.read_csv("sample_cleansed.csv", header=None, usecols=[6, 7])

df.columns = ["detected_area", "rank"]

df.to_csv("sample_dropped.csv")
print(df)



