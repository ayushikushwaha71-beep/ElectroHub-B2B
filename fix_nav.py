import re

with open('lib/data/products.ts', 'r', encoding='utf-8') as f:
    p_content = f.read()

id_matches = re.findall(r"id:\s*'([^']+)'", p_content)
name_matches = re.findall(r"name:\s*'([^']+)'", p_content)
products = [{'id': id_matches[i], 'name': name_matches[i].lower()} for i in range(len(id_matches))]

with open('lib/data/navigation.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'href:' in line and '/categories/' in line and 'count:' in line:
        label_m = re.search(r"label:\s*'([^']+)'", line)
        if label_m:
            label = label_m.group(1).lower()
            for p in products:
                # simple matching
                if label in p['name'] or p['name'] in label or (label.replace(' ', '') in p['name'].replace(' ', '')):
                    line = re.sub(r"href:\s*'[^']+'", f"href: '/product/{p['id']}'", line)
                    break
    new_lines.append(line)

with open('lib/data/navigation.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
