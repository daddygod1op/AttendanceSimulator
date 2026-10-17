
const fs = require('fs');
const zlib = require('zlib');
const { execSync } = require('child_process');

// We can run a small python script via a .py file to avoid escaping issues
fs.writeFileSync('parse_excel.py', `
import zipfile, xml.etree.ElementTree as ET

with zipfile.ZipFile(r'c:\\Users\\CS\\Downloads\\acadly+attendly\\Attendance\\Spring 2026 student_enrolled_details_0373_b94506d54af8404f852dd817b53ac91b.csv.xlsx', 'r') as z:
    sst = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        sst = [elem.text or '' for elem in tree.iter() if elem.tag.endswith('t')]
    
    tree1 = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    ns = {'d': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rows = tree1.findall('.//d:row', ns)
    print(f"Total rows: {len(rows)}")
    found_g13 = []
    found_aiml = []
    found_vyom = []
    all_students = {}

    for r in rows[1:]:
        cells = {}
        for c in r.findall('d:c', ns):
            t = c.attrib.get('t')
            v = c.find('d:v', ns)
            val = v.text if v is not None else ''
            if t == 's' and val.isdigit():
                val = sst[int(val)] if int(val) < len(sst) else val
            cells[c.attrib.get('r')[0]] = val
            # check any match
            if '2510990000' in val or 'VYOM' in val.upper():
                found_vyom.append((r.attrib.get('r'), val))
            if 'G13' in val.upper():
                found_g13.append((r.attrib.get('r'), val))
            if 'AIML' in val.upper() or 'AI & ML' in val.upper() or 'AI&ML' in val.upper():
                found_aiml.append((r.attrib.get('r'), val))

    from collections import Counter
    import re
    email_batches = Counter()
    ai_students = []
    
    import re, json
    
    students_by_roll = {}
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
            
        email = row_cells.get('C', '').strip()
        name = row_cells.get('L', '').strip()
        roll = row_cells.get('U', '').strip()
        internal_marks = row_cells.get('Z', '').strip()
        assessments_pct = row_cells.get('X', '').strip()
        
        if not roll or not re.match(r'^\d{10}$', roll):
            # Try to extract roll from email if roll is missing or weird
            # Chitkara roll numbers are 10 digits starting with 24 or 25
            m = re.search(r'(\d{4,10})', email)
            if m:
                # If roll was not 10 digits, check if roll is elsewhere
                pass
        
        if roll and len(roll) == 10 and name:
            branch_code = 'other'
            m = re.search(r'\.([a-z0-9]+)@chitkara\.edu\.in', email.lower())
            if m:
                branch_code = m.group(1)
                
            branch_label = 'BE Computer Science & Engineering'
            if 'beai' in branch_code:
                branch_label = 'BE CSE (AI & ML)'
            elif 'becse' in branch_code:
                branch_label = 'BE CSE'
            elif 'ece' in branch_code:
                branch_label = 'BE ECE'

            students_by_roll[roll] = {
                'rollNo': roll,
                'name': name,
                'email': email,
                'branch': branch_label,
                'branchCode': branch_code,
                'internalMarks': internal_marks or 'N/A',
                'assessmentsPct': assessments_pct or 'N/A'
            }

    print(f"Extracted {len(students_by_roll)} unique students with roll numbers and names!")
    
    # Check count of beai25
    ai25 = [s for s in students_by_roll.values() if 'beai25' in s['branchCode']]
    print(f"Total beai25 (AI & ML Batch 2025): {len(ai25)}")
    
    cse25 = [s for s in students_by_roll.values() if 'becse25' in s['branchCode']]
    print(f"Total becse25 (CSE Batch 2025): {len(cse25)}")
    
    # Check Vyom
    if '2510990000' in students_by_roll:
        print("Vyom Kumar record:", students_by_roll['2510990000'])
        
    # Write to batchmates_master.json
    with open('batchmates_master.json', 'w', encoding='utf-8') as f:
        json.dump(list(students_by_roll.values()), f, indent=2)
    print("Saved batchmates_master.json successfully!")

`);

try {
  const out = execSync('python parse_excel.py', { encoding: 'utf8' });
  console.log(out);
} catch (e) {
  console.error(e.message);
} finally {
  try { fs.unlinkSync('parse_excel.py'); } catch (e) {}
}
