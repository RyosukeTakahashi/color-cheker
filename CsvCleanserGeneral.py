import pandas as pd


path = './defectResultCsvs/20180816_130057____A'
src_csv = open(path + '.csv' , 'r')
csv_lines = src_csv.readlines()
src_csv.close()

for i, line in enumerate(csv_lines):
    print(i)


print(csv_lines)
cleansed_path = path+ "_cleansed.csv"
dropped_path = path+ "_dropped.csv"
new_file = open(cleansed_path, 'w')
new_file.write(''.join(csv_lines))
new_file.close()

df = pd.read_csv(cleansed_path, header=None, usecols=[2, 3, 4, 6, 7])

df.columns = ['x', 'y', 'size', "detected_area", "rank"]

df.to_csv(dropped_path)
print(df)
