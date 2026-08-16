
import requests, json, time

PARSER_URL = "http://localhost:9001/parse"

TEST_SET = [
  {"resume_id":"eval-001","text":"Alice Johnson\nalice.johnson@gmail.com\n+44 7700 912345\nMSc Artificial Intelligence, University of Edinburgh, 2022\nSkills: Python, Machine Learning, NLP, TensorFlow, Docker, AWS","gt":{"email":["alice.johnson@gmail.com"],"phone":["+44 7700 912345"],"skills":["python","machine learning","nlp","tensorflow","docker","aws"],"degrees":["msc"]}},
  {"resume_id":"eval-002","text":"Bob Patel\nbob.patel@hotmail.com\n07912 345678\nBSc Computer Science, University of Manchester, 2020\nExperience: React, Node.js, MongoDB, Docker, REST API, JavaScript","gt":{"email":["bob.patel@hotmail.com"],"phone":["07912 345678"],"skills":["react","node.js","mongodb","docker","rest api","javascript"],"degrees":["bsc"]}},
  {"resume_id":"eval-003","text":"Sara Ahmed\nsara.ahmed@yahoo.com\n+92 300 1234567\nPhD Computer Vision, Imperial College London, 2021\nPython, PyTorch, TensorFlow, scikit-learn, Kubernetes, Linux","gt":{"email":["sara.ahmed@yahoo.com"],"phone":["+92 300 1234567"],"skills":["python","pytorch","tensorflow","scikit-learn","kubernetes","linux"],"degrees":["phd"]}},
  {"resume_id":"eval-004","text":"James Wilson\njames.wilson@outlook.com\n+1 415 555 0198\nMSc Data Science, Stanford University, 2019\nSQL, Python, Pandas, NumPy, AWS, Tableau, Machine Learning","gt":{"email":["james.wilson@outlook.com"],"phone":["+1 415 555 0198"],"skills":["sql","python","pandas","numpy","aws","machine learning"],"degrees":["msc"]}},
  {"resume_id":"eval-005","text":"Fatima Al-Sayed\nfatima@company.ae\n+971 50 123 4567\nBSc Information Technology, King Abdulaziz University, 2021\nJava, Python, Agile, Scrum, REST API, MySQL, Docker","gt":{"email":["fatima@company.ae"],"phone":["+971 50 123 4567"],"skills":["java","python","agile","scrum","rest api","docker"],"degrees":["bsc"]}},
  {"resume_id":"eval-006","text":"Liam Chen\nliam.chen@gmail.com\n+86 138 0013 8000\nMSc Software Engineering, Tsinghua University, 2020\nC++, Python, TensorFlow, Git, Linux, Deep Learning, NLP","gt":{"email":["liam.chen@gmail.com"],"phone":["+86 138 0013 8000"],"skills":["python","git","linux","deep learning","nlp","tensorflow","c++"],"degrees":["msc"]}},
  {"resume_id":"eval-007","text":"Emma Martinez\nemma.martinez@protonmail.com\n+34 612 345 678\nBSc Electrical Engineering, Universidad Politecnica, 2022\nPython, MATLAB, Agile, AWS, Docker, REST API","gt":{"email":["emma.martinez@protonmail.com"],"phone":["+34 612 345 678"],"skills":["python","agile","aws","docker","rest api"],"degrees":["bsc"]}},
  {"resume_id":"eval-008","text":"Noah Kim\nnoah.kim@naver.com\n+82 10 1234 5678\nPhD Machine Learning, KAIST, 2021\nPyTorch, Python, NLP, BERT, scikit-learn, Kubernetes","gt":{"email":["noah.kim@naver.com"],"phone":["+82 10 1234 5678"],"skills":["pytorch","python","nlp","bert","scikit-learn","kubernetes"],"degrees":["phd"]}},
  {"resume_id":"eval-009","text":"Olivia Brown\nolivia.brown@gmail.com\n07700 900123\nMSc Cybersecurity, University of Bristol, 2020\nLinux, Python, Docker, AWS, Git, REST API, Agile, Kubernetes","gt":{"email":["olivia.brown@gmail.com"],"phone":["07700 900123"],"skills":["linux","python","docker","aws","git","rest api","agile","kubernetes"],"degrees":["msc"]}},
  {"resume_id":"eval-010","text":"Amir Hassan\namir.hassan@email.com\n+20 100 123 4567\nBSc Computer Engineering, Cairo University, 2021\nJavaScript, React, Node.js, MongoDB, Docker, GraphQL","gt":{"email":["amir.hassan@email.com"],"phone":["+20 100 123 4567"],"skills":["javascript","react","node.js","mongodb","docker","graphql"],"degrees":["bsc"]}},
  {"resume_id":"eval-011","text":"Sophie Taylor\nsophie.taylor@gmail.com\n+44 7900 123456\nMSc Human-Computer Interaction, UCL, 2022\nHTML, CSS, JavaScript, React, Redux, Node.js, REST API, Agile","gt":{"email":["sophie.taylor@gmail.com"],"phone":["+44 7900 123456"],"skills":["html","css","javascript","react","node.js","rest api","agile","redux"],"degrees":["msc"]}},
  {"resume_id":"eval-012","text":"Carlos Rivera\ncarlos.rivera@gmail.com\n+52 55 1234 5678\nBSc Mathematics, UNAM, 2019\nPython, R, Machine Learning, SQL, Pandas, NumPy, TensorFlow, scikit-learn","gt":{"email":["carlos.rivera@gmail.com"],"phone":["+52 55 1234 5678"],"skills":["python","machine learning","sql","pandas","numpy","tensorflow","scikit-learn"],"degrees":["bsc"]}},
  {"resume_id":"eval-013","text":"Priya Sharma\npriya.sharma@gmail.com\n+91 98765 43210\nMSc Data Engineering, IIT Bombay, 2021\nSpark, Python, SQL, AWS, Docker, Kubernetes, MongoDB, Deep Learning","gt":{"email":["priya.sharma@gmail.com"],"phone":["+91 98765 43210"],"skills":["python","sql","aws","docker","kubernetes","mongodb","deep learning"],"degrees":["msc"]}},
  {"resume_id":"eval-014","text":"Daniel Okafor\ndaniel.okafor@gmail.com\n+234 803 123 4567\nBSc Software Engineering, University of Lagos, 2020\nJava, Python, Spring Boot, REST API, MySQL, Git, Agile, Docker","gt":{"email":["daniel.okafor@gmail.com"],"phone":["+234 803 123 4567"],"skills":["java","python","rest api","git","agile","docker"],"degrees":["bsc"]}},
  {"resume_id":"eval-015","text":"Yuki Tanaka\nyuki.tanaka@docomo.ne.jp\n+81 90 1234 5678\nMSc Computer Science, University of Tokyo, 2022\nPython, Deep Learning, PyTorch, NLP, BERT, AWS, Docker, Kubernetes","gt":{"email":["yuki.tanaka@docomo.ne.jp"],"phone":["+81 90 1234 5678"],"skills":["python","deep learning","pytorch","nlp","bert","aws","docker","kubernetes"],"degrees":["msc"]}},
  {"resume_id":"eval-016","text":"Isabella Rossi\nisabella.rossi@gmail.com\n+39 346 123 4567\nPhD Distributed Systems, Politecnico di Milano, 2020\nJava, Python, Docker, Kubernetes, Linux, Git, REST API, AWS","gt":{"email":["isabella.rossi@gmail.com"],"phone":["+39 346 123 4567"],"skills":["java","python","docker","kubernetes","linux","git","rest api","aws"],"degrees":["phd"]}},
  {"resume_id":"eval-017","text":"Ethan Zhang\nethan.zhang@gmail.com\n+1 650 555 0199\nBSc Computer Science, UC Berkeley, 2021\nReact, TypeScript, Node.js, GraphQL, MongoDB, Docker, AWS, Agile","gt":{"email":["ethan.zhang@gmail.com"],"phone":["+1 650 555 0199"],"skills":["react","typescript","node.js","graphql","mongodb","docker","aws","agile"],"degrees":["bsc"]}},
  {"resume_id":"eval-018","text":"Amara Diallo\namara.diallo@gmail.com\n+33 6 12 34 56 78\nMSc Biomedical Informatics, Sorbonne Universite, 2021\nPython, scikit-learn, pandas, SQL, R, Machine Learning, Docker","gt":{"email":["amara.diallo@gmail.com"],"phone":["+33 6 12 34 56 78"],"skills":["python","scikit-learn","pandas","sql","machine learning","docker"],"degrees":["msc"]}},
  {"resume_id":"eval-019","text":"Lucas Andrade\nlucas.andrade@gmail.com\n+55 11 91234-5678\nBSc Information Systems, USP, 2019\nJavaScript, React, Node.js, MongoDB, REST API, Git, Agile, Scrum","gt":{"email":["lucas.andrade@gmail.com"],"phone":["+55 11 91234-5678"],"skills":["javascript","react","node.js","mongodb","rest api","git","agile","scrum"],"degrees":["bsc"]}},
  {"resume_id":"eval-020","text":"Mei Lin\nmei.lin@gmail.com\n+86 135 1234 5678\nPhD Natural Language Processing, Peking University, 2022\nPython, BERT, PyTorch, NLP, TensorFlow, Docker, AWS, scikit-learn, Deep Learning","gt":{"email":["mei.lin@gmail.com"],"phone":["+86 135 1234 5678"],"skills":["python","bert","pytorch","nlp","tensorflow","docker","aws","scikit-learn","deep learning"],"degrees":["phd"]}},
]

def jaccard_f1(pred_set, gt_set):
    if not gt_set and not pred_set: return 1.0,1.0,1.0
    if not pred_set or not gt_set: return 0.0,0.0,0.0
    tp = len(pred_set & gt_set)
    p  = tp/len(pred_set) if pred_set else 0
    r  = tp/len(gt_set)   if gt_set   else 0
    f1 = 2*p*r/(p+r) if (p+r)>0 else 0
    return p,r,f1

res = {"email":[],"phone":[],"skills":[],"degrees":[],"latencies":[]}

for s in TEST_SET:
    t0 = time.time()
    rr = requests.post(PARSER_URL, json={"resume_id":s["resume_id"],"text":s["text"]}, timeout=10)
    lat = (time.time()-t0)*1000
    res["latencies"].append(lat)
    pred = rr.json()["profile"]

    pe = {pred.get("email","").lower()} if pred.get("email") else set()
    ge = {e.lower() for e in s["gt"]["email"]}
    _,_,f = jaccard_f1(pe,ge); res["email"].append(f)

    pp = {(pred.get("phone") or "").replace(" ","").replace("-","")}
    gp = {p.replace(" ","").replace("-","") for p in s["gt"]["phone"]}
    _,_,f = jaccard_f1(pp if pred.get("phone") else set(),gp); res["phone"].append(f)

    ps = {sk.lower() for sk in pred.get("skills",[])}
    gs = {sk.lower() for sk in s["gt"]["skills"]}
    p2,r2,f = jaccard_f1(ps,gs); res["skills"].append(f)

    deg_text = " ".join(d.lower() for d in pred.get("degrees",[]))
    hits = sum(1 for kw in s["gt"]["degrees"] if kw in deg_text)
    res["degrees"].append(hits/max(len(s["gt"]["degrees"]),1))

mean = lambda l: sum(l)/len(l) if l else 0

print("\n=== NER EVALUATION (Rule-Based Parser, n=20) ===")
print(f"Email         F1: {mean(res['email']):.4f}")
print(f"Phone         F1: {mean(res['phone']):.4f}")
print(f"Skills        F1: {mean(res['skills']):.4f}")
print(f"Degree        F1: {mean(res['degrees']):.4f}")
macro = mean([mean(res['email']),mean(res['phone']),mean(res['skills']),mean(res['degrees'])])
print(f"Macro-avg F1    : {macro:.4f}")
print(f"Avg Latency     : {mean(res['latencies']):.1f} ms")
lats = sorted(res['latencies'])
print(f"p95 Latency     : {lats[int(0.95*len(lats))-1]:.1f} ms")
print(f"p99 Latency     : {lats[-1]:.1f} ms")
