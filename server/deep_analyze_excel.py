import zipfile, xml.etree.ElementTree as ET, re
from collections import Counter

excel_path = r'C:\Users\CS\Downloads\Spring 2026 student_enrolled_details_0373_b94506d54af8404f852dd817b53ac91b.csv.xlsx'

with zipfile.ZipFile(excel_path, 'r') as z:
    sst = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        sst = [elem.text or '' for elem in tree.iter() if elem.tag.endswith('t')]
    
    tree1 = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    ns = {'d': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rows = tree1.findall('.//d:row', ns)
    
    print(f"Total rows: {len(rows)}")
    
    email_batches = Counter()
    courses = Counter()
    roll_prefixes = Counter()
    
    sample_beai25 = []
    sample_g13 = []
    
    for r in rows[1:]:
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
        name = row_cells.get('G', '') # Notice column G has name!
        roll = row_cells.get('U', '') # Notice column U has roll!
        
        m = re.search(r'\.([a-z0-9]+)@', email.lower())
        if m:
            email_batches[m.group(1)] += 1
            
        if len(roll) >= 4:
            roll_prefixes[roll[:4]] += 1
            
        if 'beai25' in email.lower():
            if len(sample_beai25) < 5:
                sample_beai25.append((roll, name, email, row_cells.get('H', ''), row_cells.get('B', '')))
                
        # check if any cell mentions G13
        for k, v in row_cells.items():
            if 'G13' in v.upper():
                sample_g13.append((roll, name, email, k, v))

    print("\nEmail Batches Top 15:")
    for b, c in email_batches.most_common(15):
        print(f"  {b}: {c}")
        
    print("\nRoll prefixes:")
    for p, c in roll_prefixes.most_common(10):
        print(f"  {p}: {c}")
        
    print(f"\nTotal beai25 found: {email_batches.get('beai25', 0)}")
    print(f"Total G13 occurrences: {len(sample_g13)}")
    if sample_g13:
        print("Sample G13:", sample_g13[:3])
    print("Sample beai25:", sample_beai25)
