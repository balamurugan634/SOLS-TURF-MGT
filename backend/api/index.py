import os
import sys

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
