from flask import Blueprint, request, jsonify
import subprocess
from .models import Job
from . import db
from sqlalchemy.exc import SQLAlchemyError
import os

job_routes = Blueprint("job_routes", __name__)

# Helper: Convert model to dictionary
def job_to_dict(job):
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "posting_date": job.posting_date.isoformat(),
        "job_type": job.job_type,
        "tags": job.tags.split(",") if job.tags else [],
    }

#GET /jobs — list all jobs (with filters and sort)
@job_routes.route("/jobs", methods=["GET"])
def get_jobs():
    try:
        query = Job.query

        job_type = request.args.get("job_type")
        location = request.args.get("location")
        tag = request.args.get("tag")
        sort = request.args.get("sort")

        if job_type:
            query = query.filter_by(job_type=job_type)
        if location:
            query = query.filter_by(location=location)
        if tag:
            query = query.filter(Job.tags.like(f"%{tag}%"))

        if sort == "posting_date_desc":
            query = query.order_by(Job.posting_date.desc())
        elif sort == "posting_date_asc":
            query = query.order_by(Job.posting_date.asc())

        jobs = query.all()
        return jsonify([job_to_dict(job) for job in jobs]), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch jobs", "details": str(e)}), 500

#POST /jobs — create a new job with validation

@job_routes.route("/jobs", methods=["POST"])
def create_job():
    data = request.get_json()

    required_fields = ["title", "company", "location"]
    missing_fields = [f for f in required_fields if not data.get(f)]

    if missing_fields:
        return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

    try:
        job = Job(
            title=data["title"],
            company=data["company"],
            location=data["location"],
            job_type=data.get("job_type", "Full-time"),
            tags=data.get("tags", "")
        )
        db.session.add(job)
        db.session.commit()
        return jsonify(job_to_dict(job)), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500

#GET /jobs/<id> — fetch single job
@job_routes.route("/jobs/<int:id>", methods=["GET"])
def get_job(id):
    job = Job.query.get(id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job_to_dict(job)), 200

#PUT/PATCH /jobs/<id> — update job
@job_routes.route("/jobs/<int:id>", methods=["PUT", "PATCH"])
def update_job(id):
    job = Job.query.get(id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.get_json()
    try:
        job.title = data.get("title", job.title)
        job.company = data.get("company", job.company)
        job.location = data.get("location", job.location)
        job.job_type = data.get("job_type", job.job_type)
        job.tags = data.get("tags", job.tags)

        db.session.commit()
        return jsonify(job_to_dict(job)), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update job", "details": str(e)}), 500

#DELETE /jobs/<id>
@job_routes.route("/jobs/<int:id>", methods=["DELETE"])
def delete_job(id):
    job = Job.query.get(id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    try:
        db.session.delete(job)
        db.session.commit()
        return jsonify({"message": "Job deleted successfully"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete job", "details": str(e)}), 500
    
    #GET /locations — return unique locations
@job_routes.route("/locations", methods=["GET"])
def get_locations():
    try:
        locations = db.session.query(Job.location).distinct().all()
        # Flatten result: from [(loc1,), (loc2,), ...] to [loc1, loc2, ...]
        location_list = [loc[0] for loc in locations]
        return jsonify(location_list), 200
    except SQLAlchemyError as e:
        return jsonify({"error": "Failed to fetch locations", "details": str(e)}), 500


@job_routes.route("/tags", methods=["GET"])
def get_tags():
    try:
        jobs = Job.query.with_entities(Job.tags).all()
        tag_set = set()

        for (tag_string,) in jobs:
            if tag_string:
                tag_set.update(t.strip() for t in tag_string.split(",") if t.strip())

        return jsonify(sorted(tag_set)), 200
    except SQLAlchemyError as e:
        return jsonify({"error": "Failed to fetch tags", "details": str(e)}), 500

@job_routes.route("/scrape", methods=["POST"])
def run_scraper():
    try:
        # Absolute path to app/scraper.py
        script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "scraper.py"))

        result = subprocess.run(
            ["python3", script_path],
            capture_output=True,
            text=True
        )

        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)

        if result.returncode != 0:
            return jsonify({
                "error": "Scraping failed",
                "details": result.stderr
            }), 500

        return jsonify({"message": "Scraping completed successfully!"}), 200

    except Exception as e:
        print("EXCEPTION:", str(e))
        return jsonify({"error": "Scraping failed", "details": str(e)}), 500
