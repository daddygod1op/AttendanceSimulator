import zipfile, xml.etree.ElementTree as ET, re

with zipfile.ZipFile(r'C:\Users\CS\Downloads\Spring 2026 student_enrolled_details_0373_b94506d54af8404f852dd817b53ac91b.csv.xlsx', 'r') as z:
    sst = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        sst = [elem.text or '' for elem in tree.iter() if elem.tag.endswith('t')]
    tree1 = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    ns = {'d': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rows = tree1.findall('.//d:row', ns)
    
    header = {}
    for c in rows[0].findall('d:c', ns):
        ref = c.attrib.get('r', '')
        col = re.match(r'([A-Z]+)', ref).group(1)
        t = c.attrib.get('t')
        v = c.find('d:v', ns)
        val = v.text if v is not None else ''
        if t == 's' and val.isdigit():
            val = sst[int(val)] if int(val) < len(sst) else val
        header[col] = val
    print('Headers:')
    for col, name in sorted(header.items()):
        print(f"  {col}: {name}")
    
    r2 = {}
    for c in rows[1].findall('d:c', ns):
        ref = c.attrib.get('r', '')
        col = re.match(r'([A-Z]+)', ref).group(1)
        t = c.attrib.get('t')
        v = c.find('d:v', ns)
        val = v.text if v is not None else ''
        if t == 's' and val.isdigit():
            val = sst[int(val)] if int(val) < len(sst) else val
        r2[col] = val
    print('\nRow 2 Sample:')
    for col, val in sorted(r2.items()):
        print(f"  {col} ({header.get(col, '')}): {val}")
