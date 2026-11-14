#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --no-input
python manage.py shell -c "from accounts.models import CustomUser; CustomUser.objects.filter(email='admin@adrware.mg').exists() or CustomUser.objects.create_superuser('ainakely', '', 'Ainakely123')"