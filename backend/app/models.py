from . import db
from datetime import datetime

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    company = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(120), nullable=False)
    posting_date = db.Column(db.DateTime, default=datetime.utcnow)
    job_type = db.Column(db.String(50))
    tags = db.Column(db.String(250))  # Comma-separated tags
