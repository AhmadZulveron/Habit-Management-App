from docx import Document

doc_path = r"d:\flutterAhmadZulveron\Try\Docs\LAPORAN TUGAS AKHIR.docx"
doc = Document(doc_path)

for p in doc.paragraphs:
    # 1. Remove "autentikasi, "
    if "seperti autentikasi, pengelolaan habit" in p.text:
        p.text = p.text.replace("seperti autentikasi, pengelolaan habit", "seperti pengelolaan habit")
        
    # 2. Refine "membuktikan bahwa validasi..." -> "menunjukkan bahwa validasi..."
    if "membuktikan bahwa validasi formulir berjalan sesuai dengan skenario pengujian." in p.text:
        p.text = p.text.replace("membuktikan bahwa validasi formulir berjalan sesuai dengan skenario pengujian.", "menunjukkan bahwa validasi formulir memberikan respons sesuai dengan skenario pengujian.")

doc.save(r"d:\flutterAhmadZulveron\Try\Docs\LAPORAN TUGAS AKHIR.docx")
print("SUCCESS!")
