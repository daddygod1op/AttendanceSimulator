import zipfile, xml.etree.ElementTree as ET, re

excel_path = r'C:\Users\CS\Downloads\Spring 2026 student_enrolled_details_0373_b94506d54af8404f852dd817b53ac91b.csv.xlsx'

with zipfile.ZipFile(excel_path, 'r') as z:
    sst = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        sst = [elem.text or '' for elem in tree.iter() if elem.tag.endswith('t')]
    
    tree1 = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    ns = {'d': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rows = tree1.findall('.//d:row', ns)
    
    for r in rows:
        row_cells = {}
        for c in r.findall('d:c', ns):
            ref = c.attrib.get('r', '')
            col = re.match(r'([A-Z]+)', ref).group(1)
            t = c.attrib.get('t')
            v = c.find('d:v', ns)
            val = v.text if v is not None else ''
            if t == 's' and val.isdigit():
                val = sst[int(val)] if int(val) < len(sst) else val
            row_cells[col] = val
        
        email = row_cells.get('C', '')
        roll = row_cells.get('U', '')
        if '2510992791' in roll or '2791' in email or 'vishal' in email.lower():
            if '2791' in email:
                print("Found row for 2510992791:")
                for k in sorted(row_cells.keys()):
                    print(f"  {k}: {row_cells[k]}")
