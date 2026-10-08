import requests

API = 'http://127.0.0.1:8000/api'

# 1. Customer registration & login
r = requests.post(f'{API}/register/', json={'name':'Test Customer', 'email':'flow4@example.com', 'password':'TestPassword123!', 'role':'customer', 'business_name':'Test Business'})
print('Register:', r.status_code)

r = requests.post(f'{API}/login/', json={'email':'flow4@example.com', 'password':'TestPassword123!'})
token = r.json().get('access')
headers = {'Authorization': f'Bearer {token}'}

# 2. Customer creates RFQ
r = requests.post(f'{API}/quotations/rfq/', headers=headers, json={'product_type': 'custom', 'custom_product_name': 'Flow Test Item', 'quantity': 5, 'required_by_date': '2026-10-10', 'delivery_location': 'Test Location'})
rfq_id = r.json().get('id')
print('RFQ ID:', rfq_id)

# 3. Admin login
r = requests.post(f'{API}/login/', json={'email':'admin@electrohub.com', 'password':'AdminPass123!'}) 
admin_token = r.json().get('access')

# If that fails, try to create superuser programmatically via django shell, but let's assume we can login with admin@electrohub.com / AdminPass123!
if not admin_token:
    r = requests.post(f'{API}/auth/login/', json={'email':'admin@electrohub.com', 'password':'AdminPass123!'})
    admin_token = r.json().get('access')

if not admin_token:
    print('Failed admin login')
    exit()

admin_headers = {'Authorization': f'Bearer {admin_token}'}

# 4. Admin creates quotation for RFQ
r = requests.post(f'{API}/admin/quotations/', headers=admin_headers, json={
    'rfq': rfq_id,
    'product_name': 'Flow Test Item',
    'product_type': 'custom',
    'quantity': 5,
    'unit_price': 1000.0,
    'delivery_location': 'Test Location',
    'items': [{'name': 'Flow Test Item', 'description': 'desc', 'quantity': 5, 'unit_price': 1000.0}]
})
quotation_id = r.json().get('id')
print('Admin Create Quotation:', r.status_code, r.text)

if not quotation_id:
    # Check if we need to use a different endpoint
    pass

# 5. Admin sends quotation
r = requests.post(f'{API}/admin/quotations/{quotation_id}/send/', headers=admin_headers)
print('Admin Send Quotation:', r.status_code)

# 6. Customer accepts quotation
r = requests.patch(f'{API}/quotations/{quotation_id}/accept/', headers=headers)
print('Customer Accept Quotation:', r.status_code, r.text)

# 7. Download PDF
r = requests.get(f'{API}/quotations/{quotation_id}/invoice/pdf/?token={token}')
print('Download PDF:', r.status_code)
print('PDF Content start:', r.text[:200])
