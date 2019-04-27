# import json
#
# import firebase_admin
# from firebase_admin import credentials
# from firebase_admin import firestore
#
# # Use a service account
# cred = credentials.Certificate('nedo-taiyo-experiment-app-ccd761a2f8b7.json')
# firebase_admin.initialize_app(cred)
#
# db = firestore.client()
#
# answers_ref = db.collection(u'answers_prodcution')
# docs = answers_ref.get()
# resultDict = {}
# for doc in docs:
#     print(doc.to_dict())
#     resultDict[doc.id] = doc.to_dict()
#
# json_str = json.dumps(resultDict, default=str, indent=4, sort_keys=True, ensure_ascii=False)
#
# new_file = open("expData.json", 'w', encoding='utf-8')
# new_file.write(json_str)
# new_file.close()

#Pandasをインポート
import pandas as pd

#変換したいJSONファイルを読み込む
df = pd.read_json("expData.json")

#CSVに変換して任意のファイル名で保存
df.T.to_csv("expData.csv")
