"use client";

import { useEffect, useState } from "react";
import API from "@/app/lib/api";

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [tags, setTags] = useState([]);

  const [filters, setFilters] = useState({
    keyword: "",
    jobType: "All",
    location: "All",
    tags: [],
  });

  const [sortOrder, setSortOrder] = useState("default");

  useEffect(() => {
    fetchJobs();
    fetchLocations();
    fetchTags();
  }, []);

  const fetchJobs = () => {
    API.get("/jobs")
      .then((res) => {
        console.log("Fetched jobs:", res.data);
        setJobs(res.data);
      })
      .catch((err) => console.error("Error fetching jobs:", err));
  };

  const fetchLocations = () => {
    API.get("/locations")
      .then((res) => setLocations(["All", ...res.data]))
      .catch((err) => console.error("Error fetching locations:", err));
  };

  const fetchTags = () => {
    API.get("/tags")
      .then((res) => setTags(res.data))
      .catch((err) => console.error("Error fetching tags:", err));
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this job?")) {
      try {
        await API.delete(`/jobs/${id}`);
        fetchJobs();
      } catch (err) {
        console.error("Failed to delete job:", err);
      }
    }
  };

  const handleScrape = async () => {
    if (confirm("Run scraper to fetch new job listings?")) {
      try {
        const res = await API.post("/scrape");
        alert(res.data.message || "Scraping done.");
        fetchJobs(); // refresh job list
      } catch (err) {
        console.error("Scrape error:", err);
        alert("Scraping failed. Check console for details.");
      }
    }
  };

  const handleDeleteAll = async () => {
    if (
      confirm("⚠️ This will permanently delete all job listings. Continue?")
    ) {
      try {
        await Promise.all(jobs.map((job) => API.delete(`/jobs/${job.id}`)));
        fetchJobs();
      } catch (err) {
        console.error("Failed to delete all jobs:", err);
      }
    }
  };

  const resetFilters = () => {
    setFilters({
      keyword: "",
      jobType: "All",
      location: "All",
      tags: [],
    });
    setSortOrder("default");
  };

  const filteredJobs = jobs.filter((job) => {
    const keywordMatch =
      filters.keyword === "" ||
      job.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
      job.company.toLowerCase().includes(filters.keyword.toLowerCase());

    const jobTypeMatch =
      filters.jobType === "All" || job.job_type === filters.jobType;

    const locationMatch =
      filters.location === "All" || job.location === filters.location;

    const tagsMatch =
      filters.tags.length === 0 ||
      filters.tags.every((tag) =>
        job.tags.map((t) => t.trim().toLowerCase()).includes(tag.toLowerCase())
      );

    return keywordMatch && jobTypeMatch && locationMatch && tagsMatch;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortOrder === "title") return a.title.localeCompare(b.title);
    if (sortOrder === "company") return a.company.localeCompare(b.company);
    return 0;
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-6 text-white">
        Job Listings
      </h1>

      {/* Top-right Controls */}
      <div className="flex justify-end gap-4 mb-4">
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={resetFilters}
        >
          Reset Filters
        </button>
        {jobs.length > 0 && (
          <button
            className="text-sm text-red-600 hover:underline"
            onClick={handleDeleteAll}
          >
            Delete All Jobs
          </button>
        )}
        <button
          className="text-sm text-green-600 hover:underline"
          onClick={handleScrape}
        >
          Scrape Jobs
        </button>
      </div>

      {/* Filters Section */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by title or company"
          className="border px-4 py-2 rounded-md w-full"
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
        />
        <select
          className="border px-4 py-2 rounded-md w-full"
          value={filters.jobType}
          onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
        >
          <option value="All">All Job Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Internship">Internship</option>
        </select>
        <select
          className="border px-4 py-2 rounded-md w-full"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        >
          {locations.map((loc, i) => (
            <option key={i} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        {/* Tags */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-wrap gap-3">
          {tags.map((tag) => (
            <label key={tag} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                value={tag}
                checked={filters.tags.includes(tag)}
                onChange={() => {
                  const updatedTags = filters.tags.includes(tag)
                    ? filters.tags.filter((t) => t !== tag)
                    : [...filters.tags, tag];
                  setFilters({ ...filters, tags: updatedTags });
                }}
              />
              <span>{tag}</span>
            </label>
          ))}
        </div>

        <select
          className="border px-4 py-2 rounded-md w-full"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="default">Sort By</option>
          <option value="title">Title (A–Z)</option>
          <option value="company">Company (A–Z)</option>
        </select>
      </div>

      {/* Job Listings */}
      {sortedJobs.length === 0 ? (
        <p className="text-center text-gray-500">No matching jobs found.</p>
      ) : (
        <div className="space-y-6">
          {sortedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white shadow-md border border-gray-200 rounded-xl p-6 relative hover:shadow-lg transition"
            >
              <button
                onClick={() => handleDelete(job.id)}
                className="absolute top-3 right-4 text-red-600 text-sm hover:text-red-800 transition"
              >
                Delete
              </button>
              <a
                href={`/edit-job/${job.id}`}
                className="absolute top-3 right-20 text-sm text-blue-600 hover:underline"
              >
                Edit
              </a>
              <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
              <p className="text-gray-700">
                {job.company} — {job.location}
              </p>
              <p className="text-sm text-blue-600 mt-1">{job.job_type}</p>

              <div className="mt-4 flex flex-wrap gap-3">
                {job.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-sm"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
